import { useState, useEffect } from 'react';
import { TIMELINE, TRAITS, DJPEPE_STATS } from '../data/index.js';
import './DJPepe.css';

const LINKS = [
  { label: 'Pepe.WTF Asset Page', url: 'https://pepe.wtf/asset/DJPEPE'      },
  { label: 'XChain Explorer',     url: 'https://xchain.io/asset/DJPEPE'      },
  { label: 'Rare Pepe Directory', url: 'https://rarepepedirectory.com'       },
  { label: 'Counterparty.io',     url: 'https://counterparty.io'             },
  { label: 'FAKEDJPEPE on XChain',url: 'https://xchain.io/asset/FAKEDJPEPE'  },
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
        <img src="/DJPEPE.jpg" alt="DJ PEPE" className="hero-art-img" />
        <div className="hero-art-overlay">
          <span className="pill pill-green">First Audio NFT</span>
          <span className="pill pill-red">No Requests</span>
        </div>
      </div>

      {/* ── HERO INFO ─────────────────────────────────────── */}
      <div className="hero-info">
        <div className="eyebrow">Rare Pepe · Blockchain Asset · 2016</div>
        <h1 className="asset-title">
          DJ PEPE <span className="asset-sub">/ DJPEPE</span>
        </h1>
        <p className="asset-desc-compact">
          The first audio NFT in history — minted on Bitcoin via Counterparty (XCP), Oct 13 2016.
          169 issued. Hip-Hop Elements series, card 1 of 4. Strong hands only.
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
            Buy on Pepe.WTF ↗
          </a>
          <a href="https://xchain.io/asset/DJPEPE" target="_blank" rel="noreferrer" className="btn btn-outline">
            View on Chain ↗
          </a>
        </div>
      </div>

      {/* ── HISTORY + TRAITS ─────────────────────────────── */}
      <div className="history-layout">

        {/* Timeline */}
        <div>
          <div className="sec-label">Asset lore &amp; history</div>
          <div className="timeline">
            {TIMELINE.map((t, i) => (
              <div key={i} className="timeline-entry">
                <div className="tl-year">{t.year}</div>
                <div className="tl-body">
                  <h4 className="tl-heading">{t.heading}</h4>
                  <p className="tl-text">{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traits + Links */}
        <div className="traits-col">
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
              <span>↗</span> {l.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
