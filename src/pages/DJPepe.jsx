import { useState, useEffect } from 'react';
import { djpepeData } from '../constants/djpepeData.js';
import { HeroSection }       from './djpepe-cells/HeroSection.jsx';
import { CardArtSection }    from './djpepe-cells/CardArtSection.jsx';
import { StatsGrid }         from './djpepe-cells/StatsGrid.jsx';
import { CTAButtons }        from './djpepe-cells/CTAButtons.jsx';
import { TimelineSection }   from './djpepe-cells/TimelineSection.jsx';
import { InstitutionalCards } from './djpepe-cells/InstitutionalCards.jsx';
import './DJPepe.css';

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

  // Merge live data into static stats where available
  const stats = djpepeData.stats.map((s) => {
    if (!liveStats) return s;
    if (s.id === 'holders' && liveStats.holders != null)
      return { ...s, value: String(liveStats.holders) };
    if (s.id === 'issued' && liveStats.supply != null)
      return { ...s, value: String(liveStats.supply) };
    return s;
  });

  return (
    <div className="djpepe-page">

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="djpepe-hero-container">
        <div className="djpepe-hero-grid">
          <div className="djpepe-hero-left">
            <HeroSection />
            <StatsGrid stats={stats} />
            <CTAButtons />
          </div>
          <div className="djpepe-hero-right">
            <CardArtSection />
          </div>
        </div>
      </section>

      {/* ── TIMELINE ────────────────────────────────────────── */}
      <section className="djpepe-timeline-section">
        <TimelineSection />
      </section>

      {/* ── INSTITUTIONAL ───────────────────────────────────── */}
      <section className="djpepe-section-container">
        <InstitutionalCards />
      </section>

    </div>
  );
}
