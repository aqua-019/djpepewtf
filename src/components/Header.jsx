import './Header.css';
import { XIcon } from './Icons.jsx';

export default function Header({ page, setPage, fileCount, status }) {
  const tabs = ['gallery', 'djpepe', 'market', 'physicals'];
  const labels = {
    gallery: 'Meme Gallery', djpepe: 'DJPEPE',
    market: 'Asset Market', physicals: 'Vegas Card',
  };

  return (
    <header className="header">
      <div className="header-logo">
        DJPEPE<span className="logo-dot">.</span>WTF
      </div>

      <nav className="header-tabs">
        {tabs.map(t => (
          <button
            key={t}
            className={`header-tab ${page === t ? 'active' : ''}`}
            onClick={() => setPage(t)}
          >
            {labels[t]}
          </button>
        ))}
      </nav>

      <div className="header-right">
        <a href="https://x.com/DJPEPE_" target="_blank" rel="noopener noreferrer"
           className="header-x-link" aria-label="DJPEPE on X">
          <XIcon size={14} />
        </a>
        <span className="live-dot" />
        <span className="header-stat">{status === 'live' ? 'Live' : 'Offline'}</span>
        <span className="header-sep">·</span>
        <span className="header-stat green">
          {fileCount != null ? `${fileCount} files` : '—'}
        </span>
      </div>
    </header>
  );
}
