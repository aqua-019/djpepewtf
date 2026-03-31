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
    floor:     null,
    change:    null,
    supply:    null,
    holders:   null,
    volume:    null,
    lastSale:  null,
    bestOffer: null,
    subasset:  'FAKEDJPEPE.ENTER_THE_PEPE',
    buyUrl:    'https://pepe.wtf/asset/FAKEDJPEPE',
    xcUrl:     'https://xchain.io/asset/FAKEDJPEPE',
  },
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