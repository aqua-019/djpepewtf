import { useState, useEffect } from 'react';
import { TRAITS, DJPEPE_STATS } from '../data/index.js';
import DJPepeTimeline from '../components/DJPepeTimeline.jsx';
import './DJPepe.css';

function ExternalLinkIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none"
         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M4 1h7v7M11 1L4.5 7.5"/>
    </svg>
  );
}

const LINKS = [
  { label: 'Pepe.WTF Asset Page',  url: 'https://pepe.wtf/asset/DJPEPE'    },
  { label: 'TokenScan Explorer',   url: 'https://tokenscan.io/asset/DJPEPE' },
  { label: 'Rare Pepe Directory',  url: 'https://rarepepedirectory.com'     },
  { label: 'Counterparty.io',      url: 'https://counterparty.io'           },
  { label: 'X / Twitter',          url: 'https://x.com/DJPEPE_'            },
  { label: 'Telegram',             url: 'PLACEHOLDER — update on receipt'   },
];

export default function DJPepe() {
  const [liveStats, setLiveStats] = useState(null);

  useEffect(() => {
    async function fetchLive() {
      try {
        const res = await fetch('/api/market?asset=DJPEPE');
        if (!res.ok) return;
        const json = await res.json();
        setLiveStats(json.assets?.DJPEPE ?? null);
      } catch { /* use static fallback */ }
    }
    fetchLive();
  }, []);

  const stats = DJPEPE_STATS.map(s => {
    if (!liveStats) return s;
    if (s.label === 'Floor' && liveStats.floor != null)
      return { ...s, value: `${liveStats.floor} BTC`, sub: 'Counterparty dispenser' };
    if (s.label === 'Holders' && liveStats.holders != null)
      return { ...s, value: String(liveStats.holders), sub: `of ${liveStats.supply ?? 169} minted` };
    if (s.label === 'Supply' && liveStats.supply != null)
      return { ...s, value: String(liveStats.supply) };
    return s;
  });

  return (
    <div className="djpepe-page">

      {/* ── HERO ART ──────────────────────────────────────── */}
      <div className="hero-art">
        <img src="/DJPEPE.jpg" alt="DJPEPE" className="hero-art-img" />
        <div className="hero-art-overlay">
          <span className="pill pill-green">First Audio NFT</span>
          <span className="pill pill-red">No Requests</span>
        </div>
      </div>

      {/* ── HERO INFO ─────────────────────────────────────── */}
      <div className="hero-info">
        <div className="eyebrow">COUNTERPARTY ASSET · 2016</div>
        <h1 className="asset-title">DJPEPE</h1>
        {/* TODO: Replace with Scrilla's official bio — pending confirmation */}
        <p className="asset-desc-compact">
          DJPEPE is the first tokenized blockchain art collectible with unlockable music —
          a Rare Pepe Series 1 card minted on the Counterparty protocol in October 2016 by
          artist Rare Scrilla. Recognized as the first audio NFT on any blockchain, DJPEPE
          pioneered blockchain-native music collectibles two years before the term NFT existed.
        </p>

        <div className="stats-row">
          {stats.map(s => (
            <div key={s.label} className="stat-box">
              <div className="stat-label">{s.label}</div>
              <div className={`stat-val ${s.value === null ? 'stat-null' : ''}`}>
                {s.value ?? '—'}
              </div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="btn-row">
          <a href="https://pepe.wtf/asset/DJPEPE" target="_blank" rel="noreferrer" className="btn btn-green">
            Buy on Pepe.WTF <ExternalLinkIcon />
          </a>
          <a href="https://tokenscan.io/asset/DJPEPE" target="_blank" rel="noreferrer" className="btn btn-outline">
            View on Chain <ExternalLinkIcon />
          </a>
        </div>
      </div>

      {/* ── AUDIO SECTION ────────────────────────────────── */}
      <div className="audio-section">
        <div className="audio-label">First Audio NFT</div>
        <div className="audio-bars">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="audio-bar" style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
        <p className="audio-desc">
          DJPEPE is the first audio NFT ever minted on any blockchain.
          Holders got access to exclusive music by Rare Scrilla.
        </p>
      </div>

      {/* ── TRAITS + LINKS ──────────────────────────────── */}
      <div className="history-layout">
        <div className="traits-col" style={{ borderLeft: 'none' }}>
          <div className="sec-label">Traits</div>
          {TRAITS.map(t => (
            <div key={t.name} className="trait-row">
              <span className="trait-name">{t.name}</span>
              <span className={`trait-val ${t.red ? 'red' : ''} ${t.amber ? 'amber' : ''}`}>
                {t.value}
              </span>
            </div>
          ))}

          <div className="sec-label" style={{ marginTop: 16 }}>Links</div>
          {LINKS.map(l => (
            <a key={l.label} href={l.url} target="_blank" rel="noreferrer" className="ext-link">
              <ExternalLinkIcon /> {l.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── TIMELINE ─────────────────────────────────────── */}
      <section className="djpepe-timeline-section">
        <h2 className="sec-label">Timeline</h2>
        <DJPepeTimeline />
      </section>
    </div>
  );
}
