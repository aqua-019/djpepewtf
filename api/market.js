/**
 * /api/market.js
 * Server-side proxy for Counterparty API v2.
 * Fetches asset info, holders, dispensers (floor price + open listings)
 * and recent sends for one or more XCP assets.
 */

const BASE = 'https://api.counterparty.io:4000/v2';

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

async function getFloor(asset) {
  const data = await xcp(`/assets/${asset}/dispensers?status=open&limit=50`);
  if (!data?.result?.length) return { floor: null, dispensers: [] };

  const dispensers = data.result;
  const best = dispensers.reduce((min, d) =>
    d.satoshirate < (min?.satoshirate ?? Infinity) ? d : min
  , null);

  const openDispensers = dispensers.map(d => ({
    address: shortAddr(d.source),
    addressFull: d.source,
    btcPrice: d.satoshirate / 1e8,
    giveRemaining: d.give_remaining ?? null,
  })).sort((a, b) => a.btcPrice - b.btcPrice);

  return {
    floor: best ? {
      btcPrice:  best.satoshirate / 1e8,
      xcpPrice:  best.give_quantity,
      dispenser: best.source,
    } : null,
    dispensers: openDispensers,
  };
}

async function getAssetData(asset) {
  const [info, holdersRes, sendsRes, ordersRes] = await Promise.all([
    xcp(`/assets/${asset}`),
    xcp(`/assets/${asset}/holders?limit=100`),
    xcp(`/assets/${asset}/sends?limit=20`),
    xcp(`/assets/${asset}/orders?status=open&limit=10`),
  ]);

  const { floor, dispensers } = await getFloor(asset);

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
    from:   shortAddr(s.source),
    to:     shortAddr(s.destination),
    blockIndex: s.block_index ?? null,
    txHash: s.tx_hash,
    xcUrl:  `https://xchain.io/tx/${s.tx_hash}`,
  }));

  // Open orders (DEX)
  const orders = (ordersRes?.result || []).map(o => ({
    id:     o.tx_hash,
    asset:  asset,
    type:   o.give_asset === asset ? 'offer' : 'bid',
    from:   shortAddr(o.source),
    to:     null,
    blockIndex: o.block_index ?? null,
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
    dispensers,
    transactions,
    fetchedAt:    new Date().toISOString(),
  };
}

function shortAddr(addr) {
  if (!addr) return '—';
  return `${addr.slice(0,6)}…${addr.slice(-4)}`;
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
