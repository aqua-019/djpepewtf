/**
 * useUploadQueue.js
 * Manages a queue of files with concurrency-limited uploads to /api/upload.
 * Safe for 300+ files — runs N uploads at a time, never hammers the API.
 * Auto-retries on 429 (rate limit) with exponential backoff.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { MAX_FILE_SIZE, MAX_CONCURRENT_UPLOADS, EXT_TO_MIME, RETRY_BACKOFF_MS, MAX_RETRIES } from '../lib/constants.js';

// Statuses: queued | uploading | done | error-size | error-net
export function useUploadQueue(onFileUploaded) {
  const [queue, setQueue]   = useState([]);
  const [active, setActive] = useState(false);
  const queueRef            = useRef([]);
  const runningRef          = useRef(0);
  const onDone              = useRef(onFileUploaded);
  const drainRef            = useRef(null);

  useEffect(() => { onDone.current = onFileUploaded; }, [onFileUploaded]);

  const updateItem = useCallback((id, patch) => {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
    queueRef.current = queueRef.current.map(item => item.id === id ? { ...item, ...patch } : item);
  }, []);

  const uploadOne = useCallback(async (item, attempt = 0) => {
    updateItem(item.id, { status: 'uploading' });
    try {
      const ext = item.file.name.split('.').pop().toLowerCase();
      const contentType = item.file.type || EXT_TO_MIME[ext] || 'application/octet-stream';

      const res = await fetch('/api/upload', {
        method:  'POST',
        headers: {
          'Content-Type': contentType,
          'x-filename':   encodeURIComponent(item.file.name),
          'x-filesize':   String(item.file.size),
        },
        body: item.file,
      });

      // Auto-retry on rate limit (429)
      if (res.status === 429 && attempt < MAX_RETRIES) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '0', 10) * 1000;
        const backoff = Math.max(retryAfter, RETRY_BACKOFF_MS * Math.pow(2, attempt));
        updateItem(item.id, { status: 'queued', errorDetail: `Rate limited, retrying in ${Math.round(backoff/1000)}s…` });
        await new Promise(r => setTimeout(r, backoff));
        return uploadOne(item, attempt + 1);
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed.' }));
        updateItem(item.id, { status: 'error-net', error: err.error, errorDetail: err.error });
        return;
      }
      const data = await res.json();
      updateItem(item.id, { status: 'done', url: data.url, errorDetail: null, ...data });
      onDone.current?.(data);
    } catch {
      updateItem(item.id, { status: 'error-net', error: 'Network error', errorDetail: 'Network error' });
    }
  }, [updateItem]);

  const drainQueue = useCallback(async () => {
    const next = queueRef.current.find(i => i.status === 'queued');
    if (!next || runningRef.current >= MAX_CONCURRENT_UPLOADS) return;

    runningRef.current++;
    await uploadOne(next);
    runningRef.current--;

    // Keep draining
    const remaining = queueRef.current.filter(i => i.status === 'queued');
    if (remaining.length > 0) drainRef.current?.();
    else if (runningRef.current === 0) setActive(false);
  }, [uploadOne]);

  useEffect(() => { drainRef.current = drainQueue; }, [drainQueue]);

  const enqueue = useCallback((files) => {
    const fmtSize = (b) => b >= 1048576 ? `${(b/1048576).toFixed(1)}MB` : `${(b/1024).toFixed(0)}KB`;
    const items = [...files].map(file => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const ext = file.name.split('.').pop().toLowerCase();
      let status = 'queued';
      let errorDetail = null;
      if (file.size > MAX_FILE_SIZE) {
        status = 'error-size';
        errorDetail = `${fmtSize(file.size)} exceeds ${fmtSize(MAX_FILE_SIZE)} limit`;
      }
      return { id, file, name: file.name, ext, status, errorDetail };
    });

    queueRef.current = [...queueRef.current, ...items];
    setQueue(queueRef.current.slice());
    setActive(true);

    // Kick off up to N workers
    for (let i = 0; i < MAX_CONCURRENT_UPLOADS; i++) drainRef.current?.();
  }, []);

  const clearDone = useCallback(() => {
    queueRef.current = queueRef.current.filter(i => i.status === 'queued' || i.status === 'uploading');
    setQueue(queueRef.current.slice());
  }, []);

  const retryErrors = useCallback(() => {
    queueRef.current = queueRef.current.map(i =>
      i.status === 'error-net' ? { ...i, status: 'queued', errorDetail: null } : i
    );
    setQueue(queueRef.current.slice());
    for (let i = 0; i < MAX_CONCURRENT_UPLOADS; i++) drainRef.current?.();
  }, []);

  const counts = queue.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {});

  return { queue, active, counts, enqueue, clearDone, retryErrors };
}
