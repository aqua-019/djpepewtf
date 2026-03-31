export default function Ticker({ floor, supply, fileCount }) {
  const segments = [
    { text: `DJPEPE floor ${floor != null ? floor + ' BTC' : '—'}`, cls: 'tg' },
    { text: '·', cls: 'sep' },
    { text: `Supply: ${supply ?? 169}`, cls: '' },
    { text: '·', cls: 'sep' },
    { text: `${fileCount != null ? fileCount : '—'} files in archive`, cls: '' },
    { text: '·', cls: 'sep' },
    { text: 'No requests. Strong hands only.', cls: '' },
  ];

  const content = segments.map((s, i) => (
    <span key={i} className={s.cls === 'sep' ? 'ticker-sep' : s.cls}>{s.text}</span>
  ));

  return (
    <div className="ticker-bar">
      <div className="ticker-inner">
        {content}
        <span style={{ marginLeft: 60 }} />
        {content}
      </div>
    </div>
  );
}
