export default function Ticker() {
  const segments = [
    { text: '▲ DJPEPE floor 14.82 ETH', cls: 'tg' },
    { text: '·', cls: 'sep' },
    { text: 'Last sale: ', cls: '' },
    { text: '14.02 ETH', cls: 'tg' },
    { text: ' · 2hr ago', cls: '' },
    { text: '·', cls: 'sep' },
    { text: 'Open offer: 12.50 ETH pending', cls: 'tr' },
    { text: '·', cls: 'sep' },
    { text: 'Total items: ', cls: '' },
    { text: '428', cls: 'tg' },
    { text: '·', cls: 'sep' },
    { text: '31 people online', cls: '' },
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
