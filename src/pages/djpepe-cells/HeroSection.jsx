import { djpepeData } from '../../constants/djpepeData.js';

export function HeroSection() {
  return (
    <div className="djpepe-hero">
      <div className="djpepe-eyebrow">COUNTERPARTY ASSET · 2016</div>
      <h1 className="djpepe-title">{djpepeData.title}</h1>
      <p className="djpepe-subtitle">{djpepeData.subtitle}</p>
      <p className="djpepe-bio">{djpepeData.bio}</p>
    </div>
  );
}
