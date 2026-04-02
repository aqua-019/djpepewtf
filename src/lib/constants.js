// ── Shared constants — single source of truth ────────────

export const MAX_FILE_SIZE = 150 * 1024 * 1024; // 150 MB

export const MAX_CONCURRENT_UPLOADS = 4;

export const CACHE_TTL = 60_000; // 60 seconds

// Retry config for 429 rate-limit responses
export const RETRY_BACKOFF_MS = 2000;
export const MAX_RETRIES = 5;

// Client-side extension → MIME resolver (for when browser sends empty file.type)
export const EXT_TO_MIME = {
  heic: 'image/heic', heif: 'image/heif',
  mov: 'video/quicktime', qt: 'video/quicktime',
  mp4: 'video/mp4', webm: 'video/webm', avi: 'video/x-msvideo', ogv: 'video/ogg',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac',
  aac: 'audio/aac', m4a: 'audio/x-m4a',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  svg: 'image/svg+xml', webp: 'image/webp', tiff: 'image/tiff', bmp: 'image/bmp',
  avif: 'image/avif', pdf: 'application/pdf',
};
