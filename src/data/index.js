// ── MOCK GALLERY FILES ────────────────────────────────────
export const GALLERY_FILES = [
  { id: 1,  name: 'DJPEPE_OG.jpg',         type: 'jpg',  bg: 'g1', icon: '🐸', upvotes: 2400, comments: 84,  views: 18000, isNew: true  },
  { id: 2,  name: 'dj_spinning.gif',        type: 'gif',  bg: 'g2', icon: '🎧', upvotes: 891,  comments: 12,  views: 5100,  isNew: false },
  { id: 3,  name: 'pepe_beat.mp3',          type: 'mp3',  bg: 'g3', icon: '🎵', upvotes: 432,  comments: 6,   views: 2100,  isNew: false },
  { id: 4,  name: 'no_requests.mp4',        type: 'mp4',  bg: 'g4', icon: '📼', upvotes: 3100, comments: 51,  views: 22000, isNew: false },
  { id: 5,  name: 'trading_card.png',       type: 'png',  bg: 'g5', icon: '🎴', upvotes: 1800, comments: 33,  views: 11000, isNew: false },
  { id: 6,  name: 'steals_yr_girl.jpg',     type: 'jpg',  bg: 'g6', icon: '💾', upvotes: 5400, comments: 97,  views: 41000, isNew: false },
  { id: 7,  name: 'strong_hands.png',       type: 'png',  bg: 'g1', icon: '⚡', upvotes: 648,  comments: 9,   views: 4200,  isNew: false },
  { id: 8,  name: 'invisbl_scratch.mp3',    type: 'mp3',  bg: 'g2', icon: '🔊', upvotes: 211,  comments: 4,   views: 980,   isNew: false },
  { id: 9,  name: '750_links.png',          type: 'png',  bg: 'g3', icon: '🃏', upvotes: 89,   comments: 2,   views: 312,   isNew: true  },
  { id: 10, name: 'serato_session.mp4',     type: 'mp4',  bg: 'g4', icon: '🎸', upvotes: 1200, comments: 18,  views: 8700,  isNew: false },
  { id: 11, name: 'worthless_daytime.jpg',  type: 'jpg',  bg: 'g5', icon: '📡', upvotes: 3800, comments: 62,  views: 29000, isNew: false },
  { id: 12, name: 'pepe_turntable.gif',     type: 'gif',  bg: 'g6', icon: '🐸', upvotes: 7700, comments: 140, views: 88000, isNew: false },
];

// ── MARKET ASSETS ─────────────────────────────────────────
export const MARKET_ASSETS = [
  {
    id: 'djpepe',
    name: 'DJ PEPE',
    ticker: 'DJPEPE',
    chain: 'XCP',
    icon: '🐸',
    bg: 'g1',
    floor: 14.82,
    change: +2.3,
    supply: 4,
    holders: 3,
    volume: 287,
    lastSale: 14.02,
    bestOffer: 12.50,
    buyUrl: 'https://pepe.wtf/asset/DJPEPE',
  },
  {
    id: 'pepebasic',
    name: 'PEPEBASIC',
    ticker: 'PEPEBASIC',
    chain: 'XCP',
    icon: '🃏',
    bg: 'g2',
    floor: 0.88,
    change: +0.5,
    supply: 1000,
    holders: 312,
    volume: 44,
    lastSale: 0.86,
    bestOffer: 0.80,
    buyUrl: 'https://pepe.wtf/asset/PEPEBASIC',
  },
  {
    id: 'rarepepe',
    name: 'RAREPEPE',
    ticker: 'RPEPE',
    chain: 'XCP',
    icon: '🎴',
    bg: 'g3',
    floor: 8.44,
    change: -1.1,
    supply: 100,
    holders: 38,
    volume: 122,
    lastSale: 8.20,
    bestOffer: 7.90,
    buyUrl: 'https://xchain.io',
  },
];

// ── TRANSACTION HISTORY ───────────────────────────────────
export const TRANSACTIONS = [
  { id: 1, asset: 'DJPEPE',      type: 'sale',     value: 14.02, from: '0x7a2...f08c', to: '0x2b9...3a4e', time: '2hr ago'  },
  { id: 2, asset: 'PEPEBASIC',   type: 'offer',    value: 12.80, from: '0xa1f...b22d', to: null,           time: '4hr ago'  },
  { id: 3, asset: 'DJPEPE',      type: 'list',     value: 15.00, from: '0x2b9...3a4e', to: null,           time: '8hr ago'  },
  { id: 4, asset: 'RAREPEPE #12',type: 'sale',     value: 8.44,  from: '0x99c...1f3a', to: '0x7a2...f08c', time: '1d ago'   },
  { id: 5, asset: 'DJPEPE',      type: 'transfer', value: null,  from: '0x444...zz1',  to: '0x7a2...f08c', time: '3d ago'   },
];

// ── PRICE HISTORY (chart points) ─────────────────────────
export const PRICE_HISTORY = [
  { label: '2021', value: 4.2  },
  { label: '',     value: 5.8  },
  { label: '',     value: 7.1  },
  { label: '2022', value: 9.4  },
  { label: '',     value: 8.2  },
  { label: '',     value: 11.0 },
  { label: '2023', value: 10.4 },
  { label: '',     value: 12.6 },
  { label: '',     value: 11.8 },
  { label: '2024', value: 13.4 },
  { label: '',     value: 14.0 },
  { label: '2025', value: 14.82},
];

// ── DJPEPE TIMELINE ───────────────────────────────────────
export const TIMELINE = [
  {
    year: '2016',
    heading: 'Origin — Rare Pepe Directory',
    body: 'DJ PEPE minted on Bitcoin via Counterparty — before Ethereum NFTs existed. One of the foundational blockchain trading cards in history. Hip-Hop Elements Series, card 1 of 4.',
  },
  {
    year: '2017',
    heading: 'First Rare Pepe Auction — NYC',
    body: 'The Rare Pepe Blockchain Summit. First IRL blockchain art auction. Hip-Hop Elements Series recognized as canonical. DJ PEPE trades hands publicly for the first time.',
  },
  {
    year: '2021',
    heading: 'The Rebirth — NFT Era Rediscovers XCP',
    body: 'Collectors flood back to OG Counterparty assets. Floor surges. Only 4 exist. INVISBL SKRATCH PIKLZ authorship confirmed by the community.',
  },
  {
    year: 'NOW',
    heading: 'DJPEPE.WTF — The Official Archive',
    body: 'The canonical digital home for DJ PEPE culture, memes, and asset history. Strong hands only.',
  },
];

// ── DJPEPE TRAITS ─────────────────────────────────────────
export const TRAITS = [
  { name: 'Ability',    value: '∞ Awake'     },
  { name: 'Hands',      value: 'Strong 💪'   },
  { name: 'Format',     value: 'Vinyl / SRT' },
  { name: 'Supply',     value: '4 Total'     },
  { name: 'Requests',   value: 'NO',  red: true  },
  { name: 'Girl Steal', value: '100%'         },
  { name: 'Rarity',     value: 'Mythic', amber: true },
];

// ── FORMAT HELPER ─────────────────────────────────────────
export function fmtNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}
