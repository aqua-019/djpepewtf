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
      <div className="djpepe-card-badges">
        <span className="pill pill-green">First Audio NFT</span>
        <span className="pill pill-red">No Requests</span>
      </div>
    </div>
  );
}
