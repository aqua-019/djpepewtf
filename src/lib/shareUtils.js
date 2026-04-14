// lib/shareUtils.js
// Share utilities for the 10th Anniversary page.

const TWEET_TEXT = 'Just met DJPEPE at @BTCMag Las Vegas 2026 \u{1F438} www.djpepe.wtf @scrillaventura';

export function buildTweetUrl() {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(TWEET_TEXT)}`;
}

export function openTweet() {
  window.open(buildTweetUrl(), '_blank', 'noopener,noreferrer,width=600,height=400');
}

const IG_CAPTION =
  'Just met DJPEPE at @BTCMag Las Vegas 2026 \u{1F438} www.djpepe.wtf @thescrillionaire #DJPEPE #RarePepe #Bitcoin';

export async function shareToInstagram() {
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  if (isMobile && navigator.share) {
    try {
      await navigator.share({
        title: 'DJPEPE \u2014 10th Anniversary',
        text:  IG_CAPTION,
        url:   'https://djpepe.wtf',
      });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  // Desktop: copy caption to clipboard, open IG story creation
  try {
    await navigator.clipboard.writeText(IG_CAPTION);
    setTimeout(() => {
      window.open('https://www.instagram.com/stories/create/', '_blank', 'noopener,noreferrer');
    }, 500);
  } catch {
    window.prompt('Copy this caption for your Instagram story:', IG_CAPTION);
    window.open('https://www.instagram.com/stories/create/', '_blank', 'noopener,noreferrer');
  }
}
