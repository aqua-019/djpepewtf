/**
 * timelineCorrelation.js
 * Maps gallery image filenames to DJPEPE historical events via keyword rules.
 * Used by GalleryModal to show related timeline context when a match is found.
 */

const KEYWORD_RULES = [
  {
    patterns: [/q[_-]?bert/i, /qbert/i],
    title: 'DJ Q-Bert \u2014 The Inspiration',
    date: '2016\u2013present',
    description: 'Q-Bert\u2019s turntablism directly inspired DJPEPE\u2019s creation. Rare Scrilla designed the card as an homage to hip-hop DJ culture.',
  },
  {
    patterns: [/soundcloud/i, /SOUNDCLOUDdjpepe/i],
    title: 'Token-Gated SoundCloud',
    date: '2016\u20132024',
    description: 'DJPEPE holders got access to an exclusive SoundCloud vault \u2014 the first token-gated music in crypto history.',
  },
  {
    patterns: [/djkekmas/i, /naples/i, /kekmas/i],
    title: 'Pepe Fest \u2014 Naples',
    date: '2023',
    description: 'International Rare Pepe community gathering featuring live DJ sets and physical card trading.',
  },
  {
    patterns: [/scrilla.*poster/i, /SCRILLA_POSTER/i, /poster.*scrilla/i],
    title: 'Scrilla Event Poster',
    date: '2021',
    description: 'Rare Scrilla promotional materials for live events and gallery showings.',
  },
  {
    patterns: [/1520909/],
    title: 'Rare AF NYC',
    date: 'January 2018',
    description: 'The first live Rare Pepe auction in New York. Homer Pepe sold for $39,000, establishing Rare Pepes as valuable digital art.',
  },
  {
    patterns: [/rareaf/i, /rare[_-]?af/i, /rare_af/i],
    title: 'Rare AF NYC',
    date: 'January 2018',
    description: 'The first live Rare Pepe auction in New York. Homer Pepe sold for $39,000, establishing Rare Pepes as valuable digital art.',
  },
  {
    patterns: [/nashville/i],
    title: 'Nashville Gallery Party',
    date: '2024',
    description: 'Rare Pepe community event in Nashville featuring physical card displays and DJ sets.',
  },
  {
    patterns: [/42069/],
    title: '42069 Drop',
    date: '2024',
    description: 'Special commemorative DJPEPE drop celebrating the iconic meme number.',
  },
  {
    patterns: [/homer[_-]?pepe/i],
    title: 'Homer Pepe Auction',
    date: 'January 2018',
    description: 'Homer Pepe sold for $39,000 at the first live Rare Pepe auction, later reselling for $312,000 in 2021.',
  },
  {
    patterns: [/bitcoin[_-]?mag/i, /btcmag/i, /vegas/i, /conference/i],
    title: 'Bitcoin Magazine Las Vegas 2026',
    date: 'April 2026',
    description: '10th anniversary celebration of DJPEPE at the Bitcoin Magazine conference. 300 physical cards printed.',
  },
  {
    patterns: [/sotheby/i],
    title: 'Sotheby\u2019s Natively Digital Auction',
    date: 'October 2021',
    description: 'Rare Pepes featured in Sotheby\u2019s Natively Digital auction, alongside CryptoPunks and Art Blocks.',
  },
  {
    patterns: [/moma/i, /met[_-]?museum/i, /museum/i],
    title: 'Museum & Gallery Exhibitions',
    date: '2019\u20132024',
    description: 'DJPEPE and Rare Pepes exhibited at major institutions including references to MoMA and The Met.',
  },
  {
    patterns: [/gq[_-]?magazine/i, /gq.*feature/i],
    title: 'GQ Magazine Feature',
    date: 'August 2021',
    description: 'GQ featured Rare Pepes in their coverage of the NFT art movement, highlighting DJPEPE as a pioneering work.',
  },
  {
    patterns: [/paris/i],
    title: 'Paris Rare Pepe Event',
    date: '2023',
    description: 'European Rare Pepe community gathering with physical card trading and artist meetups.',
  },
  {
    patterns: [/10[_-]?year/i, /anniversary/i, /10th/i],
    title: 'DJPEPE 10th Anniversary',
    date: 'October 2026',
    description: '10 years since DJPEPE was minted on Counterparty. 300 physical anniversary cards commemorate the milestone.',
  },
  {
    patterns: [/hip[_-]?hop/i, /bboy/i, /breakdanc/i],
    title: 'Hip-Hop Elements Series',
    date: '2016',
    description: 'DJPEPE is part of the Hip-Hop Elements 4-card series: DJPEPE, MCPEPE, BBOYPEPE, and PEPEONE.',
  },
  {
    patterns: [/counterparty/i, /xcp/i],
    title: 'Counterparty Protocol',
    date: '2014\u2013present',
    description: 'The Bitcoin-based protocol where all Rare Pepes, including DJPEPE, were minted and traded.',
  },
  {
    patterns: [/dispenser/i, /vending/i],
    title: 'Counterparty Dispensers',
    date: '2019\u2013present',
    description: 'On-chain vending machines for Counterparty assets. Send BTC to a dispenser address to receive DJPEPE.',
  },
];

/**
 * Search filename against keyword rules and return matching events.
 * @param {string} filename - The gallery file name (e.g. "IMG_qbert_5698.jpg")
 * @returns {Array<{title: string, date: string, description: string}>}
 */
export function findTimelineEvents(filename) {
  if (!filename) return [];
  const matches = [];
  const seen = new Set();

  for (const rule of KEYWORD_RULES) {
    if (seen.has(rule.title)) continue;
    for (const pattern of rule.patterns) {
      if (pattern.test(filename)) {
        matches.push({ title: rule.title, date: rule.date, description: rule.description });
        seen.add(rule.title);
        break;
      }
    }
  }

  return matches;
}
