// ── MARKET ASSETS ─────────────────────────────────────
// Hip-Hop Elements series (4 cards) + FAKEDJPEPE
export const MARKET_ASSETS = [
  {
    id:           'djpepe',
    name:         'DJ PEPE',
    ticker:       'DJPEPE',
    chain:        'XCP',
    imgSrc:       '/assets/DJPEPE.jpg',
    imageFallback: '/assets/DJPEPE.jpg',
    supply:       169,
    holders:      null,
    floor:        null,
    series:       'Hip-Hop Elements 1/4',
    seriesGroup:  'hiphop',
    buyUrl:       'https://pepe.wtf/asset/DJPEPE',
    xcUrl:        'https://xchain.io/asset/DJPEPE',
  },
  {
    id:           'mcpepe',
    name:         'MC PEPE',
    ticker:       'MCPEPE',
    chain:        'XCP',
    imgSrc:       'https://xchain.io/img/cards/MCPEPE.png',
    supply:       169,
    holders:      null,
    floor:        null,
    series:       'Hip-Hop Elements 2/4',
    seriesGroup:  'hiphop',
    buyUrl:       'https://pepe.wtf/asset/MCPEPE',
    xcUrl:        'https://xchain.io/asset/MCPEPE',
  },
  {
    id:           'bboypepe',
    name:         'BBOY PEPE',
    ticker:       'BBOYPEPE',
    chain:        'XCP',
    imgSrc:       'https://xchain.io/img/cards/BBOYPEPE.png',
    supply:       169,
    holders:      null,
    floor:        null,
    series:       'Hip-Hop Elements 3/4',
    seriesGroup:  'hiphop',
    buyUrl:       'https://pepe.wtf/asset/BBOYPEPE',
    xcUrl:        'https://xchain.io/asset/BBOYPEPE',
  },
  {
    id:           'pepeone',
    name:         'PEPE ONE',
    ticker:       'PEPEONE',
    chain:        'XCP',
    imgSrc:       'https://xchain.io/img/cards/PEPEONE.png',
    supply:       169,
    holders:      null,
    floor:        null,
    series:       'Hip-Hop Elements 4/4',
    seriesGroup:  'hiphop',
    buyUrl:       'https://pepe.wtf/asset/PEPEONE',
    xcUrl:        'https://xchain.io/asset/PEPEONE',
  },
  {
    id:           'fakedjpepe',
    name:         'FAKE DJ PEPE',
    ticker:       'FAKEDJPEPE',
    chain:        'XCP',
    imgSrc:       'https://xchain.io/img/cards/FAKEDJPEPE.png',
    supply:       169,
    holders:      null,
    floor:        null,
    subasset:     'FAKEDJPEPE.ENTER_THE_PEPE',
    seriesGroup:  'homage',
    buyUrl:       'https://pepe.wtf/asset/FAKEDJPEPE',
    xcUrl:        'https://xchain.io/asset/FAKEDJPEPE',
  },
];

export const TIMELINE = [
  { year: '2016', heading: 'Rare Pepe Project Launches', body: 'The Rare Pepe project launches on the Counterparty (XCP) protocol, built on Bitcoin. A new era of blockchain art begins.' },
  { year: '2016', heading: 'DJPEPE Minted \u2014 First Audio NFT', body: 'On October 13th, DJPEPE is created by RareScrilla on Counterparty. 169 cards issued. The first audio NFT in history \u2014 holders got access to exclusive music. Part of the Hip-Hop Elements series alongside MCPEPE, BBOYPEPE, and PEPEONE.' },
  { year: '2016', heading: 'Rare Pepe Wallet Launches', body: 'Joe Looney creates Rare Pepe Wallet, enabling users to trade and collect Rare Pepe cards on the Counterparty protocol.' },
  { year: '2017', heading: 'Given Away at Blockchain Conferences', body: 'DJPEPE cards are distributed at blockchain conferences and events from 2017 through 2019, making them highly sought-after originals with unlockable bonus content.' },
  { year: '2018', heading: 'First Rare Pepe Auction', body: 'January 2018: Homer Pepe sells for $39,000 at the first live Rare Pepe auction in New York, establishing Rare Pepes as valuable digital art.' },
  { year: '2018', heading: 'Rare Pepe Foundation Established', body: 'The Rare Pepe Foundation is established to curate and preserve the Rare Pepe collection, ensuring the historical integrity of the project.' },
  { year: '2021', heading: 'NFT Boom \u2014 Rare Pepes Rediscovered', body: 'The mainstream NFT explosion brings renewed attention to Rare Pepes as the original crypto art. Collectors recognize their historical significance.' },
  { year: '2021', heading: 'Homer Pepe Resells for $312K', body: 'October 2021: Homer Pepe resells for $312,000 at a Sotheby\'s-adjacent event, cementing Rare Pepes as blue-chip digital collectibles.' },
  { year: '2023', heading: 'Fake Rares Emerge', body: 'Fake Rare Pepes begin appearing on XCP, including FAKEDJPEPE \u2014 homage tokens that reference the originals while creating their own collector communities.' },
  { year: 'NOW', heading: 'DJPEPE.WTF \u2014 The Official Archive', body: 'The canonical digital home for DJ PEPE culture, memes, and asset history. Strong hands only.' },
];

export const TRAITS = [
  { name: 'Creator',   value: 'RareScrilla'  },
  { name: 'Minted',    value: 'Oct 13, 2016' },
  { name: 'Supply',    value: '169 Total'    },
  { name: 'Chain',     value: 'XCP / BTC'    },
  { name: 'Series',    value: 'Hip-Hop'      },
  { name: 'Audio NFT', value: '1st Ever', amber: true },
  { name: 'Requests',  value: 'NO', red: true },
];

export const DJPEPE_STATS = [
  { label: 'Floor',   value: null,   sub: 'Live BTC'      },
  { label: 'Holders', value: null,   sub: 'Live count'    },
  { label: 'Supply',  value: '169',  sub: '169 minted'    },
  { label: 'Year',    value: '2016', sub: 'Oct 13th'      },
];

export function fmtNum(n) {
  if (n === null || n === undefined) return '\u2014';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}
