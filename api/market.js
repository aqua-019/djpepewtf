/**
 * /api/market.js
 * Server-side proxy for Counterparty API v2.
 * Fetches asset info, holders, dispensers (floor price) and recent sends
 * for one or more XCP assets, returns normalised JSON to the frontend.
 *
 * Endpoint: GET /api/market?asset=DJPEPE
 *           GET /api/market?asset=DJPEPE,FAKEDJPEPE   (comma-separated)
 */

const BASE = 'https://api.counterparty.io:4000/v2';

// Fetch helper — returns parsed JSON or null on failure
async function xcp(path) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Pull the cheapest open dispenser price for an asset (= floor price in BTC/XCP)
async function getFloor(asset) {
  const data = await xcp(`/assets/${asset}/dispensers?status=open&limit=50`);
  if (!data?.result?.length) return null;

  // Find lowest satoshi rate
  const dispensers = data.result;
  const best = dispensers.reduce((min, d) =>
    d.satoshirate < (min?.satoshirate ?? Infinity) ? d : min
  , null);

  if (!best) return null;
  return {
    btcPrice:  best.satoshirate / 1e8,
    xcpPrice:  best.give_quantity,
    dispenser: best.source,
  };
}

async function getAssetData(asset) {
  // Run all requests in parallel
  const [info, holdersRes, sendsRes, ordersRes] = await Promise.all([
    xcp(`/assets/${asset}`),
    xcp(`/assets/${asset}/holders?limit=100`),
    xcp(`/assets/${asset}/sends?limit=20`),
    xcp(`/assets/${asset}/orders?status=open&limit=10`),
  ]);

  const floor = await getFloor(asset);

  const supply   = info?.result?.supply    ?? null;
  const locked   = info?.result?.locked    ?? false;
  const desc     = info?.result?.description ?? '';
  const issuer   = info?.result?.issuer    ?? null;
  const divisible= info?.result?.divisible ?? false;

  const holders  = holdersRes?.result?.length ?? null;
  const totalSupplyUnits = divisible && supply ? supply / 1e8 : supply;

  // Normalise recent sends into tx-table rows
  const sends = (sendsRes?.result || []).map(s => ({
    id:     s.tx_hash,
    asset:  asset,
    type:   'transfer',
    value:  null,
    from:   shortAddr(s.source),
    to:     shortAddr(s.destination),
    time:   timeAgo(s.block_time),
    txHash: s.tx_hash,
    xcUrl:  `https://xchain.io/tx/${s.tx_hash}`,
  }));

  // Open orders (DEX)
  const orders = (ordersRes?.result || []).map(o => ({
    id:     o.tx_hash,
    asset:  asset,
    type:   o.give_asset === asset ? 'offer' : 'bid',
    value:  o.give_asset === 'BTC' ? o.give_quantity / 1e8 : null,
    from:   shortAddr(o.source),
    to:     null,
    time:   timeAgo(o.block_time),
    txHash: o.tx_hash,
    xcUrl:  `https://xchain.io/order/${o.tx_hash}`,
  }));

  const transactions = [...orders, ...sends].slice(0, 20);

  return {
    ticker:       asset,
    supply:       totalSupplyUnits ? Math.round(totalSupplyUnits) : null,
    holders,
    locked,
    issuer,
    description:  desc,
    floor:        floor ? parseFloat(floor.btcPrice.toFixed(6)) : null,
    floorXcp:     floor?.xcpPrice ?? null,
    dispenserAddr:floor?.dispenser ?? null,
    transactions,
    fetchedAt:    new Date().toISOString(),
  };
}

// Helpers
function shortAddr(addr) {
  if (!addr) return '—';
  return `${addr.slice(0,6)}…${addr.slice(-4)}`;
}
function timeAgo(blockTime) {
  if (!blockTime) return '—';
  const secs = Math.floor(Date.now() / 1000) - blockTime;
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs/60)}m ago`;
  if (secs < 86400)return `${Math.floor(secs/3600)}hr ago`;
  return `${Math.floor(secs/86400)}d ago`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Method not allowed' });

  const raw    = req.query.asset || 'DJPEPE';
  const assets = raw.split(',').map(a => a.trim().toUpperCase()).filter(Boolean).slice(0, 10);

  try {
    const results = await Promise.all(assets.map(getAssetData));
    const byTicker = Object.fromEntries(results.map(r => [r.ticker, r]));
    return res.status(200).json({ assets: byTicker, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[market]', err);
    return res.status(500).json({ error: 'Could not fetch market data.', assets: {} });
  }
}
