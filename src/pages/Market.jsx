import { useState } from 'react';
import { MARKET_ASSETS, TRANSACTIONS, PRICE_HISTORY } from '../data/index.js';
import './Market.css';

const TYPE_TAG = { sale: 'tag-green', offer: 'tag-red', list: 'tag-grey', transfer: 'tag-grey' };
const TYPE_LABEL = { sale: 'Sale', offer: 'Offer', list: 'List', transfer: 'Transfer' };

export default function Market() {
  const [selectedAsset, setSelectedAsset] = useState(MARKET_ASSETS[0]);
  const [txFilter, setTxFilter]           = useState('all');
  const [timeRange, setTimeRange]         = useState('all');
  const [assets, setAssets]              = useState(MARKET_ASSETS);

  const txShown = txFilter === 'djpepe'
    ? TRANSACTIONS.filter(t => t.asset === 'DJPEPE')
    : TRANSACTIONS;

  /* ── CHART POINTS ─────────────────────────────────────── */
  const W = 440, H = 120, PAD = 24;
  const vals  = PRICE_HISTORY.map(p => p.value);
  const minV  = Math.min(...vals);
  const maxV  = Math.max(...vals);
  const range = maxV - minV || 1;
  const pts   = PRICE_HISTORY.map((p, i) => ({
    x: PAD + (i / (PRICE_HISTORY.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((p.value - minV) / range) * (H - PAD * 2),
    ...p,
  }));
  const linePath  = pts.map((p,i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath  = linePath + ` L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`;
  const yLabels   = [maxV, (maxV+minV)/2, minV].map(v => ({
    y: H - PAD - ((v - minV) / range) * (H - PAD * 2),
    v: v.toFixed(2),
  }));

  return (
    <div className="market-page">

      {/* ── METRICS ─────────────────────────────────────── */}
      <div className="metrics-row">
        {[
          { label: 'DJPEPE Floor', val: '14.82', chg: '▲ +2.3% 24h', cls: 'green' },
          { label: 'Total Volume', val: '287',   chg: 'ETH all-time', cls: '' },
          { label: 'Last Sale',    val: '14.02', chg: '2 hours ago',  cls: '' },
          { label: 'Holders',      val: '3',     chg: 'of 4 supply',  cls: '' },
          { label: 'Best Offer',   val: '12.50', chg: '● Pending',    cls: 'red' },
        ].map(m => (
          <div key={m.label} className="metric-box">
            <div className="metric-label">{m.label}</div>
            <div className={`metric-val ${m.cls}`}>{m.val}</div>
            <div className={`metric-chg ${m.cls}`}>{m.chg}</div>
          </div>
        ))}
      </div>

      <div className="market-layout">

        {/* ── LEFT COLUMN ─────────────────────────────── */}
        <div className="market-left">

          {/* CHART */}
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">
                {selectedAsset.name} price history
                <span className="panel-sub">All time</span>
              </div>
              <div className="filter-tabs">
                {['7D','30D','All'].map(t => (
                  <button
                    key={t}
                    className={`filter-tab ${timeRange === t.toLowerCase() ? 'active' : ''}`}
                    onClick={() => setTimeRange(t.toLowerCase())}
                  >{t}</button>
                ))}
              </div>
            </div>
            <div className="chart-wrap">
              <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#3dff6e" stopOpacity="0.22"/>
                    <stop offset="100%" stopColor="#3dff6e" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {/* grid */}
                {yLabels.map((l,i) => (
                  <g key={i}>
                    <line x1={PAD} y1={l.y} x2={W-PAD} y2={l.y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
                    <text x={2} y={l.y+4} fill="rgba(200,210,200,0.22)" fontSize="8" fontFamily="DM Sans">{l.v}</text>
                  </g>
                ))}
                {/* area + line */}
                <path d={areaPath} fill="url(#chartGrad)"/>
                <path d={linePath} fill="none" stroke="#3dff6e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                {/* last point dot */}
                <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="3.5" fill="#3dff6e"/>
                {/* year labels */}
                {pts.filter(p => p.label).map((p,i) => (
                  <text key={i} x={p.x} y={H-2} fill="rgba(200,210,200,0.2)" fontSize="8" fontFamily="DM Sans" textAnchor="middle">{p.label}</text>
                ))}
                {/* current price callout */}
                <text x={pts[pts.length-1].x+6} y={pts[pts.length-1].y+4} fill="#3dff6e" fontSize="9" fontFamily="Syne" fontWeight="700">
                  {selectedAsset.floor}
                </text>
              </svg>
            </div>
          </div>

          {/* TRANSACTIONS */}
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">Transaction history</div>
              <div className="filter-tabs">
                {['all','djpepe'].map(f => (
                  <button
                    key={f}
                    className={`filter-tab ${txFilter === f ? 'active' : ''}`}
                    onClick={() => setTxFilter(f)}
                  >
                    {f === 'all' ? 'All assets' : 'DJPEPE only'}
                  </button>
                ))}
              </div>
            </div>
            <div className="tx-table-wrap">
              <table className="tx-table">
                <thead>
                  <tr>
                    <th>Asset</th><th>Type</th><th>Value</th>
                    <th>From</th><th>To</th><th>Time</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {txShown.length === 0 ? (
                    <tr><td colSpan={7} className="tx-empty">No transactions yet.</td></tr>
                  ) : txShown.map(tx => (
                    <tr key={tx.id} className="tx-row">
                      <td className="tx-asset">{tx.asset}</td>
                      <td><span className={`tag ${TYPE_TAG[tx.type]}`}>{TYPE_LABEL[tx.type]}</span></td>
                      <td className={tx.type === 'sale' ? 'tx-green' : tx.type === 'offer' ? 'tx-red' : 'tx-grey'}>
                        {tx.value ? `${tx.value} ETH` : '—'}
                      </td>
                      <td className="tx-addr">{tx.from}</td>
                      <td className="tx-addr">{tx.to || '—'}</td>
                      <td className="tx-time">{tx.time}</td>
                      <td>
                        {tx.type === 'list'
                          ? <a href={selectedAsset.buyUrl} target="_blank" rel="noreferrer" className="btn-sm btn-sm-green">Buy</a>
                          : <button className="btn-sm btn-sm-outline">↗ View</button>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── ASSET SIDEBAR ────────────────────────────── */}
        <div className="asset-sidebar">
          <div className="sec-label">Tracked Assets</div>

          {assets.map(a => (
            <div
              key={a.id}
              className={`asset-card ${selectedAsset.id === a.id ? 'selected' : ''}`}
              onClick={() => setSelectedAsset(a)}
            >
              <div className="ac-row">
                <div className={`ac-icon ${a.bg}`}>{a.icon}</div>
                <div className="ac-info">
                  <div className="ac-name">{a.name}</div>
                  <div className="ac-tick">{a.ticker} · {a.chain}</div>
                </div>
                <div className="ac-price-col">
                  <div className="ac-price">{a.floor}</div>
                  <div className={`ac-change ${a.change >= 0 ? 'green' : 'red'}`}>
                    {a.change >= 0 ? '▲' : '▼'} {Math.abs(a.change).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="ac-footer">
                <span>Supply: {a.supply}</span>
                <span>Floor: {a.floor}</span>
                <span>Vol: {a.volume}</span>
              </div>
            </div>
          ))}

          <div className="add-asset">+ Add asset</div>

          <div className="sidebar-actions">
            <a href={selectedAsset.buyUrl} target="_blank" rel="noreferrer" className="btn btn-green sidebar-btn">
              Buy {selectedAsset.ticker} ↗
            </a>
            <a href="https://pepe.wtf" target="_blank" rel="noreferrer" className="btn btn-outline sidebar-btn">
              View on Pepe.WTF ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
