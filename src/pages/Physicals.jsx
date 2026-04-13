import { useState } from 'react';
import './Physicals.css';

const CARD_FRONT = 'REPLACE_WITH_BLOB_URL_FRONT';
const CARD_BACK  = 'REPLACE_WITH_BLOB_URL_BACK';
const X_INTENT   = 'https://x.com/intent/tweet?text=' +
  encodeURIComponent('Just met DJPEPE at @BTCMag Las Vegas 2026 \u{1F438} www.djpepe.wtf @Scrilla_XCP');

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
          Tag <strong>@Scrilla</strong> and mention <strong>www.djpepe.wtf</strong> for the
          chance to purchase a limited physical 10th anniversary card. Supplies extremely limited.
        </p>
        <a href={X_INTENT} target="_blank" rel="noopener noreferrer" className="challenge-cta">
          POST TO X →
        </a>
      </div>
    </div>
  );
}
