import { buildTickerItems } from '../lib/tickerItems.js';

export default function Ticker({ floor, supply, fileCount }) {
  const items = buildTickerItems({
    floor,
    supply,
    memeCount: fileCount,
  });

  const content = items.map((text, i) => (
    <span key={i}>
      <span className={floor && text.includes('FLOOR') ? 'tg' : ''}>{text}</span>
      <span className="ticker-sep">{'\u00b7'}</span>
    </span>
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
