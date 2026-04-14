import { useState } from 'react';
import './Physicals.css';

const CARD_FRONT = 'https://kkxcp6lss5cxehgu.public.blob.vercel-storage.com/gallery/djpepe10yearfrontfinal9-xFQMnynrPs3YwzXLdsIXZJDdLOvb1z.jpg';
const CARD_BACK  = 'https://kkxcp6lss5cxehgu.public.blob.vercel-storage.com/gallery/djpepe10yearbackfinal9-LoXpxMwKmq02JiyChRQSsVN2SiSWt4.jpg';
const X_INTENT   = 'https://x.com/intent/tweet?text=' +
  encodeURIComponent('Just met DJPEPE at @BTCMag Las Vegas 2026 \u{1F438} www.djpepe.wtf @scrillaventura');

function FlipCard({ frontUrl, backUrl }) {
  const [flipped, setFlipped] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const handleFlip = () => { setFlipped(f => !f); setHintVisible(false); };
  return (
    <>
      <div className={`flip-card ${flipped ? 'flipped' : ''}`} onClick={handleFlip}>
        <div className="flip-card-inner">
          <div className="flip-card-front">
            <img src={frontUrl} alt="DJPEPE 10th Anniversary Card — Front" />
          </div>
          <div className="flip-card-back">
            <img src={backUrl} alt="DJPEPE 10th Anniversary Card — Back" />
          </div>
        </div>
      </div>
      <p className={`flip-hint ${hintVisible ? '' : 'hidden'}`}>Tap to flip</p>
    </>
  );
}

export default function Physicals() {
  return (
    <div className="physicals-page">
      <div className="physicals-badge">
        <span className="badge-pill">10TH ANNIVERSARY · LIMITED 300</span>
      </div>
      <div className="physicals-card-wrap">
        <FlipCard frontUrl={CARD_FRONT} backUrl={CARD_BACK} />
      </div>
      <hr className="physicals-divider" />
      <div className="physicals-bio">
        <h2 className="physicals-title">DJPEPE 10TH ANNIVERSARY</h2>
        <p className="physicals-sub">Bitcoin Magazine Las Vegas Conference 2026</p>
        <p className="physicals-copy">
          Celebrating the 10th anniversary of DJPEPE — the first tokenized blockchain art
          collectible with unlockable music. This physical trading card debuts at the Bitcoin
          Magazine 2026 Las Vegas Conference. 300 cards printed. Flip the card for DJPEPE stats.
        </p>
      </div>
      <hr className="physicals-divider" />
      <div className="physicals-challenge">
        <h3 className="challenge-title">Get a Physical Card</h3>
        <p className="challenge-copy">
          Take a photo of yourself with the DJPEPE cutout and post it to X or Instagram.
          Tag <a href="https://x.com/scrillaventura" target="_blank" rel="noopener noreferrer"><strong>@scrillaventura</strong></a> on
          X or <a href="https://instagram.com/thescrillaionaire" target="_blank" rel="noopener noreferrer"><strong>@thescrillaionaire</strong></a> on
          Instagram and mention <strong>www.djpepe.wtf</strong> — you could receive a limited
          physical 10th anniversary card. 300 printed.
        </p>
        <a href={X_INTENT} target="_blank" rel="noopener noreferrer" className="challenge-cta">
          POST TO X →
        </a>
      </div>
    </div>
  );
}
