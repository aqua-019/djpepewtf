import { useState } from 'react';
import './styles.css';
import Header  from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import Ticker  from './components/Ticker.jsx';
import Gallery from './pages/Gallery.jsx';
import DJPepe  from './pages/DJPepe.jsx';
import Market  from './pages/Market.jsx';
import { GridIcon, FrogIcon, ChartIcon } from './components/Icons.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

export default function App() {
  const [page, setPage] = useState('gallery');

  // Lifted state so Header and Ticker can show real data
  const [fileCount, setFileCount]         = useState(null);
  const [marketSummary, setMarketSummary] = useState({ floor: null, supply: null, status: 'loading' });

  return (
    <>
      <Header page={page} setPage={setPage} fileCount={fileCount} status={marketSummary.status} />
      <Sidebar page={page} setPage={setPage} />

      <main style={{
        marginLeft: 'var(--sidebar-w)',
        marginTop:  'var(--header-h)',
        height:     'calc(100vh - var(--header-h) - 32px)',
        overflowY:  'auto',
      }}>
        <ErrorBoundary>
          {page === 'gallery' && <Gallery onFileCount={setFileCount} />}
          {page === 'djpepe'  && <DJPepe  />}
          {page === 'market'  && <Market onMarketUpdate={setMarketSummary} />}
        </ErrorBoundary>
      </main>

      <Ticker floor={marketSummary.floor} supply={marketSummary.supply} fileCount={fileCount} />

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
