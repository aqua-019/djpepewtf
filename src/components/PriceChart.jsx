import { useState, useMemo } from 'react';
import './PriceChart.css';

const PAD = { top: 12, right: 12, bottom: 24, left: 52 };

export default function PriceChart({ data = [], width = 500, height = 200 }) {
  const [hover, setHover] = useState(null);

  const chart = useMemo(() => {
    if (data.length < 2) return null;

    const w = width - PAD.left - PAD.right;
    const h = height - PAD.top - PAD.bottom;

    const minT = data[0].time;
    const maxT = data[data.length - 1].time;
    const prices = data.map(d => d.price);
    const minP = Math.min(...prices) * 0.95;
    const maxP = Math.max(...prices) * 1.05;
    const rangeT = maxT - minT || 1;
    const rangeP = maxP - minP || 1;

    const points = data.map(d => ({
      x: PAD.left + ((d.time - minT) / rangeT) * w,
      y: PAD.top + h - ((d.price - minP) / rangeP) * h,
      time: d.time,
      price: d.price,
    }));

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const area = `${line} L${points[points.length - 1].x},${PAD.top + h} L${points[0].x},${PAD.top + h} Z`;

    return { points, line, area, minP, maxP, h, w };
  }, [data, width, height]);

  if (!chart) {
    return (
      <div className="chart-empty">
        {data.length === 0 ? 'No price data available' : 'Insufficient data for chart'}
      </div>
    );
  }

  const fmtDate = (ts) => new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const fmtPrice = (p) => p < 0.001 ? p.toFixed(6) : p < 1 ? p.toFixed(4) : p.toFixed(2);

  return (
    <div className="price-chart" onMouseLeave={() => setHover(null)}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => {
          const y = PAD.top + chart.h - f * chart.h;
          const val = chart.minP + f * (chart.maxP - chart.minP);
          return (
            <g key={f}>
              <line x1={PAD.left} y1={y} x2={PAD.left + chart.w} y2={y} className="chart-grid" />
              <text x={PAD.left - 6} y={y + 3} className="chart-label" textAnchor="end">{fmtPrice(val)}</text>
            </g>
          );
        })}

        {/* Area + Line */}
        <path d={chart.area} fill="url(#chartFill)" />
        <path d={chart.line} fill="none" className="chart-line" />

        {/* Hover area */}
        {chart.points.map((p, i) => (
          <rect
            key={i}
            x={p.x - (chart.w / chart.points.length) / 2}
            y={PAD.top}
            width={chart.w / chart.points.length}
            height={chart.h}
            fill="transparent"
            onMouseEnter={() => setHover(p)}
          />
        ))}

        {/* Hover indicator */}
        {hover && (
          <>
            <line x1={hover.x} y1={PAD.top} x2={hover.x} y2={PAD.top + chart.h} className="chart-crosshair" />
            <circle cx={hover.x} cy={hover.y} r={4} className="chart-dot" />
          </>
        )}
      </svg>

      {/* Tooltip */}
      {hover && (
        <div className="chart-tooltip" style={{ left: hover.x, top: hover.y - 36 }}>
          <span className="ct-price">{fmtPrice(hover.price)} BTC</span>
          <span className="ct-date">{fmtDate(hover.time)}</span>
        </div>
      )}
    </div>
  );
}
