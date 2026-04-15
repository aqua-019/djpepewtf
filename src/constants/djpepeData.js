// src/constants/djpepeData.js
// Static data for the DJPEPE page
// Source: Scrilla direct + DJTIMELINE1.txt + verified institutional records

export const djpepeData = {
  title: 'DJPEPE',
  subtitle: 'Series 4, Card 29 · Bitcoin · Counterparty XCP',

  bio: "The OG blockchain performance artist. DJ Pepe isn't just art — it's a living on-chain persona born October 13, 2016. Card holders unlock a token-gated music vault with exclusive tracks unavailable anywhere else. Minted by Rare Scrilla (@scrillaventura). Recognized as the first audio NFT on any blockchain.",

  // Holders value is null → live API populates it in DJPepe.jsx
  stats: [
    { id: 'issued',  label: 'Issued',  value: '169'          },
    { id: 'holders', label: 'Holders', value: null            },
    { id: 'minted',  label: 'Minted',  value: 'Oct 13, 2016' },
    { id: 'block',   label: 'Block',   value: '434,102'      },
  ],

  links: [
    { id: 'twitter',  label: 'X / Twitter', href: 'https://x.com/scrillaventura'     },
    { id: 'telegram', label: 'Telegram',    href: 'https://t.me/+CrS2z4dKw19hOTlh'  },
    // SoundCloud removed per April 16 corrections
  ],

  institutions: [
    {
      id: 'moca',
      type: 'Museum',
      name: 'Museum of Crypto Art',
      description: 'Genesis collection. Featured as "First Audio NFT." Virtual exhibitions, metaverse spaces, and physical pop-ups across NYC, Miami, and Zürich.',
    },
    {
      id: 'kunsthalle',
      type: 'Exhibition',
      name: 'DYOR — Kunsthalle Zürich',
      description: '"Do Your Own Research" (Oct 2022 – Jan 2023). Major institutional exhibition tracing Pepe\'s role in crypto art history. DJPEPE featured as early utility-driven card.',
    },
    {
      id: 'press',
      type: 'Media',
      name: 'The Paris Review · GQ · Artnome',
      description: 'Featured in landmark NFT history coverage. The Paris Review called DJPEPE "the first blockchain performance artist." GQ placed it alongside CryptoPunks and BAYC.',
    },
  ],
};
