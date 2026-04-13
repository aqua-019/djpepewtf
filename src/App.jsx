import { useState, useEffect, useCallback } from 'react';
import './styles.css';
import Header  from './components/Header.jsx';
import Ticker  from './components/Ticker.jsx';
import Gallery from './pages/Gallery.jsx';
import DJPepe  from './pages/DJPepe.jsx';
import Market  from './pages/Market.jsx';
import Physicals from './pages/Physicals.jsx';
import { GridIcon, FrogIcon, ChartIcon, CardIcon } from './components/Icons.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const PAGES = ['gallery', 'djpepe', 'market', 'physicals'];
const PAGE_PATHS = {
  '/': 'gallery', '/gallery': 'gallery',
  '/djpepe': 'djpepe', '/market': 'market',
  '/physicals': 'physicals'
};

function getPageFromUrl() {
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  return PAGE_PATHS[path] || 'gallery';
}

export default function App() {
  const [page, setPageState] = useState(getPageFromUrl);

  const setPage = useCallback((id) => {
    if (!PAGES.includes(id)) return;
    setPageState(id);
    const path = id === 'gallery' ? '/' : `/${id}`;
    window.history.pushState(null, '', path);
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const onPop = () => setPageState(getPageFromUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Lifted state so Header and Ticker can show real data
  const [fileCount, setFileCount]         = useState(null);
  const [marketSummary, setMarketSummary] = useState({ floor: null, supply: null, status: 'loading' });

  return (
    <>
      <Header page={page} setPage={setPage} fileCount={fileCount} status={marketSummary.status} />

      <main style={{
        marginTop:  'var(--header-h)',
        height:     'calc(100vh - var(--header-h) - 32px)',
        overflowY:  'auto',
      }}>
        <ErrorBoundary>
          {page === 'gallery'   && <Gallery onFileCount={setFileCount} />}
          {page === 'djpepe'    && <DJPepe  />}
          {page === 'market'    && <Market onMarketUpdate={setMarketSummary} />}
          {page === 'physicals' && <Physicals />}
        </ErrorBoundary>
      </main>

      <Ticker floor={marketSummary.floor} supply={marketSummary.supply} fileCount={fileCount} />

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {[
          { id: 'gallery',   label: 'Gallery',    icon: <GridIcon/> },
          { id: 'djpepe',    label: 'DJPEPE',     icon: <FrogIcon/> },
          { id: 'market',    label: 'Market',     icon: <ChartIcon/> },
          { id: 'physicals', label: 'Vegas Card', icon: <CardIcon/> },
        ].map(item => (
          <button
            key={item.id}
            className={`mnav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
            aria-label={item.label}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </>
  );
}
