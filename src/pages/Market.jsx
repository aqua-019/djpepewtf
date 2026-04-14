import { useState, useEffect, useCallback, useRef } from 'react';
import { MARKET_ASSETS } from '../data/index.js';
import { CACHE_TTL } from '../lib/constants.js';
import PriceChart from '../components/PriceChart.jsx';
import AssetActions from '../components/AssetActions.jsx';
import './Market.css';

// Image component with reliable index-based fallback cascade
function AssetImg({ src, fallbacks = [], alt, className, placeholderClass, placeholderText }) {
  const allSources = [src, ...fallbacks].filter(Boolean);
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [src]);
  if (allSources.length === 0 || idx >= allSources.length) {
    return <div className={placeholderClass}>{placeholderText}</div>;
  }
  return (
    <img src={allSources[idx]} alt={alt} className={className}
         onError={() => setIdx(i => i + 1)} />
  );
}

function ExternalLinkIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none"
         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M4 1h7v7M11 1L4.5 7.5"/>
    </svg>
  );
}

const TYPE_TAG   = { sale:'tag-green', transfer:'tag-grey', offer:'tag-red', bid:'tag-green', 'opensea-sale':'tag-blue' };
const TYPE_LABEL = { sale:'Sale', transfer:'Transfer', offer:'Offer', bid:'Bid', 'opensea-sale':'OpenSea' };

const displayVal = v => (v !== null && v !== undefined) ? String(v) : '\u2014';
const fmtBtc = v => v != null ? `${v} BTC` : '\u2014';
const fmtSats = v => v != null ? `${Math.round(v * 1e8).toLocaleString()} sats` : '\u2014';
const fmtUsd = v => v != null ? `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '\u2014';
const fmtDate = v => v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '\u2014';

const ASSET_TICKERS = MARKET_ASSETS.map(a => a.ticker).join(',');
const hiphopAssets = MARKET_ASSETS.filter(a => a.seriesGroup === 'hiphop');
const homageAssets = MARKET_ASSETS.filter(a => a.seriesGroup === 'homage');

let cache = null;
let cacheTime = 0;

export default function Market({ onMarketUpdate }) {
  const [expandedId, setExpandedId] = useState(null);
  const [liveData,   setLiveData]   = useState(null);
  const [btcUsd,     setBtcUsd]     = useState(null);
  const [ethUsd,     setEthUsd]     = useState(null);
  const [status,     setStatus]     = useState('loading');
  const prevFloors = useRef({});
  const [floorDeltas, setFloorDeltas] = useState({});

  const buildAsset = useCallback((staticAsset) => {
    const live = liveData?.[staticAsset.ticker];
    return {
      ...staticAsset,
      floor: live?.floor ?? staticAsset.floor, floorUsd: live?.floorUsd ?? null, floorSats: live?.floorSats ?? null,
      supply: live?.supply ?? staticAsset.supply, holders: live?.holders ?? staticAsset.holders,
      description: live?.description ?? '', locked: live?.locked ?? false, divisible: live?.divisible ?? false,
      issuer: live?.issuer ?? null, owner: live?.owner ?? null, imageUrl: live?.imageUrl ?? null,
      dispensers: live?.dispensers ?? [], dispenserCount: live?.dispenserCount ?? 0,
      dispenses: live?.dispenses ?? [], totalSales: live?.totalSales ?? 0,
      lastSale: live?.lastSale ?? null, transactions: live?.transactions ?? [],
      openseaSales: live?.openseaSales ?? [], fetchedAt: live?.fetchedAt ?? null,
    };
  }, [liveData]);

  const assets = MARKET_ASSETS.map(buildAsset);

  const fetchMarket = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cache && now - cacheTime < CACHE_TTL) { setLiveData(cache); setStatus('live'); return; }
    setStatus('loading');
    try {
      const res = await fetch(`/api/market?asset=${ASSET_TICKERS}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      cache = json.assets; cacheTime = now;
      setLiveData(json.assets); setBtcUsd(json.btcUsd ?? null); setStatus('live');
    } catch (err) {
      console.warn('[market fetch]', err);
      setStatus(cache ? 'stale' : 'error');
      if (cache) setLiveData(cache);
    }
  }, []);

  useEffect(() => { fetchMarket(); }, [fetchMarket]);
  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      .then(r => r.json()).then(d => setEthUsd(d?.ethereum?.usd ?? null)).catch(() => {});
  }, []);
  useEffect(() => { const id = setInterval(() => fetchMarket(true), CACHE_TTL); return () => clearInterval(id); }, [fetchMarket]);
  useEffect(() => {
    const djpepe = liveData?.DJPEPE;
    onMarketUpdate?.({ floor: djpepe?.floor ?? null, floorUsd: djpepe?.floorUsd ?? null, supply: djpepe?.supply ?? 169, status });
  }, [liveData, status, onMarketUpdate]);

  useEffect(() => {
    if (!liveData) return;
    const deltas = {};
    for (const ticker of Object.keys(liveData)) {
      const newFloor = liveData[ticker]?.floor;
      const oldFloor = prevFloors.current[ticker];
      if (newFloor != null && oldFloor != null && oldFloor !== newFloor) {
        const pct = ((newFloor - oldFloor) / oldFloor * 100).toFixed(1);
        deltas[ticker] = { direction: newFloor > oldFloor ? 'up' : 'down', pct };
      }
      if (newFloor != null) prevFloors.current[ticker] = newFloor;
    }
    if (Object.keys(deltas).length > 0) setFloorDeltas(prev => ({ ...prev, ...deltas }));
  }, [liveData]);

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);
  const getImgSrc = (a) => a.imageUrl || a.imageFallback || null;

  return (
    <div className="market-page">
      <div className={`market-status ${status}`}>
        <span className="ms-dot"/>
        {status === 'loading' && 'Fetching live data from Counterparty\u2026'}
        {status === 'live' && <>Live \u00b7 Counterparty API \u00b7 BTC {btcUsd ? `$${btcUsd.toLocaleString()}` : '\u2026'} \u00b7 refreshes every 60s</>}
        {status === 'stale' && 'Using cached data \u00b7 API unreachable'}
        {status === 'error' && <>API unreachable \u00b7 <button className="ms-retry" onClick={() => fetchMarket(true)}>retry</button></>}
      </div>
      <div className="asset-table">
        <AssetSection label="Hip-Hop Elements Series" assets={hiphopAssets} buildAsset={buildAsset} expandedId={expandedId} toggleExpand={toggleExpand} getImgSrc={getImgSrc} fetchMarket={fetchMarket} btcUsd={btcUsd} floorDeltas={floorDeltas} />
        <AssetSection label="Homage Collection" className="series-homage" assets={homageAssets} buildAsset={buildAsset} expandedId={expandedId} toggleExpand={toggleExpand} getImgSrc={getImgSrc} fetchMarket={fetchMarket} btcUsd={btcUsd} floorDeltas={floorDeltas} />
      </div>
    </div>
  );
}

function AssetSection({ label, className, assets, buildAsset, expandedId, toggleExpand, getImgSrc, fetchMarket, btcUsd, floorDeltas }) {
  return (
    <div className={`series-section ${className || ''}`}>
      <div className="series-header">{label}</div>
      <div className="asset-grid-header"><span></span><span>Asset</span><span>Floor Price</span><span>Supply</span><span>Holders</span><span></span></div>
      {assets.map(sa => {
        const a = buildAsset(sa); const isOpen = expandedId === a.id; const imgSrc = getImgSrc(a);
        return (<div key={a.id}>
          <div className={`asset-grid-row ${isOpen ? 'expanded' : ''}`} onClick={() => toggleExpand(a.id)}>
            <div className="ag-icon">
              <AssetImg src={imgSrc} fallbacks={[a.imageFallback].filter(Boolean)} alt={a.name} className="ag-icon-img" placeholderClass="ag-icon-placeholder" placeholderText={a.ticker.slice(0,2)} />
            </div>
            <div className="ag-name"><span className="ag-name-main">{a.name}</span><span className="ag-name-sub">{a.ticker} \u00b7 {a.series || a.chain}</span></div>
            <div className="ag-floor">{a.floor != null ? <><div className="ag-floor-col"><span className="ag-floor-val">{a.floor}</span><span className="ag-floor-unit">BTC</span>{floorDeltas[a.ticker] && <span className={`ag-floor-delta ${floorDeltas[a.ticker].direction}`}>{floorDeltas[a.ticker].direction === 'up' ? '\u25b2' : '\u25bc'}{floorDeltas[a.ticker].pct}%</span>}</div>{a.floorUsd != null && <span className="ag-floor-usd">{fmtUsd(a.floorUsd)}</span>}</> : <span className="ag-null">\u2014</span>}</div>
            <div className="ag-stat">{displayVal(a.supply)}</div><div className="ag-stat">{displayVal(a.holders)}</div>
            <div className="ag-actions"><a href={a.buyUrl} target="_blank" rel="noreferrer" className="btn-sm btn-sm-accent" onClick={e => e.stopPropagation()}>Buy</a><span className="ag-expand-arrow">{isOpen ? '\u25be' : '\u25b8'}</span></div>
          </div>
          <div className={`asset-detail ${isOpen ? 'open' : ''}`}>
            <div className="asset-detail-inner">{isOpen && <DetailPanel asset={a} imgSrc={imgSrc} onRefresh={() => fetchMarket(true)} btcUsd={btcUsd} ethUsd={ethUsd} />}</div>
          </div>
        </div>);
      })}
    </div>
  );
}

function DetailPanel({ asset, imgSrc, onRefresh, btcUsd, ethUsd }) {
  const a = asset;
  const [showAllTx, setShowAllTx] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const txList = [...(a.dispenses || []), ...(a.openseaSales || [])];
  const TX_PREVIEW = 8;
  const txVisible = showAllTx ? txList.slice(0, 50) : txList.slice(0, TX_PREVIEW);
  const cardImg = imgSrc || a.imageFallback || null;

  return (<>
    <div className="ad-top">
      <div className="ad-card-img-wrap">
        <AssetImg src={cardImg} fallbacks={[a.imageFallback].filter(Boolean)} alt={a.name} className="ad-card-img" placeholderClass="ad-card-placeholder" placeholderText={a.ticker} />
      </div>
      <div className="ad-top-right">
        <h3 className="ad-title">{a.name} <span className="ad-ticker">/ {a.ticker}</span></h3>
        {a.description && <p className="ad-desc">{a.description}</p>}
        {a.issuer && <div className="ad-meta">Issuer: <span className="ad-mono">{a.issuer.slice(0,12)}\u2026{a.issuer.slice(-6)}</span></div>}
        {a.owner && a.owner !== a.issuer && <div className="ad-meta">Owner: <span className="ad-mono">{a.owner.slice(0,12)}\u2026{a.owner.slice(-6)}</span></div>}
        <div className="ad-meta">{a.chain} \u00b7 {a.locked ? 'Locked' : 'Unlocked'} \u00b7 {a.divisible ? 'Divisible' : 'Indivisible'} \u00b7 {a.series || 'Homage'}</div>
        {btcUsd && <div className="ad-meta ad-btc-rate">BTC/USD: ${btcUsd.toLocaleString()}</div>}
      </div>
    </div>

    <div className="ad-hero-stats">
      <div className="ad-hero-stat">
        <div className="ad-hero-label">Floor Price</div>
        <div className="ad-hero-val green">{a.floor != null ? `${a.floor} BTC` : '\u2014'}</div>
        {a.floorUsd != null && <div className="ad-hero-sub gold">{fmtUsd(a.floorUsd)}</div>}
        {a.floor != null && <div className="ad-hero-sub dim">{fmtSats(a.floor)}</div>}
      </div>
      <div className="ad-hero-stat">
        <div className="ad-hero-label">Supply</div>
        <div className="ad-hero-val">{displayVal(a.supply)}</div>
        <div className="ad-hero-sub">total minted</div>
      </div>
      <div className="ad-hero-stat">
        <div className="ad-hero-label">Holders</div>
        <div className="ad-hero-val">{displayVal(a.holders)}</div>
        <div className="ad-hero-sub">wallets</div>
      </div>
      {a.openseaSales.length > 0 && (() => {
        const ethPrices = a.openseaSales.map(s => s.ethPrice).filter(Boolean);
        return ethPrices.length > 0 ? (
          <div className="ad-hero-stat">
            <div className="ad-hero-label">ETH Floor (OpenSea)</div>
            <div className="ad-hero-val">{Math.min(...ethPrices).toFixed(4)} ETH</div>
            <div className="ad-hero-sub">via Emblem Vault</div>
          </div>
        ) : null;
      })()}
    </div>

    <div className="ad-detail-grid">
      <div className="ad-kv"><span className="ad-kv-k">Last Sale</span><span className="ad-kv-v">{a.lastSale?.price ? fmtBtc(a.lastSale.price) : '\u2014'}</span></div>
      <div className="ad-kv"><span className="ad-kv-k">Last Sale Date</span><span className="ad-kv-v">{a.lastSale?.timestamp ? fmtDate(a.lastSale.timestamp) : '\u2014'}</span></div>
      <div className="ad-kv"><span className="ad-kv-k">Last Sale USD</span><span className="ad-kv-v gold">{a.lastSale?.usdPrice ? fmtUsd(a.lastSale.usdPrice) : '\u2014'}</span></div>
      <div className="ad-kv"><span className="ad-kv-k">Total Sales</span><span className="ad-kv-v">{String(a.totalSales)}</span></div>
      <div className="ad-kv"><span className="ad-kv-k">Open Dispensers</span><span className="ad-kv-v">{String(a.dispenserCount)}</span></div>
      <div className="ad-kv"><span className="ad-kv-k">Chain</span><span className="ad-kv-v">{a.chain}</span></div>
      <div className="ad-kv"><span className="ad-kv-k">Locked</span><span className="ad-kv-v">{a.locked ? 'Yes' : 'No'}</span></div>
      <div className="ad-kv"><span className="ad-kv-k">Divisible</span><span className="ad-kv-v">{a.divisible ? 'Yes' : 'No'}</span></div>
      <div className="ad-kv"><span className="ad-kv-k">Series</span><span className="ad-kv-v">{a.series || '\u2014'}</span></div>
      {a.openseaSales.length > 0 && <div className="ad-kv"><span className="ad-kv-k">OpenSea Sales</span><span className="ad-kv-v">{a.openseaSales.length}</span></div>}
      <div className="ad-kv"><span className="ad-kv-k">Updated</span><span className="ad-kv-v">{a.fetchedAt ? fmtDate(a.fetchedAt) : '\u2014'}</span></div>
    </div>

    {(() => {
      const chartData = (a.dispenses || [])
        .filter(d => d.btcPrice && d.timestamp)
        .map(d => ({ time: Math.floor(new Date(d.timestamp).getTime() / 1000), price: parseFloat(d.btcPrice) }))
        .sort((x, y) => x.time - y.time);
      return chartData.length >= 2 ? (
        <div className="ad-chart-wrap">
          <div className="ad-section-label">Price History ({chartData.length} sales)</div>
          <PriceChart data={chartData} width={600} height={180} />
        </div>
      ) : null;
    })()}

    {a.dispensers.length > 0 && (<div className="ad-dispensers"><div className="ad-section-label">Open Dispensers ({a.dispensers.length})</div>
      <div className="dispenser-list">{a.dispensers.map((d, i) => (<div key={i} className="dispenser-item"><div className="disp-price">{d.btcPrice} BTC</div>{d.usdPrice != null && <div className="disp-usd">{fmtUsd(d.usdPrice)}</div>}<button className={`disp-addr-btn${copiedIdx === i ? ' copied' : ''}`} title={`Copy: ${d.addressFull}`} onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(d.addressFull); setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 1500); }}>{copiedIdx === i ? 'Copied!' : d.address}</button>{d.giveRemaining != null && <div className="disp-remaining">{d.giveRemaining} remaining</div>}</div>))}</div>
    </div>)}

    {txList.length > 0 && (<div className="ad-tx-section">
      <div className="ad-section-head"><div className="ad-section-label">Sales & Activity ({txList.length})</div>
        {showAllTx && txList.length > TX_PREVIEW && <button className="tx-show-less" onClick={() => setShowAllTx(false)}>Show Less</button>}
      </div>
      <div className="ad-tx-table-wrap"><table className="ad-tx-table">
        <thead><tr><th>Type</th><th>Date</th><th>Price</th><th>USD</th><th>Qty</th><th>Seller</th><th>Buyer</th><th></th></tr></thead>
        <tbody>{txVisible.map((tx, i) => (
          <tr key={tx.id ?? i} className="ad-tx-row">
            <td><span className={`tag ${TYPE_TAG[tx.type]??'tag-grey'}`}>{TYPE_LABEL[tx.type]??tx.type}</span></td>
            <td className="ad-tx-date">{tx.timestamp ? fmtDate(tx.timestamp) : '\u2014'}</td>
            <td className="ad-tx-btc">{tx.btcPrice ? `${tx.btcPrice} BTC` : tx.ethPrice ? `${tx.ethPrice.toFixed(4)} ETH` : '\u2014'}</td>
            <td className="ad-tx-usd">{tx.usdPrice != null ? fmtUsd(tx.usdPrice) : '\u2014'}</td>
            <td className="ad-tx-qty">{tx.quantity}</td>
            <td className="ad-tx-addr" title={tx.from || ''}>{tx.fromShort || tx.from || '\u2014'}</td>
            <td className="ad-tx-addr" title={tx.to || ''}>{tx.toShort || tx.to || '\u2014'}</td>
            <td className="ad-tx-links">{tx.xcUrl && <a href={tx.xcUrl} target="_blank" rel="noreferrer">XChain</a>}{tx.tsUrl && <a href={tx.tsUrl} target="_blank" rel="noreferrer">TS</a>}{tx.openseaUrl && <a href={tx.openseaUrl} target="_blank" rel="noreferrer">OS</a>}</td>
          </tr>))}</tbody>
      </table></div>
      {txList.length > TX_PREVIEW && !showAllTx && <button className="tx-show-more" onClick={() => setShowAllTx(true)}>Show all {txList.length}</button>}
    </div>)}

    {txList.length === 0 && (
      <div className="ad-tx-section">
        <div className="ad-section-label">Sales & Activity</div>
        <div className="ad-tx-empty">No sales recorded yet. Check <a href={a.buyUrl} target="_blank" rel="noreferrer">Pepe.WTF</a> or <a href={a.xcUrl} target="_blank" rel="noreferrer">XChain</a> for the latest.</div>
      </div>
    )}

    <AssetActions symbol={a.ticker} btcFloor={a.floor} btcUsd={btcUsd} ethUsd={ethUsd} />
    <div className="ad-actions">
      <button className="btn btn-outline" onClick={onRefresh}>Refresh</button>
    </div>
  </>);
}
