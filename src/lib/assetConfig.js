/**
 * assetConfig.js
 * Single source of truth for asset links across the market page.
 * OpenSea URLs filter Emblem Vault by Name + Vault State = EMPTY.
 */

function emblemUrl(name) {
  return `https://opensea.io/collection/rare-pepe-curated?search[query]=${name}&search[stringTraits][0][name]=Name&search[stringTraits][0][values][0]=${name}&search[stringTraits][1][name]=Vault%20State&search[stringTraits][1][values][0]=EMPTY`;
}

export const ASSET_LINKS = {
  DJPEPE: {
    pepeWtf:     'https://pepe.wtf/asset/DJPEPE',
    emblemVault: emblemUrl('DJPEPE'),
    xchain:      'https://xchain.io/asset/DJPEPE',
  },
  MCPEPE: {
    pepeWtf:     'https://pepe.wtf/asset/MCPEPE',
    emblemVault: emblemUrl('MCPEPE'),
    xchain:      'https://xchain.io/asset/MCPEPE',
  },
  BBOYPEPE: {
    pepeWtf:     'https://pepe.wtf/asset/BBOYPEPE',
    emblemVault: emblemUrl('BBOYPEPE'),
    xchain:      'https://xchain.io/asset/BBOYPEPE',
  },
  PEPEONE: {
    pepeWtf:     'https://pepe.wtf/asset/PEPEONE',
    emblemVault: emblemUrl('PEPEONE'),
    xchain:      'https://xchain.io/asset/PEPEONE',
  },
  FAKEDJPEPE: {
    pepeWtf:     'https://pepe.wtf/asset/FAKEDJPEPE',
    emblemVault: emblemUrl('FAKEDJPEPE'),
    xchain:      'https://xchain.io/asset/FAKEDJPEPE',
  },
};

/**
 * Get links for an asset ticker. Falls back to generic collection URL.
 */
export function getAssetLinks(ticker) {
  return ASSET_LINKS[ticker] || {
    pepeWtf:     `https://pepe.wtf/asset/${ticker}`,
    emblemVault: 'https://opensea.io/collection/rare-pepe-curated',
    xchain:      `https://xchain.io/asset/${ticker}`,
  };
}
