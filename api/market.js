/**
 * /api/market.js
 * Server-side proxy for Counterparty API v2.
 * Fetches asset info, holders, dispensers, dispenses (actual sales),
 * and recent sends for one or more XCP assets.
 * Optionally fetches OpenSea Emblem Vault sales if OPENSEA_API_KEY is set.
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

// Resolve asset image from Counterparty description metadata URL
async function resolveImageUrl(description) {
  if (!description) return null;
  // Check if description looks like a URL or contains one
  const urlMatch = description.match(/https?:\/\/[^\s"']+\.json/i)
    || description.match(/^(https?:\/\/[^\s]+|[a-z0-9.-]+\/[^\s]+\.json)$/i);
  if (!urlMatch) {
    // Some descriptions are bare domain paths like "res.indiesquare.me/json/BBOYPEPE.json"
    const bareUrl = description.match(/^([a-z0-9.-]+\.[a-z]+\/[^\s]+)$/i);
    if (bareUrl) {
      try {
        const res = await fetch(`https://${bareUrl[1]}`, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const json = await res.json();
          return json.image || json.image_large || null;
        }
      } catch {}
    }
    return null;
  }
  try {
    const url = urlMatch[0].startsWith('http') ? urlMatch[0] : `https://${urlMatch[0]}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const json = await res.json();
    return json.image || json.image_large || json.image_url || null;
  } catch {
    return null;
  }
}

// Get floor price + open dispensers
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
      btcPrice: best.satoshirate / 1e8,
      xcpPrice: best.give_quantity,
      dispenser: best.source,
    } : null,
    dispensers: openDispensers,
  };
}

// Fetch OpenSea Emblem Vault sales for a specific asset name
async function getOpenSeaSales(assetName) {
  const apiKey = process.env.OPENSEA_API_KEY;
  if (!apiKey) return [];
  try {
    const url = `https://api.opensea.io/api/v2/events/collection/emblem-vault?event_type=sale&limit=30`;
    const res = await fetch(url, {
      headers: { 'X-API-KEY': apiKey, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    // Filter for sales that mention this asset in the NFT name
    return (data.asset_events || [])
      .filter(e => {
        const name = (e.nft?.name || '').toUpperCase();
        return name.includes(assetName);
      })
      .slice(0, 10)
      .map(e => ({
        id: e.order_hash || e.transaction?.hash || `os-${Date.now()}`,
        asset: assetName,
        type: 'opensea-sale',
        ethPrice: e.payment?.quantity ? parseFloat(e.payment.quantity) / 1e18 : null,
        from: shortAddr(e.seller),
        to: shortAddr(e.buyer),
        timestamp: e.event_timestamp ? new Date(e.event_timestamp).toISOString() : null,
        openseaUrl: e.nft?.opensea_url || `https://opensea.io/collection/emblem-vault`,
      }));
  } catch {
    return [];
  }
}

async function getAssetData(asset) {
  // Run all requests in parallel
  const [info, holdersRes, sendsRes, ordersRes, dispensesRes] = await Promise.all([
    xcp(`/assets/${asset}`),
    xcp(`/assets/${asset}/holders?limit=100`),
    xcp(`/assets/${asset}/sends?limit=20`),
    xcp(`/assets/${asset}/orders?status=open&limit=10`),
    xcp(`/assets/${asset}/dispenses?limit=50`),
  ]);

  const { floor, dispensers } = await getFloor(asset);

  const supply    = info?.result?.supply     ?? null;
  const locked    = info?.result?.locked     ?? false;
  const desc      = info?.result?.description ?? '';
  const issuer    = info?.result?.issuer     ?? null;
  const divisible = info?.result?.divisible  ?? false;
  const owner     = info?.result?.owner      ?? null;

  const holders = holdersRes?.result?.length ?? null;
  const totalSupplyUnits = divisible && supply ? supply / 1e8 : supply;

  // Resolve image from metadata
  const imageUrl = await resolveImageUrl(desc);

  // Completed dispenses (actual sales with BTC amounts)
  const dispenses = (dispensesRes?.result || []).map(d => ({
    id:        d.tx_hash,
    asset:     asset,
    type:      'sale',
    btcPrice:  d.satoshirate ? d.satoshirate / 1e8 : null,
    quantity:  d.dispense_quantity ?? 1,
    from:      shortAddr(d.source),
    to:        shortAddr(d.destination),
    blockIndex: d.block_index ?? null,
    timestamp: d.block_time ? new Date(d.block_time * 1000).toISOString() : null,
    txHash:    d.tx_hash,
    xcUrl:     `https://xchain.io/tx/${d.tx_hash}`,
    tsUrl:     `https://tokenscan.io/tx/${d.tx_hash}`,
  }));

  // Recent sends (transfers)
  const sends = (sendsRes?.result || []).map(s => ({
    id:        s.tx_hash,
    asset:     asset,
    type:      'transfer',
    btcPrice:  null,
    quantity:  s.quantity ?? 1,
    from:      shortAddr(s.source),
    to:        shortAddr(s.destination),
    blockIndex: s.block_index ?? null,
    timestamp: s.block_time ? new Date(s.block_time * 1000).toISOString() : null,
    txHash:    s.tx_hash,
    xcUrl:     `https://xchain.io/tx/${s.tx_hash}`,
    tsUrl:     `https://tokenscan.io/tx/${s.tx_hash}`,
  }));

  // Open orders (DEX)
  const orders = (ordersRes?.result || []).map(o => ({
    id:        o.tx_hash,
    asset:     asset,
    type:      o.give_asset === asset ? 'offer' : 'bid',
    btcPrice:  o.give_asset === 'BTC' ? o.give_quantity / 1e8 : null,
    quantity:  1,
    from:      shortAddr(o.source),
    to:        null,
    blockIndex: o.block_index ?? null,
    timestamp: o.block_time ? new Date(o.block_time * 1000).toISOString() : null,
    txHash:    o.tx_hash,
    xcUrl:     `https://xchain.io/order/${o.tx_hash}`,
    tsUrl:     `https://tokenscan.io/tx/${o.tx_hash}`,
  }));

  // OpenSea sales (if API key available)
  const openseaSales = await getOpenSeaSales(asset);

  // Combined transactions: dispenses first (most valuable), then orders, then sends
  const transactions = [...dispenses, ...orders, ...sends].slice(0, 50);

  // Last sale info
  const lastSale = dispenses.length > 0 ? {
    price: dispenses[0].btcPrice,
    timestamp: dispenses[0].timestamp,
  } : null;

  return {
    ticker:        asset,
    supply:        totalSupplyUnits ? Math.round(totalSupplyUnits) : null,
    holders,
    locked,
    divisible,
    issuer,
    owner,
    description:   desc,
    imageUrl,
    floor:         floor ? parseFloat(floor.btcPrice.toFixed(6)) : null,
    floorSats:     floor ? Math.round(floor.btcPrice * 1e8) : null,
    floorXcp:      floor?.xcpPrice ?? null,
    dispenserAddr: floor?.dispenser ?? null,
    dispenserCount: dispensers.length,
    dispensers,
    dispenses,
    totalSales:    dispenses.length,
    lastSale,
    transactions,
    openseaSales,
    fetchedAt:     new Date().toISOString(),
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
