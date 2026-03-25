// ── MOCK GALLERY FILES ────────────────────────────────────
export const GALLERY_FILES = [
  { id: 1,  name: 'DJPEPE.jpg',           type: 'jpg',  bg: 'g1', icon: '🐸', url: '/DJPEPE.jpg', upvotes: 2400, comments: 84,  views: 18000, isNew: true  },
  { id: 2,  name: 'dj_spinning.gif',      type: 'gif',  bg: 'g2', icon: '🎧', url: null,          upvotes: 891,  comments: 12,  views: 5100,  isNew: false },
  { id: 3,  name: 'pepe_beat.mp3',        type: 'mp3',  bg: 'g3', icon: '🎵', url: null,          upvotes: 432,  comments: 6,   views: 2100,  isNew: false },
  { id: 4,  name: 'no_requests.mp4',      type: 'mp4',  bg: 'g4', icon: '📼', url: null,          upvotes: 3100, comments: 51,  views: 22000, isNew: false },
  { id: 5,  name: 'trading_card.png',     type: 'png',  bg: 'g5', icon: '🎴', url: null,          upvotes: 1800, comments: 33,  views: 11000, isNew: false },
  { id: 6,  name: 'steals_yr_girl.jpg',   type: 'jpg',  bg: 'g6', icon: '💾', url: null,          upvotes: 5400, comments: 97,  views: 41000, isNew: false },
  { id: 7,  name: 'strong_hands.png',     type: 'png',  bg: 'g1', icon: '⚡', url: null,          upvotes: 648,  comments: 9,   views: 4200,  isNew: false },
  { id: 8,  name: 'invisbl_scratch.mp3',  type: 'mp3',  bg: 'g2', icon: '🔊', url: null,          upvotes: 211,  comments: 4,   views: 980,   isNew: false },
  { id: 9,  name: '750_links.png',        type: 'png',  bg: 'g3', icon: '🃏', url: null,          upvotes: 89,   comments: 2,   views: 312,   isNew: true  },
  { id: 10, name: 'serato_session.mp4',   type: 'mp4',  bg: 'g4', icon: '🎸', url: null,          upvotes: 1200, comments: 18,  views: 8700,  isNew: false },
  { id: 11, name: 'worthless_daytime.jpg',type: 'jpg',  bg: 'g5', icon: '📡', url: null,          upvotes: 3800, comments: 62,  views: 29000, isNew: false },
  { id: 12, name: 'pepe_turntable.gif',   type: 'gif',  bg: 'g6', icon: '🐸', url: null,          upvotes: 7700, comments: 140, views: 88000, isNew: false },
];

// ── MARKET ASSETS ─────────────────────────────────────────
export const MARKET_ASSETS = [
  {
    id:        'djpepe',
    name:      'DJ PEPE',
    ticker:    'DJPEPE',
    chain:     'XCP',
    icon:      '🐸',
    bg:        'g1',
    floor:     null,
    change:    null,
    supply:    169,
    holders:   null,
    volume:    null,
    lastSale:  null,
    bestOffer: null,
    buyUrl:    'https://pepe.wtf/asset/DJPEPE',
    xcUrl:     'https://xchain.io/asset/DJPEPE',
  },
  {
    id:        'fakedjpepe',
    name:      'FAKE DJ PEPE',
    ticker:    'FAKEDJPEPE',
    chain:     'XCP',
    icon:      '🐸',
    bg:        'g2',
    // ── TODO: fill these in from xchain.io/asset/FAKEDJPEPE ──
    floor:     null,   // TODO: floor price in XCP or ETH equiv
    change:    null,   // TODO: 24h % change e.g. 2.3 or -1.1
    supply:    null,   // TODO: total supply e.g. 100
    holders:   null,   // TODO: unique holder count
    volume:    null,   // TODO: all-time volume
    lastSale:  null,   // TODO: last sale price
    bestOffer: null,   // TODO: best open offer
    // ─────────────────────────────────────────────────────────
    subasset:  'FAKEDJPEPE.ENTER_THE_PEPE',
    buyUrl:    'https://pepe.wtf/asset/FAKEDJPEPE',
    xcUrl:     'https://xchain.io/asset/FAKEDJPEPE',
  },
];

// ── TRANSACTION HISTORY ───────────────────────────────────
export const TRANSACTIONS = [
  { id: 1, asset: 'DJPEPE',     type: 'sale',     value: null, from: '—', to: '—', time: '—', xcUrl: 'https://xchain.io/asset/DJPEPE' },
  { id: 2, asset: 'FAKEDJPEPE', type: 'sale',     value: null, from: '—', to: '—', time: '—', xcUrl: 'https://xchain.io/asset/FAKEDJPEPE' },
];

// ── PRICE HISTORY ─────────────────────────────────────────
export const PRICE_HISTORY = [
  { label: '2021', value: 4.2   },
  { label: '',     value: 5.8   },
  { label: '',     value: 7.1   },
  { label: '2022', value: 9.4   },
  { label: '',     value: 8.2   },
  { label: '',     value: 11.0  },
  { label: '2023', value: 10.4  },
  { label: '',     value: 12.6  },
  { label: '',     value: 11.8  },
  { label: '2024', value: 13.4  },
  { label: '',     value: 14.0  },
  { label: '2025', value: 14.82 },
];

// ── DJPEPE TIMELINE ───────────────────────────────────────
export const TIMELINE = [
  {
    year: '2016',
    heading: 'Origin — Minted on Bitcoin',
    body: 'DJPEPE created on October 13th, 2016 by RareScrilla on the Counterparty (XCP) protocol — years before Ethereum NFTs existed. 169 cards issued. Part of a four-card Hip-Hop series alongside MCPEPE, BBOYPEPE, and PEPEONE.',
  },
  {
    year: '2016',
    heading: 'The First Audio NFT',
    body: 'DJPEPE is the first audio NFT in history — tokenized crypto art meets music. Holders using Rare Pepe Wallet gained access to a private SoundCloud link with exclusive music by RareScrilla.',
  },
  {
    year: '2017',
    heading: 'Given Away at Blockchain Conferences',
    body: 'DJPEPE cards were mostly given away at blockchain conferences and events from 2017 through 2019, making them highly sought-after originals and one of the earliest crypto art pieces with unlockable bonus content.',
  },
  {
    year: 'NOW',
    heading: 'DJPEPE.WTF — The Official Archive',
    body: 'The canonical digital home for DJ PEPE culture, memes, and asset history. Strong hands only.',
  },
];

// ── DJPEPE TRAITS ─────────────────────────────────────────
export const TRAITS = [
  { name: 'Creator',   value: 'RareScrilla'  },
  { name: 'Minted',    value: 'Oct 13, 2016' },
  { name: 'Supply',    value: '169 Total'    },
  { name: 'Chain',     value: 'XCP / BTC'    },
  { name: 'Series',    value: 'Hip-Hop'      },
  { name: 'Audio NFT', value: '1st Ever', amber: true },
  { name: 'Requests',  value: 'NO', red: true },
];

// ── DJPEPE HERO STATS ─────────────────────────────────────
export const DJPEPE_STATS = [
  { label: 'Floor',   value: null,   sub: 'See pepe.wtf'       },
  { label: 'Supply',  value: '169',  sub: 'Total minted'       },
  { label: 'Holders', value: null,   sub: 'See xchain.io'      },
  { label: 'Chain',   value: 'XCP',  sub: 'Counterparty / BTC' },
  { label: 'Minted',  value: '2016', sub: 'Oct 13th'           },
  { label: 'Series',  value: 'HH',   sub: 'Hip-Hop, card 1/4'  },
];

// ── FORMAT HELPERS ────────────────────────────────────────
export function fmtNum(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export function fmtEth(n) {
  if (n === null || n === undefined) return '—';
  return `${n} ETH`;
}
