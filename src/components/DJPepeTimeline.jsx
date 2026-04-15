import { useEffect, useRef, useCallback } from 'react';
import { TIMELINE_EVENTS } from '../data/timelineEvents.js';
import './DJPepeTimeline.css';

export default function DJPepeTimeline() {
  const scrollRef = useRef(null);
  const canvasRef = useRef(null);
  const ptsRef   = useRef([]);

  /* ─── PARTICLE TRAIL — mouse + touch ──────────────────── */
  useEffect(() => {
    const cv   = canvasRef.current;
    const cont = cv.parentElement;
    const ctx  = cv.getContext('2d');
    let raf;

    const resize = () => {
      cv.width  = cont.offsetWidth;
      cv.height = cont.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cont);

    const addPt = (x, y) =>
      ptsRef.current.push({ x, y, l: 1, r: Math.random() * 2 + 0.8 });

    const onMouse = (e) => {
      const r = cont.getBoundingClientRect();
      addPt(e.clientX - r.left, e.clientY - r.top);
    };
    const onTouch = (e) => {
      const r = cont.getBoundingClientRect();
      Array.from(e.touches).forEach(t =>
        addPt(t.clientX - r.left, t.clientY - r.top)
      );
    };

    cont.addEventListener('mousemove', onMouse);
    cont.addEventListener('touchmove', onTouch, { passive: true });

    const draw = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ptsRef.current = ptsRef.current.filter(p => p.l > 0.01);
      ptsRef.current.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.l, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(82,181,99,${p.l * 0.3})`;
        ctx.fill();
        p.l *= 0.88;
        p.r *= 0.98;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      cont.removeEventListener('mousemove', onMouse);
      cont.removeEventListener('touchmove', onTouch);
    };
  }, []);

  /* ─── SCROLL REVEAL — IntersectionObserver ─────────────── */
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('tl-vis');
            obs.unobserve(e.target);
          }
        }),
      { threshold: 0.08, root, rootMargin: '0px 0px -16px 0px' }
    );
    root.querySelectorAll('.tl-card').forEach((c, i) => {
      c.style.transitionDelay = `${(i % 3) * 0.06}s`;
      obs.observe(c);
    });
    return () => obs.disconnect();
  }, []);

  /* ─── TAP/CLICK TOGGLE — mobile + desktop ──────────────── */
  const handleCardClick = useCallback((e) => {
    const card = e.currentTarget;
    const dot  = card.closest('.tl-row')?.querySelector('.tl-dot');
    const isOpen = card.classList.toggle('tl-open');
    dot?.classList.toggle('tl-dot-active', isOpen);
  }, []);

  /* ─── MOUSE GLOW ─────────────────────────────────────────── */
  const handleMouseMove = useCallback((e) => {
    const card = e.currentTarget;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`);
    card.style.setProperty('--my', `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`);
  }, []);

  /* ─── DOT SYNC — hover ───────────────────────────────────── */
  const handleMouseEnter = useCallback((e) => {
    const dot = e.currentTarget.closest('.tl-row')?.querySelector('.tl-dot');
    dot?.classList.add('tl-dot-active');
  }, []);
  const handleMouseLeave = useCallback((e) => {
    const card = e.currentTarget;
    const dot  = card.closest('.tl-row')?.querySelector('.tl-dot');
    if (!card.classList.contains('tl-open')) dot?.classList.remove('tl-dot-active');
  }, []);

  /* ─── GROUP EVENTS BY yearGroup ──────────────────────────── */
  const groups = [];
  let currentGroup = null;
  TIMELINE_EVENTS.forEach((ev) => {
    if (!currentGroup || currentGroup.year !== ev.yearGroup) {
      currentGroup = { year: ev.yearGroup, events: [] };
      groups.push(currentGroup);
    }
    currentGroup.events.push(ev);
  });

  let globalIdx = 0;

  return (
    <div className="tl-wrap">
      {/* Particle canvas */}
      <canvas ref={canvasRef} className="tl-canvas" aria-hidden="true" />

      {/* Ambient blobs */}
      <div className="tl-bg" aria-hidden="true">
        <div className="tl-blob tl-b1" />
        <div className="tl-blob tl-b2" />
        <div className="tl-blob tl-b3" />
      </div>

      {/* Header */}
      <header className="tl-header">
        <div className="tl-header-icon" aria-hidden="true">𓆏</div>
        <div className="tl-header-text">
          <div className="tl-header-title">DJPEPE</div>
          <div className="tl-header-sub">Asset Lore &amp; History</div>
        </div>
        <span className="tl-header-count">
          {TIMELINE_EVENTS.filter(e => !e.isFuture).length} events
          {' · '}
          <span className="tl-header-future">Oct 13, 2026 ↗</span>
        </span>
      </header>

      {/* Scrollable body */}
      <div className="tl-scroll" ref={scrollRef}>
        {/* Spine */}
        <div className="tl-spine" aria-hidden="true">
          <div className="tl-spine-pulse" />
        </div>

        {/* Grid */}
        <div className="tl-grid">
          {groups.map(({ year, events }) => (
            <div key={year} style={{ display: 'contents' }}>

              {/* Ghost year chapter divider */}
              <div className="tl-year-ch" aria-hidden="true">
                <div className="tl-ych-line" />
                <div className={`tl-ych-label${year === '2026' ? ' tl-ych-future' : ''}`}>
                  {year === '2026' ? '2026 ↗' : year}
                </div>
                <div className="tl-ych-line" />
              </div>

              {events.map((ev) => {
                const idx  = globalIdx++;
                const left = idx % 2 === 0;

                const cardEl = (
                  <div
                    className={[
                      'tl-card',
                      left ? 'tl-card-left' : 'tl-card-right',
                      ev.isFuture ? 'tl-card-future' : '',
                    ].join(' ').trim()}
                    onClick={handleCardClick}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleCardClick(e)}
                    aria-label={ev.title}
                  >
                    {/* shimmer bar */}
                    <div className="tl-card-shimmer" aria-hidden="true" />
                    {/* mouse glow */}
                    <div className="tl-card-glow" aria-hidden="true" />

                    <div className="tl-year-chip">
                      {ev.isFuture && <span className="tl-future-badge">upcoming</span>}
                      {ev.dateLabel}
                    </div>

                    {/* title — brightens on hover */}
                    <span className="tl-title">{ev.title}</span>

                    {/* body — expands on hover/tap */}
                    <div className="tl-body">{ev.description}</div>

                    {/* source link */}
                    {ev.source && (
                      <a
                        className="tl-src"
                        href={ev.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        ↗ {ev.sourceLabel}
                      </a>
                    )}

                    {/* mobile hint */}
                    <span className="tl-hint" aria-hidden="true">tap to read</span>
                    <div className="tl-arrow" aria-hidden="true">↗</div>
                  </div>
                );

                return (
                  <div key={ev.id} className="tl-row" style={{ display: 'contents' }}>
                    {left ? (
                      <>
                        <div className="tl-cell tl-cell-left">{cardEl}</div>
                        <div className="tl-mid"><div className={`tl-dot${ev.isFuture ? ' tl-dot-future' : ''}`} /></div>
                        <div className="tl-spacer" />
                      </>
                    ) : (
                      <>
                        <div className="tl-spacer" />
                        <div className="tl-mid"><div className={`tl-dot${ev.isFuture ? ' tl-dot-future' : ''}`} /></div>
                        <div className="tl-cell tl-cell-right">{cardEl}</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
