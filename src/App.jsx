import { useState } from 'react';
import './styles.css';
import Header  from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import Ticker  from './components/Ticker.jsx';
import Gallery from './pages/Gallery.jsx';
import DJPepe  from './pages/DJPepe.jsx';
import Market  from './pages/Market.jsx';

// Map sidebar nav IDs → page IDs
const PAGE_MAP = {
  gallery:  'gallery',
  trending: 'gallery',   // future page, falls back to gallery for now
  favs:     'gallery',
  uploads:  'gallery',
  djpepe:   'djpepe',
  market:   'market',
};

export default function App() {
  const [page, setPage] = useState('gallery');

  const handleNav = (id) => {
    setPage(PAGE_MAP[id] ?? id);
  };

  return (
    <>
      <Header page={page} setPage={setPage} />
      <Sidebar page={page} setPage={handleNav} />

      <main
        style={{
          marginLeft: 'var(--sidebar-w)',
          marginTop:  'var(--header-h)',
          height:     'calc(100vh - var(--header-h) - 32px)',
          overflowY:  'auto',
        }}
      >
        {page === 'gallery' && <Gallery />}
        {page === 'djpepe'  && <DJPepe  />}
        {page === 'market'  && <Market  />}
      </main>

      <Ticker />
    </>
  );
}
