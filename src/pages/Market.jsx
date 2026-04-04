import { useState, useEffect, useCallback } from 'react';
import { MARKET_ASSETS } from '../data/index.js';
import { CACHE_TTL } from '../lib/constants.js';
import './Market.css';

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
  const [txFilter,   setTxFilter]   = useState('all');
  const [txExpanded, setTxExpanded] = useState(false);
  const [status,     setStatus]     = useState('loading');

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
  const allTxs = assets.flatMap(a => a.transactions);
  const txShown = txFilter === 'all' ? allTxs : allTxs.filter(t => t.asset === txFilter);
  const txLimit = txExpanded ? 50 : 20;

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
  useEffect(() => { const id = setInterval(() => fetchMarket(true), CACHE_TTL); return () => clearInterval(id); }, [fetchMarket]);
  useEffect(() => {
    const djpepe = liveData?.DJPEPE;
    onMarketUpdate?.({ floor: djpepe?.floor ?? null, floorUsd: djpepe?.floorUsd ?? null, supply: djpepe?.supply ?? 169, status });
  }, [liveData, status, onMarketUpdate]);

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
        <AssetSection label="Hip-Hop Elements Series" assets={hiphopAssets} buildAsset={buildAsset} expandedId={expandedId} toggleExpand={toggleExpand} getImgSrc={getImgSrc} fetchMarket={fetchMarket} btcUsd={btcUsd} />
        <AssetSection label="Homage Collection" className="series-homage" assets={homageAssets} buildAsset={buildAsset} expandedId={expandedId} toggleExpand={toggleExpand} getImgSrc={getImgSrc} fetchMarket={fetchMarket} btcUsd={btcUsd} />
      </div>
      <div className={`panel tx-bottom-panel ${txExpanded ? '' : 'collapsed'}`}>
        <div className="panel-head panel-toggle" onClick={() => setTxExpanded(!txExpanded)}>
          <div className="panel-title">All Recent Activity<span className="tx-count-badge">{allTxs.length}</span>{status === 'live' && <span className="live-badge">LIVE</span>}<span className="toggle-arrow">{txExpanded ? '\u25be' : '\u25b8'}</span></div>
          {txExpanded && (<div className="filter-tabs" onClick={e => e.stopPropagation()}>
            <button className={`filter-tab ${txFilter==='all'?'active':''}`} onClick={() => setTxFilter('all')}>All</button>
            {MARKET_ASSETS.map(a => (<button key={a.ticker} className={`filter-tab ${txFilter===a.ticker?'active':''}`} onClick={() => setTxFilter(a.ticker)}>{a.ticker}</button>))}
          </div>)}
        </div>
        {txExpanded && (<div className="tx-table-wrap">
          {txShown.length === 0 ? <div className="tx-empty">No transactions found.</div> : (<>
            <table className="tx-table"><thead><tr><th>Asset</th><th>Type</th><th>BTC</th><th>USD</th><th>From</th><th>To</th><th>TX</th><th></th></tr></thead>
              <tbody>{txShown.slice(0, txLimit).map((tx, i) => (
                <tr key={tx.id ?? i} className="tx-row">
                  <td className="tx-asset">{tx.asset}</td>
                  <td><span className={`tag ${TYPE_TAG[tx.type]??'tag-grey'}`}>{TYPE_LABEL[tx.type]??tx.type}</span></td>
                  <td className="tx-price">{tx.btcPrice ? `${tx.btcPrice} BTC` : tx.ethPrice ? `${tx.ethPrice.toFixed(4)} ETH` : '\u2014'}</td>
                  <td className="tx-usd">{tx.usdPrice ? fmtUsd(tx.usdPrice) : '\u2014'}</td>
                  <td className="tx-addr">{tx.fromShort || tx.from || '\u2014'}</td>
                  <td className="tx-addr">{tx.toShort || tx.to || '\u2014'}</td>
                  <td className="tx-hash">{tx.txHash?.slice(0,8)}\u2026</td>
                  <td className="tx-links"><a href={tx.xcUrl} target="_blank" rel="noreferrer">XChain</a><a href={tx.tsUrl} target="_blank" rel="noreferrer">TokenScan</a>{tx.openseaUrl && <a href={tx.openseaUrl} target="_blank" rel="noreferrer">OpenSea</a>}</td>
                </tr>))}</tbody></table>
            {txShown.length > txLimit && <button className="tx-show-more" onClick={() => setTxExpanded(true)}>Show all {txShown.length}</button>}
          </>)}
        </div>)}
      </div>
    </div>
  );
}

function AssetSection({ label, className, assets, buildAsset, expandedId, toggleExpand, getImgSrc, fetchMarket, btcUsd }) {
  return (
    <div className={`series-section ${className || ''}`}>
      <div className="series-header">{label}</div>
      <div className="asset-grid-header"><span></span><span>Asset</span><span>Floor Price</span><span>Supply</span><span>Holders</span><span></span></div>
      {assets.map(sa => {
        const a = buildAsset(sa); const isOpen = expandedId === a.id; const imgSrc = getImgSrc(a);
        return (<div key={a.id}>
          <div className={`asset-grid-row ${isOpen ? 'expanded' : ''}`} onClick={() => toggleExpand(a.id)}>
            <div className="ag-icon">{imgSrc ? <img src={imgSrc} alt={a.name} className="ag-icon-img" onError={e => { if (a.imageFallback && !e.target.src.endsWith(a.imageFallback)) e.target.src = a.imageFallback; }}/> : <div className="ag-icon-placeholder">{a.ticker.slice(0,2)}</div>}</div>
            <div className="ag-name"><span className="ag-name-main">{a.name}</span><span className="ag-name-sub">{a.ticker} \u00b7 {a.series || a.chain}</span></div>
            <div className="ag-floor">{a.floor != null ? <><div className="ag-floor-col"><span className="ag-floor-val">{a.floor}</span><span className="ag-floor-unit">BTC</span></div>{a.floorUsd != null && <span className="ag-floor-usd">{fmtUsd(a.floorUsd)}</span>}</> : <span className="ag-null">\u2014</span>}</div>
            <div className="ag-stat">{displayVal(a.supply)}</div><div className="ag-stat">{displayVal(a.holders)}</div>
            <div className="ag-actions"><a href={a.buyUrl} target="_blank" rel="noreferrer" className="btn-sm btn-sm-accent" onClick={e => e.stopPropagation()}>Buy</a><span className="ag-expand-arrow">{isOpen ? '\u25be' : '\u25b8'}</span></div>
          </div>
          <div className={`asset-detail ${isOpen ? 'open' : ''}`}>{isOpen && <DetailPanel asset={a} imgSrc={imgSrc} onRefresh={() => fetchMarket(true)} btcUsd={btcUsd} />}</div>
        </div>);
      })}
    </div>
  );
}

function DetailPanel({ asset, imgSrc, onRefresh, btcUsd }) {
  const a = asset;
  const [showAllTx, setShowAllTx] = useState(false);
  const txList = [...(a.dispenses || []), ...(a.openseaSales || [])];
  const TX_PREVIEW = 8;
  const txVisible = showAllTx ? txList.slice(0, 50) : txList.slice(0, TX_PREVIEW);

  return (<>
    <div className="ad-header">
      <div className="ad-visual">{imgSrc ? <img src={imgSrc} alt={a.name} className="ad-img" onError={e => { if (a.imageFallback && !e.target.src.endsWith(a.imageFallback)) e.target.src = a.imageFallback; }}/> : <div className="ad-img-placeholder">{a.ticker}</div>}</div>
      <div className="ad-info">
        <h3 className="ad-title">{a.name} <span className="ad-ticker">/ {a.ticker}</span></h3>
        {a.description && <p className="ad-desc">{a.description}</p>}
        {a.issuer && <div className="ad-meta">Issuer: <span className="ad-mono">{a.issuer.slice(0,12)}\u2026{a.issuer.slice(-6)}</span></div>}
        {a.owner && a.owner !== a.issuer && <div className="ad-meta">Owner: <span className="ad-mono">{a.owner.slice(0,12)}\u2026{a.owner.slice(-6)}</span></div>}
        <div className="ad-meta">{a.chain} \u00b7 {a.locked ? 'Locked' : 'Unlocked'} \u00b7 {a.divisible ? 'Divisible' : 'Indivisible'} \u00b7 {a.series || 'Homage'}</div>
        {btcUsd && <div className="ad-meta ad-btc-rate">BTC/USD: ${btcUsd.toLocaleString()}</div>}
      </div>
    </div>
    <div className="ad-stats">
      {[{ label: 'Floor (BTC)', value: fmtBtc(a.floor) }, { label: 'Floor (USD)', value: a.floorUsd != null ? fmtUsd(a.floorUsd) : '\u2014', accent: true }, { label: 'Floor (sats)', value: fmtSats(a.floor) }, { label: 'Supply', value: displayVal(a.supply) }, { label: 'Holders', value: displayVal(a.holders) }, { label: 'Locked', value: a.locked ? 'Yes' : 'No' }, { label: 'Divisible', value: a.divisible ? 'Yes' : 'No' }, { label: 'Chain', value: a.chain }, { label: 'Series', value: a.series || '\u2014' }, { label: 'Dispensers', value: String(a.dispenserCount) }, { label: 'Total Sales', value: String(a.totalSales) }, { label: 'Last Sale (BTC)', value: a.lastSale ? fmtBtc(a.lastSale.price) : '\u2014' }, { label: 'Last Sale (USD)', value: a.lastSale?.usdPrice ? fmtUsd(a.lastSale.usdPrice) : '\u2014', accent: true }, { label: 'Last Sale Date', value: a.lastSale ? fmtDate(a.lastSale.timestamp) : '\u2014' }, { label: 'OpenSea Sales', value: String(a.openseaSales.length) }, { label: 'Updated', value: a.fetchedAt ? fmtDate(a.fetchedAt) : '\u2014' }].map(s => (
        <div key={s.label} className={`ad-stat-box ${s.accent ? 'stat-usd' : ''}`}><div className="ad-stat-label">{s.label}</div><div className="ad-stat-val">{s.value}</div></div>))}
    </div>
    {a.dispensers.length > 0 && (<div className="ad-dispensers"><div className="ad-section-label">Open Dispensers ({a.dispensers.length})</div>
      <div className="dispenser-list">{a.dispensers.map((d, i) => (<div key={i} className="dispenser-item"><div className="disp-price">{d.btcPrice} BTC</div>{d.usdPrice != null && <div className="disp-usd">{fmtUsd(d.usdPrice)}</div>}<div className="disp-addr">{d.address}</div>{d.giveRemaining != null && <div className="disp-remaining">{d.giveRemaining} remaining</div>}</div>))}</div>
    </div>)}
    {txList.length > 0 && (<div className="ad-tx-section">
      <div className="ad-section-head"><div className="ad-section-label">Sales & Activity ({txList.length})</div>
        {showAllTx && txList.length > TX_PREVIEW && <button className="tx-show-less" onClick={() => setShowAllTx(false)}>Show Less</button>}
      </div>
      <div className="ad-tx-table-wrap"><table className="ad-tx-table">
        <thead><tr><th>Type</th><th>Date</th><th>BTC Price</th><th>USD Price</th><th>Qty</th><th>Seller</th><th>Buyer</th><th></th></tr></thead>
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
    <div className="ad-actions">
      <a href={a.buyUrl} target="_blank" rel="noreferrer" className="btn btn-green">Buy on Pepe.WTF \u2197</a>
      <a href={a.xcUrl} target="_blank" rel="noreferrer" className="btn btn-outline">XChain Explorer \u2197</a>
      <button className="btn btn-outline" onClick={onRefresh}>Refresh</button>
    </div>
  </>);
}
