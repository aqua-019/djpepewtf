import { djpepeData } from '../../constants/djpepeData.js';

export function InstitutionalCards() {
  return (
    <div className="djpepe-institutional">
      <div className="djpepe-section-header">
        <h2 className="djpepe-section-title">Institutional recognition</h2>
      </div>
      <div className="institutional-grid">
        {djpepeData.institutions.map((inst) => (
          <div key={inst.id} className="institutional-card">
            <p className="inst-type">{inst.type}</p>
            <p className="inst-name">{inst.name}</p>
            <p className="inst-description">{inst.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
