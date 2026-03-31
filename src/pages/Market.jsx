import { useState, useEffect, useCallback } from 'react';
import { MARKET_ASSETS } from '../data/index.js';
import { CACHE_TTL } from '../lib/constants.js';
import './Market.css';

const TYPE_TAG   = { transfer:'tag-grey', offer:'tag-red', bid:'tag-green', sale:'tag-green', list:'tag-grey' };
const TYPE_LABEL = { transfer:'Transfer', offer:'Offer',   bid:'Bid',       sale:'Sale',      list:'List' };

const displayVal = v => (v !== null && v !== undefined) ? String(v) : '—';
const displayBtc = v => (v !== null && v !== undefined) ? `${v} BTC` : '—';

const ASSET_TICKERS = MARKET_ASSETS.map(a => a.ticker).join(',');

// Cache
let cache = null;
let cacheTime = 0;

export default function Market({ onMarketUpdate }) {
  const [selectedId, setSelectedId] = useState(MARKET_ASSETS[0].id);
  const [liveData,   setLiveData]   = useState(null);
  const [txFilter,   setTxFilter]   = useState('all');
  const [status,     setStatus]     = useState('loading');

  // Merge static asset config with live API data
  const buildAsset = useCallback((staticAsset) => {
    const live = liveData?.[staticAsset.ticker];
    return {
      ...staticAsset,
      floor:     live?.floor     ?? staticAsset.floor,
      supply:    live?.supply    ?? staticAsset.supply,
      holders:   live?.holders   ?? staticAsset.holders,
      volume:    staticAsset.volume,
      lastSale:  staticAsset.lastSale,
      bestOffer: staticAsset.bestOffer,
      description: live?.description ?? '',
      locked:    live?.locked    ?? false,
      issuer:    live?.issuer    ?? null,
      fetchedAt: live?.fetchedAt ?? null,
    };
  }, [liveData]);

  const assets   = MARKET_ASSETS.map(buildAsset);
  const selected = assets.find(a => a.id === selectedId) ?? assets[0];

  // Live transactions
  const liveTxs = liveData?.[selected.ticker]?.transactions ?? [];
  const allTxs = liveTxs.length > 0
    ? liveTxs
    : [{ id:'p1', asset:selected.ticker, type:'transfer', value:null, from:'—', to:'—', time:'—', xcUrl:selected.xcUrl }];

  const txShown = txFilter === 'selected'
    ? allTxs.filter(t => t.asset === selected.ticker)
    : allTxs;

  // Fetch live data
  const fetchMarket = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cache && now - cacheTime < CACHE_TTL) {
      setLiveData(cache);
      setStatus('live');
      return;
    }
    setStatus('loading');
    try {
      const res  = await fetch(`/api/market?asset=${ASSET_TICKERS}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      cache     = json.assets;
      cacheTime = now;
      setLiveData(json.assets);
      setStatus('live');
    } catch (err) {
      console.warn('[market fetch]', err);
      setStatus(cache ? 'stale' : 'error');
      if (cache) setLiveData(cache);
    }
  }, []);

  useEffect(() => { fetchMarket(); }, [fetchMarket]);
  useEffect(() => {
    const id = setInterval(() => fetchMarket(true), CACHE_TTL);
    return () => clearInterval(id);
  }, [fetchMarket]);

  // Report market summary to App for Ticker/Header
  useEffect(() => {
    const djpepe = liveData?.DJPEPE;
    onMarketUpdate?.({
      floor: djpepe?.floor ?? null,
      supply: djpepe?.supply ?? 169,
      status,
    });
  }, [liveData, status, onMarketUpdate]);

  const pctCls = selected.change > 0 ? 'green' : selected.change < 0 ? 'red' : '';
  const pctTxt = selected.change != null
    ? `${selected.change > 0 ? '▲' : '▼'} ${Math.abs(selected.change).toFixed(1)}% 24h`
    : '—';

  return (
    <div className="market-page">

      {/* ── STATUS BAR ──────────────────────────────────── */}
      <div className={`market-status ${status}`}>
        <span className="ms-dot"/>
        {status === 'loading' && 'Fetching live data from Counterparty…'}
        {status === 'live'    && `Live · Counterparty API · refreshes every 60s · last updated ${selected.fetchedAt ? new Date(selected.fetchedAt).toLocaleTimeString() : '—'}`}
        {status === 'stale'   && 'Using cached data · API unreachable'}
        {status === 'error'   && <>Could not reach Counterparty API · <button className="ms-retry" onClick={() => fetchMarket(true)}>retry</button></>}
      </div>

      {/* ── METRICS ─────────────────────────────────────── */}
      <div className="metrics-row">
        {[
          { label: 'Floor price', val: selected.floor ? `${selected.floor} BTC` : '—', chg: pctTxt, cls: pctCls },
          { label: 'Supply',      val: displayVal(selected.supply),     chg: 'Total issued',                                      cls: '' },
          { label: 'Last sale',   val: displayBtc(selected.lastSale),   chg: selected.lastSale ? 'pepe.wtf' : 'See pepe.wtf',    cls: '' },
          { label: 'Holders',     val: displayVal(selected.holders),    chg: selected.supply ? `of ${selected.supply} minted` : '—', cls: '' },
          { label: 'Best offer',  val: displayBtc(selected.bestOffer),  chg: selected.bestOffer ? '● Pending' : 'No open offers', cls: selected.bestOffer ? 'red' : '' },
        ].map(m => (
          <div key={m.label} className="metric-box">
            <div className="metric-label">{m.label}</div>
            <div className={`metric-val ${m.val === '—' ? 'dim' : m.cls}`}>{m.val}</div>
            <div className={`metric-chg ${m.cls}`}>{m.chg}</div>
          </div>
        ))}
      </div>

      <div className="market-layout">
        <div className="market-left">

          {/* PRICE HISTORY — link to external source */}
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">
                Price history
                <span className="panel-sub">view on pepe.wtf</span>
              </div>
            </div>
            <div className="price-history-placeholder">
              <p>Real-time price charts are not yet available.</p>
              <a href={selected.buyUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm-inline">
                View on Pepe.WTF ↗
              </a>
            </div>
          </div>

          {/* TRANSACTIONS */}
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">
                Transaction history
                {status === 'live' && <span className="live-badge">LIVE</span>}
              </div>
              <div className="filter-tabs">
                <button className={`filter-tab ${txFilter==='all'     ?'active':''}`} onClick={()=>setTxFilter('all')}>All assets</button>
                <button className={`filter-tab ${txFilter==='selected'?'active':''}`} onClick={()=>setTxFilter('selected')}>{selected.ticker}</button>
              </div>
            </div>
            <div className="tx-table-wrap">
              {status === 'loading' ? (
                <div className="tx-loading">
                  <div className="tx-spinner"/>
                  <span>Fetching transactions…</span>
                </div>
              ) : (
                <table className="tx-table">
                  <thead>
                    <tr><th>Asset</th><th>Type</th><th>Value</th><th>From</th><th>To</th><th>Time</th><th></th></tr>
                  </thead>
                  <tbody>
                    {txShown.length === 0
                      ? <tr><td colSpan={7} className="tx-empty">No transactions found.</td></tr>
                      : txShown.map((tx, i) => (
                        <tr key={tx.id ?? i} className="tx-row">
                          <td className="tx-asset">{tx.asset}</td>
                          <td><span className={`tag ${TYPE_TAG[tx.type]??'tag-grey'}`}>{TYPE_LABEL[tx.type]??tx.type}</span></td>
                          <td className={tx.type==='bid'||tx.type==='sale'?'tx-green':tx.type==='offer'?'tx-red':'tx-grey'}>
                            {tx.value ? `${tx.value} BTC` : '—'}
                          </td>
                          <td className="tx-addr">{tx.from}</td>
                          <td className="tx-addr">{tx.to || '—'}</td>
                          <td className="tx-time">{tx.time}</td>
                          <td>
                            <a href={tx.xcUrl} target="_blank" rel="noreferrer" className="btn-sm btn-sm-outline">↗ View</a>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* ── ASSET SIDEBAR ──────────────────────────────── */}
        <div className="asset-sidebar">
          <div className="sec-label">Tracked Assets</div>

          {assets.map(a => (
            <div key={a.id}
              className={`asset-card ${selectedId===a.id?'selected':''}`}
              onClick={() => setSelectedId(a.id)}
            >
              <div className="ac-row">
                <div className={`ac-icon ${a.bg}`}>{a.icon}</div>
                <div className="ac-info">
                  <div className="ac-name">{a.name}</div>
                  <div className="ac-tick">{a.ticker} · {a.chain}</div>
                </div>
                <div className="ac-price-col">
                  <div className={`ac-price ${a.floor==null?'dim':''}`}>
                    {a.floor != null ? `${a.floor}` : '—'}
                  </div>
                  {a.change != null
                    ? <div className={`ac-change ${a.change>=0?'green':'red'}`}>{a.change>=0?'▲':'▼'} {Math.abs(a.change).toFixed(1)}%</div>
                    : <div className="ac-change" style={{color:'var(--txt3)'}}>—</div>
                  }
                </div>
              </div>
              <div className="ac-footer">
                <span>Supply: {displayVal(a.supply)}</span>
                <span>Holders: {displayVal(a.holders)}</span>
                <span>Floor: {a.floor ?? '—'}</span>
              </div>
            </div>
          ))}

          <div className="sidebar-actions">
            <a href={selected.buyUrl}  target="_blank" rel="noreferrer" className="btn btn-green sidebar-btn">Buy on Pepe.WTF ↗</a>
            <a href={selected.xcUrl}   target="_blank" rel="noreferrer" className="btn btn-outline sidebar-btn">XChain Explorer ↗</a>
            <button className="btn btn-outline sidebar-btn" onClick={() => fetchMarket(true)}>↺ Refresh</button>
          </div>
        </div>
      </div>
    </div>
  );
}
