import { useState, useEffect, useRef, useCallback } from 'react';
import { GALLERY_FILES, fmtNum } from '../data/index.js';
import { useUploadQueue } from '../components/useUploadQueue.js';
import UploadQueuePanel  from '../components/UploadQueuePanel.jsx';
import './Gallery.css';

// ── LOCAL STORAGE HELPERS ─────────────────────────────────
const LS_KEY = 'djpepe_gallery_stats';
function loadStats() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}
function saveStats(stats) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(stats)); } catch {}
}
function mergeStats(files, stats) {
  return files.map(f => ({
    ...f,
    upvotes:  stats[f.id]?.upvotes  ?? f.upvotes,
    views:    stats[f.id]?.views    ?? f.views,
    comments: stats[f.id]?.comments ?? f.comments,
  }));
}

// ── HELPERS ───────────────────────────────────────────────
const BG_CLASSES = ['g1','g2','g3','g4','g5','g6'];

function extFromMime(mime = '') {
  const map = {
    'image/png':'png','image/jpeg':'jpg','image/gif':'gif',
    'image/svg+xml':'svg','image/webp':'webp','video/mp4':'mp4',
    'video/webm':'webm','audio/mpeg':'mp3','audio/mp3':'mp3','audio/wav':'wav',
  };
  return map[mime] || mime.split('/').pop();
}

// ── COMPONENT ─────────────────────────────────────────────
export default function Gallery() {
  const [files, setFiles]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [sort, setSort]         = useState('new');
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [upvoted, setUpvoted]   = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('djpepe_upvoted') || '[]')); }
    catch { return new Set(); }
  });
  const [copied, setCopied]     = useState(false);
  const fileInput               = useRef();
  const stats                   = useRef(loadStats());

  // ── UPLOAD QUEUE ──────────────────────────────────────────
  const onFileUploaded = useCallback((data) => {
    const newItem = {
      id:         data.url,
      name:       data.filename,
      type:       extFromMime(data.mimeType),
      url:        data.url,
      size:       data.size,
      uploadedAt: data.uploadedAt,
      bg:         BG_CLASSES[Math.floor(Math.random() * BG_CLASSES.length)],
      icon:       '📁',
      upvotes: 0, comments: 0, views: 0,
      isNew: true,
    };
    setFiles(prev => [newItem, ...prev.map(f => ({ ...f, isNew: false }))]);
  }, []);

  const { queue, counts, enqueue, clearDone, retryErrors } = useUploadQueue(onFileUploaded);

  const handleFiles = useCallback((incoming) => {
    const list = [...incoming];
    if (!list.length) return;
    setShowQueue(true);
    enqueue(list);
  }, [enqueue]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // ── FETCH GALLERY FROM API ON MOUNT ──────────────────────
  useEffect(() => {
    async function fetchGallery() {
      try {
        const res  = await fetch('/api/gallery');
        const data = await res.json();
        const remote = (data.files || []).map((f, i) => ({ ...f, bg: BG_CLASSES[i % 6] }));
        const combined = remote.length > 0 ? remote : GALLERY_FILES;
        setFiles(mergeStats(combined, stats.current));
      } catch {
        setFiles(mergeStats(GALLERY_FILES, stats.current));
      } finally {
        setLoading(false);
      }
    }
    fetchGallery();
  }, []);

  // ── SORT ─────────────────────────────────────────────────
  const sorted = [...files].sort((a, b) => {
    if (sort === 'hot') return (b.upvotes * 3 + b.views) - (a.upvotes * 3 + a.views);
    if (sort === 'new') return new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0);
    if (sort === 'top') return b.views - a.views;
    return 0;
  });

  // ── UPVOTE ────────────────────────────────────────────────
  const toggleUpvote = (id) => {
    setUpvoted(prev => {
      const next  = new Set(prev);
      const delta = next.has(id) ? -1 : 1;
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem('djpepe_upvoted', JSON.stringify([...next])); } catch {}
      stats.current[id] = { ...stats.current[id], upvotes: (stats.current[id]?.upvotes ?? 0) + delta };
      saveStats(stats.current);
      setFiles(prev => prev.map(f => f.id === id ? { ...f, upvotes: f.upvotes + delta } : f));
      return next;
    });
  };

  // ── OPEN FILE (increment view) ────────────────────────────
  const openFile = (file) => {
    stats.current[file.id] = { ...stats.current[file.id], views: (stats.current[file.id]?.views ?? file.views) + 1 };
    saveStats(stats.current);
    setFiles(prev => prev.map(f => f.id === file.id ? { ...f, views: f.views + 1 } : f));
    setSelected({ ...file, views: file.views + 1 });
  };

  // ── COPY LINK ─────────────────────────────────────────────
  const copyLink = () => {
    navigator.clipboard.writeText(selected?.url || window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── UPLOAD ZONE COPY ──────────────────────────────────────
  const isUploading = (counts.uploading || 0) > 0 || (counts.queued || 0) > 0;
  const zoneCopy    = dragging
    ? { h: 'Drop it.', s: 'Release to add to the gallery' }
    : isUploading
    ? { h: `Uploading ${counts.done || 0} / ${queue.length} files…`, s: 'Queue panel bottom-right' }
    : { h: 'Drop files to upload', s: 'or click to browse your device' };

  return (
    <div className="gallery-page">

      {/* ── UPLOAD ZONE ──────────────────────────────────── */}
      <div
        className={['upload-zone', dragging ? 'drag-over' : '', isUploading ? 'uploading' : ''].join(' ')}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !isUploading && fileInput.current.click()}
      >
        <div className="upload-icon-wrap">
          {isUploading ? <div className="upload-spinner"/> : <UpArrow/>}
        </div>
        <div className="upload-heading">{zoneCopy.h}</div>
        <div className="upload-sub">{zoneCopy.s}</div>
        {!isUploading && (
          <div className="upload-formats">
            {['PNG','JPG','GIF','MP4','MP3','SVG','WEBM'].map(f => (
              <span key={f} className="format-pill">{f}</span>
            ))}
          </div>
        )}
        <input
          ref={fileInput} type="file" multiple
          accept="image/*,video/mp4,video/webm,audio/mpeg,audio/wav"
          style={{ display:'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* ── GALLERY BAR ──────────────────────────────────── */}
      <div className="gallery-bar">
        <div className="gallery-title">
          Viral Archive
          <span className="gallery-count">
            {loading ? 'loading…' : `${files.length} items`}
          </span>
        </div>
        <div className="sort-tabs">
          {['hot','new','top'].map(s => (
            <button key={s} className={`sort-tab ${sort===s?'active':''}`} onClick={() => setSort(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── GRID ─────────────────────────────────────────── */}
      {loading ? (
        <div className="gallery-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="cell cell-skeleton">
              <div className="skeleton-thumb"/>
              <div className="cell-meta">
                <div className="skeleton-line w80"/>
                <div className="skeleton-line w50"/>
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-heading">Nothing here yet.</div>
          <div className="empty-sub">Be the first to upload something.</div>
          <button className="btn btn-outline" onClick={() => fileInput.current.click()}>Upload a file</button>
        </div>
      ) : (
        <div className="gallery-grid">
          {sorted.map(file => (
            <div
              key={file.id}
              className={`cell ${file.isNew ? 'cell-new' : ''}`}
              onClick={() => openFile(file)}
            >
              <div className={`cell-thumb ${file.bg}`}>
                {file.url && ['jpg','jpeg','png','gif','webp','svg'].includes(file.type)
                  ? <img src={file.url} alt={file.name} loading="lazy"/>
                  : <span className="cell-icon">{file.icon}</span>
                }
                {file.isNew                   && <span className="tag tag-new cell-badge">New</span>}
                {!file.isNew && file.type==='gif' && <span className="tag tag-red  cell-badge">GIF</span>}
                {!file.isNew && file.type==='mp4' && <span className="tag tag-mp4  cell-badge">MP4</span>}
                {!file.isNew && file.type==='mp3' && <span className="tag tag-mp3  cell-badge">MP3</span>}
              </div>
              <div className="cell-meta">
                <div className="cell-name">{file.name}</div>
                <div className="cell-stats">
                  <span className="stat-up">▲ {fmtNum(file.upvotes + (upvoted.has(file.id) ? 1 : 0))}</span>
                  <span>💬 {fmtNum(file.comments)}</span>
                  <span>👁 {fmtNum(file.views)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL ────────────────────────────────────────── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{selected.name}</div>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-preview">
              {selected.url ? (
                (selected.type==='mp4'||selected.type==='webm')
                  ? <video src={selected.url} controls className="modal-media"/>
                  : (selected.type==='mp3'||selected.type==='wav')
                  ? <div className="modal-audio-wrap">
                      <span className="modal-audio-icon">🎵</span>
                      <audio src={selected.url} controls className="modal-audio"/>
                    </div>
                  : <img src={selected.url} alt={selected.name} className="modal-media"/>
              ) : (
                <div className="modal-placeholder">{selected.icon}</div>
              )}
            </div>
            <div className="modal-body">
              <div className="modal-stats">
                {[
                  { label:'Upvotes',  val: fmtNum(selected.upvotes + (upvoted.has(selected.id)?1:0)), cls:'green' },
                  { label:'Views',    val: fmtNum(selected.views),    cls:'' },
                  { label:'Comments', val: fmtNum(selected.comments), cls:'' },
                ].map(s => (
                  <div key={s.label} className="modal-stat">
                    <span className="ms-label">{s.label}</span>
                    <span className={`ms-val ${s.cls}`}>{s.val}</span>
                  </div>
                ))}
              </div>
              <div className="modal-details">
                <div className="detail-row"><span>Format</span><span>{selected.type?.toUpperCase()}</span></div>
                {selected.size && <div className="detail-row"><span>Size</span><span>{(selected.size/1024).toFixed(1)} KB</span></div>}
                {selected.uploadedAt && <div className="detail-row"><span>Added</span><span>{new Date(selected.uploadedAt).toLocaleDateString()}</span></div>}
                {selected.url && <div className="detail-row"><span>CDN URL</span><a href={selected.url} target="_blank" rel="noreferrer" className="detail-link">Open ↗</a></div>}
              </div>
              <div className="modal-actions">
                <button
                  className={`btn ${upvoted.has(selected.id) ? 'btn-green' : 'btn-outline'}`}
                  onClick={() => {
                    toggleUpvote(selected.id);
                    setSelected(prev => ({ ...prev, upvotes: prev.upvotes + (upvoted.has(prev.id)?-1:1) }));
                  }}
                >
                  {upvoted.has(selected.id) ? '▲ Upvoted' : '▲ Upvote'}
                </button>
                {selected.url && <a href={selected.url} download={selected.name} className="btn btn-outline">Download</a>}
                <button className="btn btn-outline" onClick={copyLink}>{copied ? 'Link copied.' : 'Copy link'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── UPLOAD QUEUE PANEL ───────────────────────────── */}
      {showQueue && queue.length > 0 && (
        <UploadQueuePanel
          queue={queue}
          counts={counts}
          onClear={clearDone}
          onRetry={retryErrors}
          onClose={() => setShowQueue(false)}
        />
      )}
    </div>
  );
}

function UpArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}
