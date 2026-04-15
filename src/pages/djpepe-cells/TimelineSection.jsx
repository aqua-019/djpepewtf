import { useEffect, useRef } from 'react';
import { timelineEvents } from '../../data/timelineEvents.js';

export function TimelineSection() {
  const cardsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('in-view');
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -80px 0px' }
    );
    cardsRef.current.forEach((card) => card && observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="djpepe-timeline-wrapper">
      <div className="djpepe-section-header">
        <h2 className="djpepe-section-title">A decade of firsts</h2>
        <p className="djpepe-section-sub">
          {timelineEvents.length} verified DJPEPE milestones · October 2016–2024
        </p>
      </div>

      <div className="djpepe-tl-container">
        <div className="timeline-spine" />
        {timelineEvents.map((event, idx) => (
          <div
            key={event.id}
            className={`timeline-event-card ${idx % 2 === 0 ? 'left' : 'right'}`}
            ref={(el) => (cardsRef.current[idx] = el)}
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className="timeline-dot" />
            <div className="timeline-card-inner">
              <div className="timeline-date-label">{event.dateLabel}</div>
              <div className="timeline-card-title">{event.title}</div>
              <p className="timeline-card-desc">{event.description}</p>
              {event.source ? (
                <a
                  href={event.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="timeline-source-link"
                >
                  {event.sourceLabel} ↗
                </a>
              ) : (
                event.sourceLabel && (
                  <span className="timeline-source-link">{event.sourceLabel}</span>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
