import { djpepeData } from '../../constants/djpepeData.js';

export function CTAButtons() {
  return (
    <div className="djpepe-cta-buttons">
      <a
        href="https://pepe.wtf/asset/DJPEPE"
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-green"
      >
        Buy on Pepe.WTF
      </a>
      {djpepeData.links.map((link) => (
        <a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
