import DJPepeTimeline from '../../components/DJPepeTimeline.jsx';

export function TimelineSection() {
  return (
    <div className="djpepe-timeline-wrapper">
      <div className="djpepe-section-header">
        <h2 className="djpepe-section-title">A decade of firsts</h2>
        <p className="djpepe-section-sub">Verified events from October 2016 to 2024</p>
      </div>
      <DJPepeTimeline />
    </div>
  );
}
