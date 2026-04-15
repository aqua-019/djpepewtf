export function StatsGrid({ stats }) {
  return (
    <div className="djpepe-stats-grid">
      {stats.map((stat) => (
        <div key={stat.id} className="djpepe-stat-card">
          <p className="djpepe-stat-label">{stat.label}</p>
          <p className={`djpepe-stat-value${stat.value == null ? ' stat-null' : ''}`}>
            {stat.value ?? '—'}
          </p>
          {stat.sub && <p className="djpepe-stat-sub">{stat.sub}</p>}
        </div>
      ))}
    </div>
  );
}
