/**
 * /api/market.js
 * Server-side proxy for Counterparty API v2.
 * Fetches asset info, holders, dispensers, dispenses (actual sales),
 * recent sends, BTC-USD price, ETH-USD price, and TokenScan images.
 * Optionally fetches OpenSea Emblem Vault sales if OPENSEA_API_KEY is set.
 */

const BASE = 'https://api.counterparty.io:4000/v2';
const TOKENSCAN_IMG = (asset) => `https://tokenscan.io/img/assets/${asset}.png`;

async function xcp(path) {
  try {
    const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

let btcUsdCache = { price: null, ts: 0 };
async function getBtcUsd() {
  const now = Date.now();
  if (btcUsdCache.price && now - btcUsdCache.ts < 120000) return btcUsdCache.price;
  try {
    const res = await fetch('https://mempool.space/api/v1/prices', { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return btcUsdCache.price;
    const data = await res.json();
    btcUsdCache = { price: data.USD ?? null, ts: now };
    return btcUsdCache.price;
  } catch { return btcUsdCache.price; }
}

let ethUsdCache = { price: null, ts: 0 };
async function getEthUsd() {
  const now = Date.now();
  if (ethUsdCache.price && now - ethUsdCache.ts < 300000) return ethUsdCache.price;
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd', { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return ethUsdCache.price;
    const data = await res.json();
    ethUsdCache = { price: data?.ethereum?.usd ?? null, ts: now };
    return ethUsdCache.price;
  } catch { return ethUsdCache.price; }
}

async function resolveImageUrl(asset, description) {
  const tsUrl = TOKENSCAN_IMG(asset);
  try { const res = await fetch(tsUrl, { method: 'HEAD', signal: AbortSignal.timeout(4000) }); if (res.ok) return tsUrl; } catch {}
  if (!description) return null;
  const urlMatch = description.match(/https?:\/\/[^\s"']+\.json/i) || description.match(/^(https?:\/\/[^\s]+|[a-z0-9.-]+\/[^\s]+\.json)$/i);
  if (!urlMatch) {
    const bareUrl = description.match(/^([a-z0-9.-]+\.[a-z]+\/[^\s]+)$/i);
    if (bareUrl) { try { const res = await fetch(`https://${bareUrl[1]}`, { signal: AbortSignal.timeout(5000) }); if (res.ok) { const j = await res.json(); return j.image || j.image_large || null; } } catch {} }
    return null;
  }
  try {
    const url = urlMatch[0].startsWith('http') ? urlMatch[0] : `https://${urlMatch[0]}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) }); if (!res.ok) return null;
    const j = await res.json(); return j.image || j.image_large || j.image_url || null;
  } catch { return null; }
}

async function getFloor(asset) {
  const data = await xcp(`/assets/${asset}/dispensers?status=open&limit=50`);
  if (!data?.result?.length) return { floor: null, dispensers: [] };
  const dispensers = data.result;
  const best = dispensers.reduce((min, d) => d.satoshirate < (min?.satoshirate ?? Infinity) ? d : min, null);
  const openDispensers = dispensers.map(d => ({ address: shortAddr(d.source), addressFull: d.source, btcPrice: d.satoshirate / 1e8, giveRemaining: d.give_remaining ?? null })).sort((a, b) => a.btcPrice - b.btcPrice);
  return { floor: best ? { btcPrice: best.satoshirate / 1e8, xcpPrice: best.give_quantity, dispenser: best.source } : null, dispensers: openDispensers };
}

async function getOpenSeaSales(assetName, ethUsd) {
  const apiKey = process.env.OPENSEA_API_KEY; if (!apiKey) return [];
  try {
    const res = await fetch('https://api.opensea.io/api/v2/events/collection/emblem-vault?event_type=sale&limit=30', { headers: { 'X-API-KEY': apiKey, Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return []; const data = await res.json();
    return (data.asset_events || [])
      .filter(e => {
        const name = (e.nft?.name || '').toUpperCase();
        const desc = (e.nft?.description || '').toUpperCase();
        return name.includes(assetName) || name.includes(`[${assetName}]`) || desc.includes(assetName);
      })
      .slice(0, 10)
      .map(e => {
        const ethPrice = e.payment?.quantity ? parseFloat(e.payment.quantity) / 1e18
          : e.total_price ? parseFloat(e.total_price) / 1e18 : null;
        const usdPrice = (ethPrice != null && ethUsd != null) ? Math.round(ethPrice * ethUsd * 100) / 100 : null;
        return {
          id: e.order_hash || e.transaction?.hash || `os-${Date.now()}`, asset: assetName, type: 'opensea-sale',
          btcPrice: null, ethPrice, usdPrice, quantity: 1,
          from: e.seller ?? null, fromShort: shortAddr(e.seller),
          to: e.buyer ?? null, toShort: shortAddr(e.buyer),
          blockIndex: null, timestamp: e.event_timestamp ? new Date(e.event_timestamp).toISOString() : null,
          txHash: e.transaction?.hash ?? null, xcUrl: null, tsUrl: null,
          openseaUrl: e.nft?.opensea_url || 'https://opensea.io/collection/emblem-vault',
        };
      });
  } catch { return []; }
}

async function fetchPepeWtfHolders(asset) {
  try {
    const res = await fetch(`https://pepe.wtf/api/asset/${asset}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const h = data?.holders;
    if (typeof h === 'number') return h;
    if (Array.isArray(h)) return h.length;
    return null;
  } catch { return null; }
}

async function getAssetData(asset, btcUsd) {
  const [info, holdersRes, sendsRes, ordersRes, dispensesRes] = await Promise.all([
    xcp(`/assets/${asset}`), xcp(`/assets/${asset}/holders?limit=100`),
    xcp(`/assets/${asset}/sends?limit=20`), xcp(`/assets/${asset}/orders?status=open&limit=10`),
    xcp(`/assets/${asset}/dispenses?limit=50`),
  ]);
  const { floor, dispensers } = await getFloor(asset);
  const supply = info?.result?.supply ?? null, locked = info?.result?.locked ?? false;
  const desc = info?.result?.description ?? '', issuer = info?.result?.issuer ?? null;
  const divisible = info?.result?.divisible ?? false, owner = info?.result?.owner ?? null;
  let holders = Array.isArray(holdersRes?.result) ? holdersRes.result.length : null;
  let holdersSource = 'tokenscan';
  if (asset === 'DJPEPE') {
    const pepeWtfHolders = await fetchPepeWtfHolders('DJPEPE');
    if (typeof pepeWtfHolders === 'number') { holders = pepeWtfHolders; holdersSource = 'pepe.wtf'; }
  }
  const totalSupplyUnits = divisible && supply ? supply / 1e8 : supply;
  const imageUrl = await resolveImageUrl(asset, desc);
  const withUsd = (btc) => (btc != null && btcUsd != null) ? Math.round(btc * btcUsd * 100) / 100 : null;

  const dispenses = (dispensesRes?.result || []).map(d => {
    const btcSats = d.btc_amount ?? d.satoshirate ?? d.satoshi_price ?? null;
    const btcPrice = btcSats ? btcSats / 1e8 : null;
    const rawTime = d.block_time || d.confirmed_at || null;
    const timestamp = rawTime
      ? new Date(typeof rawTime === 'number' ? rawTime * 1000 : rawTime).toISOString()
      : null;
    return { id: d.tx_hash, asset, type: 'sale', btcPrice, usdPrice: withUsd(btcPrice),
      quantity: d.dispense_quantity ?? 1,
      from: d.source ?? null, fromShort: shortAddr(d.source),
      to: d.destination ?? null, toShort: shortAddr(d.destination),
      blockIndex: d.block_index ?? null, timestamp,
      txHash: d.tx_hash, xcUrl: `https://xchain.io/tx/${d.tx_hash}`, tsUrl: `https://tokenscan.io/tx/${d.tx_hash}` };
  }).sort((a, b) => (b.blockIndex || 0) - (a.blockIndex || 0));
  const sends = (sendsRes?.result || []).map(s => ({
    id: s.tx_hash, asset, type: 'transfer', btcPrice: null, usdPrice: null,
    quantity: s.quantity ?? 1, from: s.source ?? null, fromShort: shortAddr(s.source),
    to: s.destination ?? null, toShort: shortAddr(s.destination),
    blockIndex: s.block_index ?? null, timestamp: s.block_time ? new Date(s.block_time * 1000).toISOString() : null,
    txHash: s.tx_hash, xcUrl: `https://xchain.io/tx/${s.tx_hash}`, tsUrl: `https://tokenscan.io/tx/${s.tx_hash}` }));
  const orders = (ordersRes?.result || []).map(o => {
    const btcPrice = o.give_asset === 'BTC' ? o.give_quantity / 1e8 : null;
    return { id: o.tx_hash, asset, type: o.give_asset === asset ? 'offer' : 'bid',
      btcPrice, usdPrice: withUsd(btcPrice), quantity: 1,
      from: o.source ?? null, fromShort: shortAddr(o.source), to: null, toShort: null,
      blockIndex: o.block_index ?? null, timestamp: o.block_time ? new Date(o.block_time * 1000).toISOString() : null,
      txHash: o.tx_hash, xcUrl: `https://xchain.io/order/${o.tx_hash}`, tsUrl: `https://tokenscan.io/tx/${o.tx_hash}` };
  });
  const ethUsd = await getEthUsd();
  const openseaSales = await getOpenSeaSales(asset, ethUsd);
  const transactions = [...dispenses, ...orders, ...sends].slice(0, 50);
  const lastSale = dispenses.length > 0
    ? { price: dispenses[0].btcPrice, usdPrice: dispenses[0].usdPrice,
        timestamp: dispenses[0].timestamp || dispenses.find(d => d.timestamp)?.timestamp || null }
    : null;
  const floorBtc = floor ? parseFloat(floor.btcPrice.toFixed(8)) : null;
  const dispensersWithUsd = dispensers.map(d => ({ ...d, usdPrice: withUsd(d.btcPrice) }));
  return {
    ticker: asset, supply: totalSupplyUnits ? Math.round(totalSupplyUnits) : null,
    holders, holdersSource, locked, divisible, issuer, owner, description: desc, imageUrl,
    floor: floorBtc, floorUsd: withUsd(floorBtc), floorSats: floorBtc ? Math.round(floorBtc * 1e8) : null,
    floorXcp: floor?.xcpPrice ?? null, dispenserAddr: floor?.dispenser ?? null,
    dispenserCount: dispensersWithUsd.length, dispensers: dispensersWithUsd,
    dispenses, totalSales: dispenses.length, lastSale, transactions, openseaSales,
    openseaEnabled: !!process.env.OPENSEA_API_KEY,
    btcUsd, fetchedAt: new Date().toISOString(),
  };
}

function shortAddr(addr) { if (!addr) return '\u2014'; return `${addr.slice(0,6)}\u2026${addr.slice(-4)}`; }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const raw = req.query.asset || 'DJPEPE';
  const assets = raw.split(',').map(a => a.trim().toUpperCase()).filter(Boolean).slice(0, 10);
  try {
    const btcUsd = await getBtcUsd();
    const ethUsd = await getEthUsd();
    const results = await Promise.all(assets.map(a => getAssetData(a, btcUsd)));
    const byTicker = Object.fromEntries(results.map(r => [r.ticker, r]));
    return res.status(200).json({ assets: byTicker, btcUsd, ethUsd, fetchedAt: new Date().toISOString() });
  } catch (err) { console.error('[market]', err); return res.status(500).json({ error: 'Could not fetch market data.', assets: {} }); }
}
