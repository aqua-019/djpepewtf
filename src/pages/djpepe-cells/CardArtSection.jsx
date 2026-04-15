import { useState } from 'react';

export function CardArtSection() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="djpepe-card-art">
      <img
        src="/DJPEPE.jpg"
        alt="DJPEPE Card Art"
        className={loaded ? 'loaded' : ''}
        onLoad={() => setLoaded(true)}
      />
      {!loaded && <div className="djpepe-card-placeholder">Loading…</div>}
    </div>
  );
}
