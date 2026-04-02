/**
 * useUploadQueue.js
 * Manages a queue of files with concurrency-limited uploads to /api/upload.
 * Safe for 300+ files — runs N uploads at a time, never hammers the API.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS, MAX_FILE_SIZE, MAX_CONCURRENT_UPLOADS } from '../lib/constants.js';

// Statuses: queued | uploading | done | error-size | error-type | error-net
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
        updateItem(item.id, { status: 'error-net', error: err.error, errorDetail: err.error });
        return;
      }
      const data = await res.json();
      updateItem(item.id, { status: 'done', url: data.url, ...data });
      onDone.current?.(data);
    } catch {
      updateItem(item.id, { status: 'error-net', error: 'Something went wrong.', errorDetail: 'Network error' });
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
      // Accept if MIME matches OR extension is known (browsers send empty/wrong MIME for HEIC, MOV, etc.)
      if (!ALLOWED_MIME_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.has(ext)) {
        status = 'error-type';
        errorDetail = `.${ext} not supported`;
      }
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
      i.status === 'error-net' ? { ...i, status: 'queued' } : i
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
