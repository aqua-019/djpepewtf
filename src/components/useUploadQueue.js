/**
 * useUploadQueue.js
 * Manages a queue of files with concurrency-limited uploads to /api/upload.
 * Safe for 300+ files — runs N uploads at a time, never hammers the API.
 */

import { useState, useRef, useCallback } from 'react';

const CONCURRENCY  = 4;   // simultaneous uploads
const MAX_BYTES    = 50 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  'image/png','image/jpeg','image/gif','image/svg+xml','image/webp',
  'video/mp4','video/webm','audio/mpeg','audio/mp3','audio/wav',
]);

// Statuses: queued | uploading | done | error-size | error-type | error-net
export function useUploadQueue(onFileUploaded) {
  const [queue, setQueue]   = useState([]);   // { id, file, name, status, url?, error? }
  const [active, setActive] = useState(false);
  const queueRef            = useRef([]);
  const runningRef          = useRef(0);
  const onDone              = useRef(onFileUploaded);
  onDone.current            = onFileUploaded;

  const updateItem = useCallback((id, patch) => {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
    queueRef.current = queueRef.current.map(item => item.id === id ? { ...item, ...patch } : item);
  }, []);

  const uploadOne = useCallback(async (item) => {
    updateItem(item.id, { status: 'uploading' });
    try {
      const res = await fetch('/api/upload', {
        method:  'POST',
        headers: {
          'Content-Type': item.file.type,
          'x-filename':   encodeURIComponent(item.file.name),
          'x-filesize':   String(item.file.size),
        },
        body: item.file,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed.' }));
        updateItem(item.id, { status: 'error-net', error: err.error });
        return;
      }
      const data = await res.json();
      updateItem(item.id, { status: 'done', url: data.url, ...data });
      onDone.current?.(data);
    } catch {
      updateItem(item.id, { status: 'error-net', error: 'Something went wrong.' });
    }
  }, [updateItem]);

  const drainQueue = useCallback(async () => {
    const next = queueRef.current.find(i => i.status === 'queued');
    if (!next || runningRef.current >= CONCURRENCY) return;

    runningRef.current++;
    await uploadOne(next);
    runningRef.current--;

    // Keep draining
    const remaining = queueRef.current.filter(i => i.status === 'queued');
    if (remaining.length > 0) drainQueue();
    else if (runningRef.current === 0) setActive(false);
  }, [uploadOne]);

  const enqueue = useCallback((files) => {
    const items = [...files].map(file => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      let status = 'queued';
      if (!ALLOWED_MIME.has(file.type))  status = 'error-type';
      if (file.size > MAX_BYTES)         status = 'error-size';
      return { id, file, name: file.name, status };
    });

    queueRef.current = [...queueRef.current, ...items];
    setQueue(queueRef.current.slice());
    setActive(true);

    // Kick off up to CONCURRENCY workers
    for (let i = 0; i < CONCURRENCY; i++) drainQueue();
  }, [drainQueue]);

  const clearDone = useCallback(() => {
    queueRef.current = queueRef.current.filter(i => i.status === 'queued' || i.status === 'uploading');
    setQueue(queueRef.current.slice());
  }, []);

  const retryErrors = useCallback(() => {
    queueRef.current = queueRef.current.map(i =>
      i.status === 'error-net' ? { ...i, status: 'queued' } : i
    );
    setQueue(queueRef.current.slice());
    for (let i = 0; i < CONCURRENCY; i++) drainQueue();
  }, [drainQueue]);

  const counts = queue.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {});

  return { queue, active, counts, enqueue, clearDone, retryErrors };
}
