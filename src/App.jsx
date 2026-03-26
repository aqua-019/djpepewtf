import { useState } from 'react';
import './styles.css';
import Header  from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import Ticker  from './components/Ticker.jsx';
import Gallery from './pages/Gallery.jsx';
import DJPepe  from './pages/DJPepe.jsx';
import Market  from './pages/Market.jsx';

const PAGE_MAP = {
  gallery: 'gallery', trending: 'gallery', favs: 'gallery', uploads: 'gallery',
  djpepe:  'djpepe',
  market:  'market',
};

export default function App() {
  const [page, setPage] = useState('gallery');
  const handleNav = (id) => setPage(PAGE_MAP[id] ?? id);

  return (
    <>
      <Header page={page} setPage={setPage} />
      <Sidebar page={page} setPage={handleNav} />

      <main style={{
        marginLeft: 'var(--sidebar-w)',
        marginTop:  'var(--header-h)',
        height:     'calc(100vh - var(--header-h) - 32px)',
        overflowY:  'auto',
      }}>
        {page === 'gallery' && <Gallery />}
        {page === 'djpepe'  && <DJPepe  />}
        {page === 'market'  && <Market  />}
      </main>

      <Ticker />

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {[
          { id: 'gallery', label: 'Gallery', icon: <GridIcon/> },
          { id: 'djpepe',  label: 'DJPEPE',  icon: <FrogIcon/> },
          { id: 'market',  label: 'Market',  icon: <ChartIcon/> },
        ].map(item => (
          <button
            key={item.id}
            className={`mnav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </>
  );
}

function GridIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
}
function FrogIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><circle cx="15" cy="10" r="1.5" fill="currentColor"/><path d="M9 15s1 2 3 2 3-2 3-2"/></svg>;
}
function ChartIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
}
