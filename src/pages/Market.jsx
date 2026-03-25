import { useState } from 'react';
import { MARKET_ASSETS, TRANSACTIONS, PRICE_HISTORY } from '../data/index.js';
import './Market.css';

const TYPE_TAG   = { sale: 'tag-green', offer: 'tag-red', list: 'tag-grey', transfer: 'tag-grey' };
const TYPE_LABEL = { sale: 'Sale', offer: 'Offer', list: 'List', transfer: 'Transfer' };

const d  = v => (v !== null && v !== undefined) ? String(v) : '—';
const de = v => (v !== null && v !== undefined) ? `${v} ETH` : '—';
const pctLabel = v => {
  if (v === null || v === undefined) return { txt: 'No data', cls: '' };
  return { txt: `${v > 0 ? '▲' : '▼'} ${Math.abs(v).toFixed(1)}% 24h`, cls: v > 0 ? 'green' : 'red' };
};

export default function Market() {
  const [selectedAsset, setSelectedAsset] = useState(MARKET_ASSETS[0]);
  const [txFilter, setTxFilter]           = useState('all');
  const [timeRange, setTimeRange]         = useState('all');

  const txShown = txFilter === 'fakedjpepe'
    ? TRANSACTIONS.filter(t => t.asset === 'FAKEDJPEPE')
    : TRANSACTIONS;

  const W = 440, H = 120, PAD = 28;
  const vals = PRICE_HISTORY.map(p => p.value);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;
  const pts = PRICE_HISTORY.map((p, i) => ({
    x: PAD + (i / (PRICE_HISTORY.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((p.value - minV) / range) * (H - PAD * 2 - 10),
    ...p,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = linePath + ` L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`;
  const yLabels  = [maxV, (maxV+minV)/2, minV].map(v => ({
    y: H - PAD - ((v - minV) / range) * (H - PAD * 2 - 10),
    v: v.toFixed(1),
  }));

  const pct = pctLabel(selectedAsset.change);

  return (
    <div className="market-page">

      <div className="metrics-row">
        {[
          { label: 'Floor price', val: d(selectedAsset.floor),      chg: pct.txt,                                              cls: pct.cls },
          { label: 'Supply',      val: d(selectedAsset.supply),     chg: 'Total minted',                                       cls: '' },
          { label: 'Last sale',   val: de(selectedAsset.lastSale),  chg: selectedAsset.lastSale ? 'See xchain.io' : 'No data', cls: '' },
          { label: 'Holders',     val: d(selectedAsset.holders),    chg: selectedAsset.supply ? `of ${selectedAsset.supply}` : '—', cls: '' },
          { label: 'Best offer',  val: de(selectedAsset.bestOffer), chg: selectedAsset.bestOffer ? '● Pending' : 'No offers',  cls: selectedAsset.bestOffer ? 'red' : '' },
        ].map(m => (
          <div key={m.label} className="metric-box">
            <div className="metric-label">{m.label}</div>
            <div className={`metric-val ${m.val === '—' ? 'dim' : m.cls}`}>{m.val}</div>
            <div className={`metric-chg ${m.cls}`}>{m.chg}</div>
          </div>
        ))}
      </div>

      {selectedAsset.floor === null && (
        <div className="data-notice">
          <span className="notice-dot" />
          Live data pending — update <code>src/data/index.js</code> with values from{' '}
          <a href={selectedAsset.xcUrl} target="_blank" rel="noreferrer">xchain.io/asset/{selectedAsset.ticker}</a>
          {selectedAsset.subasset && <span> · subasset: {selectedAsset.subasset}</span>}
        </div>
      )}

      <div className="market-layout">
        <div className="market-left">

          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">
                DJPEPE price history
                <span className="panel-sub">all time · illustrative</span>
              </div>
              <div className="filter-tabs">
                {['7D','30D','All'].map(t => (
                  <button key={t} className={`filter-tab ${timeRange === t.toLowerCase() ? 'active' : ''}`} onClick={() => setTimeRange(t.toLowerCase())}>{t}</button>
                ))}
              </div>
            </div>
            <div className="chart-wrap">
              <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#3dff6e" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="#3dff6e" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {yLabels.map((l, i) => (
                  <g key={i}>
                    <line x1={PAD} y1={l.y} x2={W-4} y2={l.y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
                    <text x="2" y={l.y+4} fill="rgba(200,210,200,0.22)" fontSize="8" fontFamily="DM Sans">{l.v}</text>
                  </g>
                ))}
                <path d={areaPath} fill="url(#cg)"/>
                <path d={linePath} fill="none" stroke="#3dff6e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="3.5" fill="#3dff6e"/>
                {pts.filter(p => p.label).map((p, i) => (
                  <text key={i} x={p.x} y={H-2} fill="rgba(200,210,200,0.2)" fontSize="8" fontFamily="DM Sans" textAnchor="middle">{p.label}</text>
                ))}
              </svg>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">Transaction history</div>
              <div className="filter-tabs">
                <button className={`filter-tab ${txFilter==='all' ? 'active':''}`} onClick={()=>setTxFilter('all')}>All assets</button>
                <button className={`filter-tab ${txFilter==='fakedjpepe' ? 'active':''}`} onClick={()=>setTxFilter('fakedjpepe')}>FAKEDJPEPE</button>
              </div>
            </div>
            <div className="tx-table-wrap">
              <table className="tx-table">
                <thead>
                  <tr><th>Asset</th><th>Type</th><th>Value</th><th>From</th><th>To</th><th>Time</th><th></th></tr>
                </thead>
                <tbody>
                  {txShown.length === 0
                    ? <tr><td colSpan={7} className="tx-empty">No transactions yet.</td></tr>
                    : txShown.map(tx => (
                      <tr key={tx.id} className="tx-row">
                        <td className="tx-asset">{tx.asset}</td>
                        <td><span className={`tag ${TYPE_TAG[tx.type]}`}>{TYPE_LABEL[tx.type]}</span></td>
                        <td className={tx.type==='sale' ? 'tx-green' : tx.type==='offer' ? 'tx-red' : 'tx-grey'}>
                          {tx.value ? `${tx.value} ETH` : '—'}
                        </td>
                        <td className="tx-addr">{tx.from}</td>
                        <td className="tx-addr">{tx.to || '—'}</td>
                        <td className="tx-time">{tx.time}</td>
                        <td>
                          <a href={tx.xcUrl || selectedAsset.xcUrl} target="_blank" rel="noreferrer" className="btn-sm btn-sm-outline">↗ View</a>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="asset-sidebar">
          <div className="sec-label">Tracked Assets</div>

          {MARKET_ASSETS.map(a => (
            <div key={a.id} className={`asset-card ${selectedAsset.id === a.id ? 'selected' : ''}`} onClick={() => setSelectedAsset(a)}>
              <div className="ac-row">
                <div className={`ac-icon ${a.bg}`}>{a.icon}</div>
                <div className="ac-info">
                  <div className="ac-name">{a.name}</div>
                  <div className="ac-tick">{a.ticker} · {a.chain}</div>
                </div>
                <div className="ac-price-col">
                  <div className={`ac-price ${a.floor === null ? 'dim' : ''}`}>{a.floor !== null ? a.floor : '—'}</div>
                  {a.change !== null
                    ? <div className={`ac-change ${a.change >= 0 ? 'green' : 'red'}`}>{a.change >= 0 ? '▲' : '▼'} {Math.abs(a.change).toFixed(1)}%</div>
                    : <div className="ac-change" style={{color:'var(--txt3)'}}>—</div>
                  }
                </div>
              </div>
              <div className="ac-footer">
                <span>Supply: {d(a.supply)}</span>
                <span>Floor: {d(a.floor)}</span>
                <span>Vol: {d(a.volume)}</span>
              </div>
            </div>
          ))}

          <div className="add-asset">+ Add asset</div>

          <div className="sidebar-actions">
            <a href={selectedAsset.buyUrl} target="_blank" rel="noreferrer" className="btn btn-green sidebar-btn">Buy on Pepe.WTF ↗</a>
            <a href={selectedAsset.xcUrl}  target="_blank" rel="noreferrer" className="btn btn-outline sidebar-btn">XChain Explorer ↗</a>
          </div>
        </div>
      </div>
    </div>
  );
}
