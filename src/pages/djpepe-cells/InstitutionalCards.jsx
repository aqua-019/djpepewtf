import { djpepeData } from '../../constants/djpepeData.js';

const TYPE_BADGE = {
  Museum:     { label: 'M', color: 'rgba(76,175,110,0.9)',  bg: 'rgba(76,175,110,0.12)'  },
  Exhibition: { label: 'E', color: 'rgba(138,180,248,0.9)', bg: 'rgba(138,180,248,0.12)' },
  Media:      { label: 'P', color: 'rgba(255,185,82,0.9)',  bg: 'rgba(255,185,82,0.12)'  },
};

export function InstitutionalCards() {
  return (
    <div className="djpepe-recognition">
      <div className="djpepe-section-header">
        <h2 className="djpepe-section-title">Recognition</h2>
      </div>
      <div className="recognition-strip">
        {djpepeData.institutions.map((inst) => {
          const badge = TYPE_BADGE[inst.type] || TYPE_BADGE.Media;
          return (
            <div key={inst.id} className="rec-card">
              <div
                className="rec-icon"
                style={{ color: badge.color, background: badge.bg }}
              >
                {badge.label}
              </div>
              <div className="rec-text">
                <p className="rec-type">{inst.type}</p>
                <p className="rec-name">{inst.name}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
