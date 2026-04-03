import { useState, useEffect, useCallback } from 'react';
import { MARKET_ASSETS } from '../data/index.js';
import { CACHE_TTL } from '../lib/constants.js';
import './Market.css';

const TYPE_TAG   = { transfer:'tag-grey', offer:'tag-red', bid:'tag-green', sale:'tag-green' };
const TYPE_LABEL = { transfer:'Transfer', offer:'Offer',   bid:'Bid',       sale:'Sale' };

const displayVal = v => (v !== null && v !== undefined) ? String(v) : '—';

const ASSET_TICKERS = MARKET_ASSETS.map(a => a.ticker).join(',');
const hiphopAssets = MARKET_ASSETS.filter(a => a.seriesGroup === 'hiphop');
const homageAssets = MARKET_ASSETS.filter(a => a.seriesGroup === 'homage');

let cache = null;
let cacheTime = 0;

export default function Market({ onMarketUpdate }) {
  const [expandedId, setExpandedId] = useState(null);
  const [liveData,   setLiveData]   = useState(null);
  const [txFilter,   setTxFilter]   = useState('all');
  const [status,     setStatus]     = useState('loading');

  const buildAsset = useCallback((staticAsset) => {
    const live = liveData?.[staticAsset.ticker];
    return {
      ...staticAsset,
      floor:       live?.floor       ?? staticAsset.floor,
      supply:      live?.supply      ?? staticAsset.supply,
      holders:     live?.holders     ?? staticAsset.holders,
      description: live?.description ?? '',
      locked:      live?.locked      ?? false,
      issuer:      live?.issuer      ?? null,
      dispensers:  live?.dispensers   ?? [],
      fetchedAt:   live?.fetchedAt   ?? null,
    };
  }, [liveData]);

  const assets   = MARKET_ASSETS.map(buildAsset);
  const expanded = expandedId ? assets.find(a => a.id === expandedId) : null;

  // All transactions across assets
  const allTxs = assets.flatMap(a => liveData?.[a.ticker]?.transactions ?? []);
  const txShown = txFilter === 'all'
    ? allTxs
    : allTxs.filter(t => t.asset === txFilter);

  // Fetch
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

  useEffect(() => {
    const djpepe = liveData?.DJPEPE;
    onMarketUpdate?.({
      floor: djpepe?.floor ?? null,
      supply: djpepe?.supply ?? 169,
      status,
    });
  }, [liveData, status, onMarketUpdate]);

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div className="market-page">

      {/* ── STATUS BAR ──────────────────────────────────── */}
      <div className={`market-status ${status}`}>
        <span className="ms-dot"/>
        {status === 'loading' && 'Fetching live data from Counterparty…'}
        {status === 'live'    && `Live · Counterparty API · refreshes every 60s`}
        {status === 'stale'   && 'Using cached data · API unreachable'}
        {status === 'error'   && <>Could not reach Counterparty API · <button className="ms-retry" onClick={() => fetchMarket(true)}>retry</button></>}
      </div>

      {/* ── ASSET COMPARISON GRID ───────────────────────── */}
      <div className="asset-table">

        {/* Hip-Hop Elements Series */}
        <div className="series-section">
          <div className="series-header">Hip-Hop Elements Series</div>
          <div className="asset-grid-header">
            <span></span>
            <span>Asset</span>
            <span>Floor</span>
            <span>Supply</span>
            <span>Holders</span>
            <span></span>
          </div>
          {hiphopAssets.map(sa => {
            const a = buildAsset(sa);
            const isExpanded = expandedId === a.id;
            return (
              <div key={a.id}>
                <div className={`asset-grid-row ${isExpanded ? 'expanded' : ''}`} onClick={() => toggleExpand(a.id)}>
                  <div className="ag-icon">
                    {a.image ? <img src={a.image} alt={a.name} className="ag-icon-img"/> : <span className="ag-icon-emoji">{a.icon}</span>}
                  </div>
                  <div className="ag-name">
                    <span className="ag-name-main">{a.name}</span>
                    <span className="ag-name-sub">{a.ticker} · {a.series}</span>
                  </div>
                  <div className="ag-floor">
                    {a.floor != null ? <><span className="ag-floor-val">{a.floor}</span><span className="ag-floor-unit">BTC</span></> : <span className="ag-null">—</span>}
                  </div>
                  <div className="ag-stat">{displayVal(a.supply)}</div>
                  <div className="ag-stat">{displayVal(a.holders)}</div>
                  <div className="ag-actions">
                    <a href={a.buyUrl} target="_blank" rel="noreferrer" className="btn-sm btn-sm-accent" onClick={e => e.stopPropagation()}>Buy</a>
                    <span className="ag-expand-arrow">{isExpanded ? '▾' : '▸'}</span>
                  </div>
                </div>

                {/* Detail panel */}
                {isExpanded && <DetailPanel asset={a} onRefresh={() => fetchMarket(true)} />}
              </div>
            );
          })}
        </div>

        {/* Homage Section */}
        <div className="series-section series-homage">
          <div className="series-header">Homage Collection</div>
          {homageAssets.map(sa => {
            const a = buildAsset(sa);
            const isExpanded = expandedId === a.id;
            return (
              <div key={a.id}>
                <div className={`asset-grid-row ${isExpanded ? 'expanded' : ''}`} onClick={() => toggleExpand(a.id)}>
                  <div className="ag-icon">
                    <span className="ag-icon-emoji">{a.icon}</span>
                  </div>
                  <div className="ag-name">
                    <span className="ag-name-main">{a.name}</span>
                    <span className="ag-name-sub">{a.ticker}</span>
                  </div>
                  <div className="ag-floor">
                    {a.floor != null ? <><span className="ag-floor-val">{a.floor}</span><span className="ag-floor-unit">BTC</span></> : <span className="ag-null">—</span>}
                  </div>
                  <div className="ag-stat">{displayVal(a.supply)}</div>
                  <div className="ag-stat">{displayVal(a.holders)}</div>
                  <div className="ag-actions">
                    <a href={a.buyUrl} target="_blank" rel="noreferrer" className="btn-sm btn-sm-accent" onClick={e => e.stopPropagation()}>Buy</a>
                    <span className="ag-expand-arrow">{isExpanded ? '▾' : '▸'}</span>
                  </div>
                </div>
                {isExpanded && <DetailPanel asset={a} onRefresh={() => fetchMarket(true)} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RECENT TRANSFERS ────────────────────────────── */}
      <div className="panel tx-panel">
        <div className="panel-head">
          <div className="panel-title">
            Recent Transfers
            {status === 'live' && <span className="live-badge">LIVE</span>}
          </div>
          <div className="filter-tabs">
            <button className={`filter-tab ${txFilter==='all'?'active':''}`} onClick={() => setTxFilter('all')}>All assets</button>
            {MARKET_ASSETS.map(a => (
              <button key={a.ticker} className={`filter-tab ${txFilter===a.ticker?'active':''}`} onClick={() => setTxFilter(a.ticker)}>{a.ticker}</button>
            ))}
          </div>
        </div>
        <div className="tx-table-wrap">
          {status === 'loading' ? (
            <div className="tx-loading"><div className="tx-spinner"/><span>Fetching transactions…</span></div>
          ) : txShown.length === 0 ? (
            <div className="tx-empty">No transactions found.</div>
          ) : (
            <table className="tx-table">
              <thead>
                <tr><th>Asset</th><th>Type</th><th>From</th><th>To</th><th>TX</th><th></th></tr>
              </thead>
              <tbody>
                {txShown.map((tx, i) => (
                  <tr key={tx.id ?? i} className="tx-row">
                    <td className="tx-asset">{tx.asset}</td>
                    <td><span className={`tag ${TYPE_TAG[tx.type]??'tag-grey'}`}>{TYPE_LABEL[tx.type]??tx.type}</span></td>
                    <td className="tx-addr">{tx.from}</td>
                    <td className="tx-addr">{tx.to || '—'}</td>
                    <td className="tx-hash">{tx.txHash?.slice(0,8)}…</td>
                    <td><a href={tx.xcUrl} target="_blank" rel="noreferrer" className="btn-sm btn-sm-outline">View ↗</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── DETAIL PANEL (inline) ─────────────────────────────────
function DetailPanel({ asset, onRefresh }) {
  const a = asset;
  return (
    <div className="asset-detail">
      <div className="ad-header">
        <div className="ad-visual">
          {a.image
            ? <img src={a.image} alt={a.name} className="ad-img"/>
            : <span className="ad-icon-large">{a.icon}</span>
          }
        </div>
        <div className="ad-info">
          <h3 className="ad-title">{a.name} <span className="ad-ticker">/ {a.ticker}</span></h3>
          {a.description && <p className="ad-desc">{a.description}</p>}
          {a.issuer && <div className="ad-issuer">Issuer: <span className="ad-addr">{a.issuer.slice(0,10)}…{a.issuer.slice(-6)}</span></div>}
          <div className="ad-chain">{a.chain} · {a.locked ? 'Locked' : 'Unlocked'} · {a.series || 'Homage'}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="ad-stats">
        {[
          { label: 'Floor', value: a.floor != null ? `${a.floor} BTC` : '—' },
          { label: 'Supply', value: displayVal(a.supply) },
          { label: 'Holders', value: displayVal(a.holders) },
          { label: 'Locked', value: a.locked ? 'Yes' : 'No' },
        ].map(s => (
          <div key={s.label} className="ad-stat-box">
            <div className="ad-stat-label">{s.label}</div>
            <div className="ad-stat-val">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Open Dispensers */}
      {a.dispensers.length > 0 && (
        <div className="ad-dispensers">
          <div className="ad-section-label">Open Dispensers ({a.dispensers.length})</div>
          <div className="dispenser-list">
            {a.dispensers.map((d, i) => (
              <div key={i} className="dispenser-item">
                <div className="disp-price">{d.btcPrice} BTC</div>
                <div className="disp-addr">{d.address}</div>
                {d.giveRemaining != null && <div className="disp-remaining">{d.giveRemaining} remaining</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="ad-actions">
        <a href={a.buyUrl} target="_blank" rel="noreferrer" className="btn btn-green">Buy on Pepe.WTF ↗</a>
        <a href={a.xcUrl} target="_blank" rel="noreferrer" className="btn btn-outline">XChain Explorer ↗</a>
        <button className="btn btn-outline" onClick={onRefresh}>Refresh</button>
      </div>
    </div>
  );
}
