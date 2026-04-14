import { useState } from 'react';
import { openTweet, shareToInstagram } from '../lib/shareUtils.js';
import { XIcon } from '../components/Icons.jsx';
import './Physicals.css';

const CARD_FRONT = 'https://kkxcp6lss5cxehgu.public.blob.vercel-storage.com/gallery/djpepe10yearfrontfinal9-xFQMnynrPs3YwzXLdsIXZJDdLOvb1z.jpg';
const CARD_BACK  = 'https://kkxcp6lss5cxehgu.public.blob.vercel-storage.com/gallery/djpepe10yearbackfinal9-LoXpxMwKmq02JiyChRQSsVN2SiSWt4.jpg';

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

function IGIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
    </svg>
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
          Celebrating the 10th anniversary of DJPEPE, the first tokenized blockchain art
          collectible with unlockable music. This physical trading card debuts at the Bitcoin
          Magazine 2026 Las Vegas Conference. 300 cards printed. Flip the card for DJPEPE stats.
        </p>
      </div>
      <hr className="physicals-divider" />
      <div className="physicals-challenge">
        <h3 className="challenge-title">Get a Physical Card</h3>
        <p className="challenge-copy">
          Take a photo of yourself with the DJPEPE cutout and post it to X or
          Instagram. Tag{' '}
          <a href="https://x.com/scrillaventura" target="_blank" rel="noopener noreferrer"
             className="challenge-handle">@scrillaventura</a>{' '}
          on X, or{' '}
          <a href="https://instagram.com/thescrillionaire" target="_blank" rel="noopener noreferrer"
             className="challenge-handle">@thescrillionaire</a>{' '}
          on Instagram. Mention{' '}
          <strong>www.djpepe.wtf</strong>{' '}
          and you could receive a limited physical 10th anniversary card.
          300 printed. Supplies extremely limited.
        </p>
        <div className="anni-share-row">
          <button className="anni-btn anni-btn--x" onClick={openTweet}>
            <XIcon size={14} /> Post on X
          </button>
          <button className="anni-btn anni-btn--ig" onClick={shareToInstagram}>
            <IGIcon /> Share to Instagram
          </button>
        </div>
      </div>
    </div>
  );
}
