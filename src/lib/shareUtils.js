// lib/shareUtils.js
// Share utilities for the 10th Anniversary page.

const TWEET_TEXT = 'Just met DJPEPE at @BTCMag Las Vegas 2026 \u{1F438} www.djpepe.wtf @scrillaventura';
const ANNIVERSARY_URL = 'https://djpepe.wtf/physicals';

export function buildTweetUrl() {
  const text = encodeURIComponent(TWEET_TEXT);
  const url  = encodeURIComponent(ANNIVERSARY_URL);
  return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
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
        url:   ANNIVERSARY_URL,
      });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  try {
    await navigator.clipboard.writeText(IG_CAPTION);
    // Brief delay then open Instagram
    setTimeout(() => {
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    }, 500);
  } catch {
    window.prompt('Copy this caption for your Instagram story:', IG_CAPTION);
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
  }
}
