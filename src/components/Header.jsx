import './Header.css';

export default function Header({ page, setPage }) {
  const tabs = ['gallery', 'djpepe', 'market'];
  const labels = { gallery: 'Meme Gallery', djpepe: 'DJPEPE', market: 'Asset Market' };

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
        <span className="live-dot" />
        <span className="header-stat">Live</span>
        <span className="header-sep">·</span>
        <span className="header-stat green">428 files</span>
      </div>
    </header>
  );
}
