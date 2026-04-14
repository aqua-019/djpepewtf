import { getAssetLinks } from '../lib/assetConfig.js';
import './AssetActions.css';

function ExternalLinkIcon({ size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none"
         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
         style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M4 1h7v7M11 1L4.5 7.5"/>
    </svg>
  );
}

export default function AssetActions({ symbol, btcFloor, btcUsd, ethUsd }) {
  const links = getAssetLinks(symbol);

  const ethEquiv = (btcFloor && btcUsd && ethUsd)
    ? ((btcFloor * btcUsd) / ethUsd).toFixed(4)
    : null;

  return (
    <div className="asset-actions">
      {ethEquiv && (
        <div className="asset-actions-eth">
          {'\u039E'}{ethEquiv} ETH equivalent
        </div>
      )}
      <div className="asset-actions-btns">
        <a href={links.pepeWtf} target="_blank" rel="noreferrer"
           className="btn btn-green aa-btn">
          Buy on Pepe.WTF <ExternalLinkIcon />
        </a>
        <a href={links.emblemVault} target="_blank" rel="noreferrer"
           className="btn btn-outline aa-btn">
          Emblem Vault <ExternalLinkIcon />
        </a>
        <a href={links.xchain} target="_blank" rel="noreferrer"
           className="btn btn-outline aa-btn aa-btn-ghost">
          XChain <ExternalLinkIcon />
        </a>
      </div>
    </div>
  );
}
