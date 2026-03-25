import { TIMELINE, TRAITS, DJPEPE_STATS } from '../data/index.js';
import './DJPepe.css';

const LINKS = [
  { label: 'Pepe.WTF Asset Page', url: 'https://pepe.wtf/asset/DJPEPE'      },
  { label: 'XChain Explorer',     url: 'https://xchain.io/asset/DJPEPE'      },
  { label: 'Rare Pepe Directory', url: 'https://rarepepedirectory.com'       },
  { label: 'Counterparty.io',     url: 'https://counterparty.io'             },
  { label: 'FAKEDJPEPE on XChain',url: 'https://xchain.io/asset/FAKEDJPEPE'  },
];

const STATS = DJPEPE_STATS;

export default function DJPepe() {
  return (
    <div className="djpepe-page">

      {/* ── HERO ────────────────────────────────────────── */}
      <div className="hero">

        {/* Card */}
        <div className="card-side">
          <div className="card-outer">
            <div className="card-top">
              <div className="card-series">Hip-Hop Elements</div>
              <div className="card-name">DJ PEPE</div>
            </div>
            <div className="card-art">
              <img src="/DJPEPE.jpg" alt="DJ PEPE" className="card-art-img" />
              <div className="card-ability">100% Steals Yer Girl</div>
            </div>
            <div className="card-bottom">
              <div className="card-stat-row">
                <span>Series</span><b>1 of 4</b>
              </div>
              <div className="card-stat-row">
                <span>Chain</span><b>XCP</b>
              </div>
              <div className="card-footer">INVISBL SKRATCH PIKLZ · 2016</div>
            </div>
          </div>

          <div className="pill-row">
            <span className="pill pill-green">First Audio NFT</span>
            <span className="pill pill-red">No Requests</span>
            <span className="pill">Supply: 169</span>
          </div>
        </div>

        {/* Info */}
        <div className="info-side">
          <div className="eyebrow">Rare Pepe · Blockchain Asset · 2016</div>
          <h1 className="asset-title">
            DJ PEPE <span className="asset-sub">/ DJPEPE</span>
          </h1>
          <p className="asset-desc">
            The first audio NFT in history — minted on Bitcoin via Counterparty (XCP) on October 13th, 2016 by RareScrilla, years before Ethereum NFTs existed. One of the original blockchain trading cards. Hip-Hop Elements Series, card 1 of 4. 169 issued. Mostly given away at blockchain conferences from 2017–2019. Strong hands only.
          </p>

          <div className="stats-row">
            {STATS.map(s => (
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
            <a href="https://xchain.io" target="_blank" rel="noreferrer" className="btn btn-outline">
              View on Chain ↗
            </a>
            <button className="btn btn-red">Make Offer</button>
          </div>
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
