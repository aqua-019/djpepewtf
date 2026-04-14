// lib/tickerItems.js
// Generates the full scrolling ticker item list for the DJPEPE.WTF info bar.
// Mixes live market data with static lore from DJPEPE history.

export function buildTickerItems({
  floor,
  btcUsd,
  supply,
  holders,
  memeCount,
} = {}) {
  const fmtUsd = (n) =>
    n?.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const floorUsd  = floor && btcUsd ? fmtUsd(floor * btcUsd) : null;
  const satsFloor = floor ? `${(floor * 1e8).toLocaleString()} SATS` : null;

  const dynamic = [
    floor     ? `DJPEPE FLOOR \u00b7 ${floor} BTC`    : null,
    floorUsd  ? `DJPEPE FLOOR \u00b7 ${floorUsd} USD` : null,
    satsFloor ? `DJPEPE FLOOR \u00b7 ${satsFloor}`     : null,
    supply    ? `SUPPLY \u00b7 ${supply} CIRCULATING`  : null,
    holders   ? `HOLDERS \u00b7 ${holders} WALLETS`     : null,
    memeCount ? `${memeCount} MEMES IN ARCHIVE`         : null,
  ].filter(Boolean);

  const lore = [
    'NO REQUESTS \u00b7 STRONG HANDS ONLY',
    'SERIES 4 \u00b7 CARD 29 \u00b7 MINTED OCT 13 2016',
    'BORN ON BITCOIN BLOCK 434,102',
    '169 EVER ISSUED \u00b7 4 BURNED BY CHAD COLLECTORS \u00b7 TRUE SCARCITY',
    '165 CIRCULATING \u00b7 FOREVER ON THE BITCOIN LEDGER',
    'FIRST AUDIO NFT IN HISTORY',
    'FIRST TOKENIZED BLOCKCHAIN ART COLLECTIBLE WITH UNLOCKABLE MUSIC',
    'PREDATES ETHEREUM NFTS BY YEARS',
    'BITCOIN ORDINAL #455 \u00b7 ETCHED ON-CHAIN FOREVER',
    '30+ XCP SUB-ASSETS SPAWNED SINCE 2016',
    'COUNTERPARTY PROTOCOL \u00b7 XCP \u00b7 BITCOIN',
    'LOCKED \u00b7 NON-DIVISIBLE \u00b7 VERIFIABLY SCARCE',
    'CREATOR \u00b7 RARE SCRILLA \u00b7 @SCRILLAVENTURA',
    'DJPEPE IS LITERALLY DJ Q-BERT \u2014 RARE SCRILLA',
    'FIRST BLOCKCHAIN ART PIECE WITH ITS OWN TWITTER PERSONA \u00b7 @DJPEPE_ \u00b7 2017',
    'TOKEN-GATED SOUNDCLOUD \u00b7 30 EXCLUSIVE TRACKS \u00b7 EARLIEST TOKEN-GATED AUDIO IN CRYPTO',
    'WORLD-PREMIERED BENNY THE BUTCHER & CONWAY THE MACHINE INSTRUMENTALS \u00b7 FOR HOLDERS ONLY',
    'SILK ROAD ERA BITCOIN MUSIC \u00b7 SOLD VIA BTC',
    'HIP-HOP 4 ELEMENTS SERIES \u00b7 DJ \u00b7 MC \u00b7 BBOY \u00b7 WRITER \u00b7 169 EACH',
    'FAKEDJPEPE \u00b7 OFFICIAL COLLAB WITH LEGENDARY SCRATCH DJ Q-BERT',
    'FEATURED IN THE PARIS REVIEW \u00b7 JAN 2018',
    'HEADLINED RARE AF NYC \u00b7 JAN 13 2018',
    'LIFE-SIZE 6FT CARDBOARD CUTOUT \u00b7 AUCTIONED LIVE \u00b7 RARE AF 2018',
    'MOMA \u00b7 MET \u00b7 SOTHEBY\u2019S INSTITUTE ATTENDED RARE AF 2018',
    'HOMERPEPE SOLD AT SAME AUCTION \u00b7 36,000 PEPECASH',
    'BITCOIN MAGAZINE CONFERENCE 2019 \u00b7 SAN FRANCISCO',
    'MUSEUM OF CRYPTO ART \u00b7 GENESIS COLLECTION',
    'NARCISSUS GALLERY \u00b7 DECENTRALAND \u00b7 MAY 2021',
    'BITCOIN 2021 CONFERENCE \u00b7 MIAMI',
    'NFT.NYC 2022 \u00b7 WORLD\u2019S FIRST NFT ATM MINT',
    'FEATURED IN BRITISH GQ \u00b7 JUNE 2022',
    'HNFT FEST BARCELONA \u00b7 OCT 2022',
    'FAKE BASEL \u00b7 ART BASEL MIAMI WYNWOOD \u00b7 DEC 2022',
    'KUNSTHALLE Z\u00dcRICH \u00b7 DYOR EXHIBITION \u00b7 OCT 2022',
    'PEPE FEST PARIS 2023 \u00b7 NFT FACTORY \u00b7 AVANT GALERIE',
    'BEEPLE\u2019S PEPEFEST 2024 \u00b7 AI PEPE MUSIC WORLD PREMIERE',
    'NASHVILLE GALLERY PARTY 2024',
    'THE OCTAGON \u00b7 LAS VEGAS \u00b7 DJPEPE 9 YEAR PARTY \u00b7 2025',
    'ART MOEVMENT \u00b7 A DECADE OF DJPEPE \u00b7 2016\u20132026',
    'PROTO-NFT UTILITY BLUEPRINT',
    'SPOTLIGHTED IN ARTNOME\u2019S BIRTH OF CRYPTOART \u00b7 2018',
    'FRED WILSON AVC BLOG \u00b7 2017 \u00b7 \u2018I PAID $22.38 FOR THIS\u2019',
    'OG BLOCKCHAIN ARTIST \u00b7 RAREAF TALKS 2018',
    '10TH ANNIVERSARY \u00b7 OCTOBER 13 2026',
    'BTC VEGAS 2026 \u00b7 PHYSICAL CARD DEBUT \u00b7 300 PRINTED',
    'DJPEPE.WTF \u00b7 THE OFFICIAL ARCHIVE',
    'RARESCRILLA.COM',
  ];

  if (dynamic.length === 0) return lore;

  const result = [];
  let d = 0;
  let l = 0;

  while (l < lore.length || d < dynamic.length) {
    if (result.length % 4 === 0 && d < dynamic.length) {
      result.push(dynamic[d]);
      d++;
    } else if (l < lore.length) {
      result.push(lore[l]);
      l++;
    } else {
      break;
    }
  }

  return result;
}
