import { useState, useEffect, useRef, useCallback } from 'react';
import { TIMELINE_EVENTS } from '../data/timelineEvents.js';
import './DJPepeTimeline.css';

const CLUSTERS = {
  1: { color: 'var(--accent)', events: [10, 12] },
  2: { color: '#0F6E56', events: [25, 27, 29, 30, 31, 32, 33] },
  3: { color: '#BA7517', events: [38,39,42,44,46,48,50,51,53,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84] },
  4: { color: 'var(--accent)', events: [108] }
};

const CATEGORY_COLORS = {
  xcp: '#378ADD',
  rare: '#0F6E56',
  djpepe: '#BA7517',
};

const CATEGORY_LABELS = {
  xcp: 'Counterparty',
  rare: 'Rare Pepes',
  djpepe: 'DJPEPE',
};

function drawConvergenceLines(grid, svg) {
  if (!grid || !svg) return;
  svg.innerHTML = '';
  const gridRect = grid.getBoundingClientRect();
  svg.setAttribute('width', gridRect.width);
  svg.setAttribute('height', gridRect.height);
  svg.style.width = gridRect.width + 'px';
  svg.style.height = gridRect.height + 'px';

  Object.values(CLUSTERS).forEach(cluster => {
    const nodes = cluster.events
      .map(idx => grid.querySelector(`[data-index="${idx}"]`))
      .filter(Boolean);
    if (nodes.length < 2) return;

    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i].getBoundingClientRect();
      const b = nodes[i + 1].getBoundingClientRect();
      const x1 = a.left + a.width / 2 - gridRect.left;
      const y1 = a.top + a.height / 2 - gridRect.top;
      const x2 = b.left + b.width / 2 - gridRect.left;
      const y2 = b.top + b.height / 2 - gridRect.top;
      const cp = Math.abs(y2 - y1) * 0.4;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${x1},${y1} C${x1},${y1 + cp} ${x2},${y2 - cp} ${x2},${y2}`);
      path.setAttribute('stroke', cluster.color);
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('fill', 'none');
      path.setAttribute('opacity', '0.35');
      path.setAttribute('stroke-dasharray', '6 4');
      svg.appendChild(path);
    }
  });
}

export default function DJPepeTimeline() {
  const [activeFilter, setActiveFilter] = useState(null);
  const gridRef = useRef(null);
  const svgRef = useRef(null);

  const handleFilter = (cat) => setActiveFilter(prev => prev === cat ? null : cat);

  const redraw = useCallback(() => {
    drawConvergenceLines(gridRef.current, svgRef.current);
  }, []);

  useEffect(() => {
    const timer = setTimeout(redraw, 200);
    const onResize = () => setTimeout(redraw, 50);
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(timer); window.removeEventListener('resize', onResize); };
  }, [activeFilter, redraw]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('reveal');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '-60px' });
    const nodes = document.querySelectorAll('.djpepe-timeline .event-node');
    nodes.forEach(n => observer.observe(n));
    return () => observer.disconnect();
  }, [activeFilter]);

  return (
    <div className="djpepe-timeline">
      <div className="isolated-spine"><div className="pulsing-dot" /></div>

      <div className="filter-dock">
        {Object.keys(CATEGORY_LABELS).map(cat => (
          <button
            key={cat}
            className={`filter-button ${cat} ${activeFilter === cat ? 'active' : ''}`}
            onClick={() => handleFilter(cat)}
          >
            <span className="filter-dot" style={{ background: CATEGORY_COLORS[cat] }} />
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
        {activeFilter && (
          <button className="filter-button clear" onClick={() => setActiveFilter(null)}>
            Clear
          </button>
        )}
      </div>

      <div className="timeline-grid" ref={gridRef}>
        <svg className="convergence-svg" ref={svgRef} />
        {TIMELINE_EVENTS.map((event, index) => (
          <div
            key={index}
            data-index={index}
            data-category={event.category}
            className={`event-node ${event.category}${activeFilter && activeFilter !== event.category ? ' filtered-out' : ''}`}
          >
            <div className={`event-card ${event.category}`}>
              <div className="event-header">
                <div className="event-date">{event.date}</div>
                <div className="event-title">
                  {event.title}
                  {event.convergenceCluster && <span className="convergence-tag">{'\u{1330F}'}</span>}
                </div>
              </div>
              <div className="event-description">{event.description}</div>
              <div className="event-details">{event.details}</div>
              <div className="event-tags">
                {event.tags.map(tag => <span key={tag} className={`tag ${event.category}`}>{tag}</span>)}
              </div>
              <a className="card-source-link" href={event.source} target="_blank"
                 rel="noopener noreferrer" onClick={e => e.stopPropagation()}>Source</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
