import { TIMELINE_EVENTS } from '../../data/timelineEvents.js';

const djpepeEvents = TIMELINE_EVENTS.filter(e => e.category === 'djpepe');

export function TimelineSection() {
  return (
    <div className="djpepe-timeline-wrapper">
      <div className="djpepe-section-header">
        <h2 className="djpepe-section-title">A decade of firsts</h2>
        <p className="djpepe-section-sub">
          {djpepeEvents.length} verified DJPEPE milestones · October 2016–2024
        </p>
      </div>

      <div className="djpepe-tl">
        {djpepeEvents.map((event, i) => (
          <div key={i} className="djpepe-tl-item">
            <div className="djpepe-tl-date">{event.date}</div>
            <div className="djpepe-tl-body">
              <div className="djpepe-tl-title">{event.title}</div>
              <p className="djpepe-tl-desc">{event.description}</p>
              {event.source && (
                <a
                  href={event.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="djpepe-tl-source"
                >
                  Source ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
