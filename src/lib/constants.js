// ── Shared constants — single source of truth ────────────

export const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp',
  'image/tiff', 'image/bmp', 'image/avif', 'image/heic', 'image/heif',
  // Video
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/ogg',
  // Audio
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac',
  'audio/aac', 'audio/x-m4a',
]);

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export const MAX_CONCURRENT_UPLOADS = 4;

export const CACHE_TTL = 60_000; // 60 seconds
