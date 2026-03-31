// ── Shared constants — single source of truth ────────────

export const ALLOWED_MIME_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/mp3', 'audio/wav',
]);

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export const MAX_CONCURRENT_UPLOADS = 4;

export const CACHE_TTL = 60_000; // 60 seconds
