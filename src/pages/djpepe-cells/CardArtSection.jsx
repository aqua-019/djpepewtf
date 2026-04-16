import { useState, useRef, useEffect } from 'react';

export function CardArtSection() {
  const [loaded, setLoaded] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const applyTilt = (clientX, clientY) => {
      const r = el.getBoundingClientRect();
      const rotY =  ((clientX - (r.left + r.width  / 2)) / r.width)  * 16;
      const rotX = -((clientY - (r.top  + r.height / 2)) / r.height) * 16;
      el.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.03,1.03,1.03)`;
    };

    const resetTilt = () => {
      el.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    };

    const onMouse = (e) => applyTilt(e.clientX, e.clientY);
    const onTouch = (e) => {
      const t = e.touches[0];
      applyTilt(t.clientX, t.clientY);
    };

    el.addEventListener('mousemove',  onMouse);
    el.addEventListener('touchmove',  onTouch,  { passive: true });
    el.addEventListener('mouseleave', resetTilt);
    el.addEventListener('touchend',   resetTilt);

    return () => {
      el.removeEventListener('mousemove',  onMouse);
      el.removeEventListener('touchmove',  onTouch);
      el.removeEventListener('mouseleave', resetTilt);
      el.removeEventListener('touchend',   resetTilt);
    };
  }, []);

  return (
    <div className="djpepe-card-art-wrap">
      <div className="djpepe-card-art" ref={cardRef}>
        <img
          src="/assets/DJPEPE.jpg"
          alt="DJPEPE Card Art"
          className={loaded ? 'loaded' : ''}
          onLoad={() => setLoaded(true)}
        />
        {!loaded && <div className="djpepe-card-placeholder">Loading…</div>}
        <div className="djpepe-card-badges">
          <span className="pill pill-green">DJPEPE</span>
          <span className="pill">Series 4</span>
        </div>
      </div>
      <div className="djpepe-card-hint" aria-hidden="true">
        <span className="djp-finger djp-finger-left">☞</span>
        <span className="djp-finger-label">hover to tilt</span>
        <span className="djp-finger djp-finger-right">☜</span>
      </div>
    </div>
  );
}
