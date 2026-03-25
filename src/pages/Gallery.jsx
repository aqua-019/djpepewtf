import { useState, useRef, useCallback } from 'react';
import { GALLERY_FILES, fmtNum } from '../data/index.js';
import './Gallery.css';

const TYPE_TAG = {
  gif: 'tag-red',
  mp4: 'tag-mp4',
  mp3: 'tag-mp3',
  png: '',
  jpg: '',
  svg: '',
};

const BG_CLASSES = ['g1','g2','g3','g4','g5','g6'];

export default function Gallery() {
  const [files, setFiles]           = useState(GALLERY_FILES);
  const [sort, setSort]             = useState('hot');
  const [selected, setSelected]     = useState(null);
  const [dragging, setDragging]     = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [uploadMsg, setUploadMsg]   = useState(null);
  const [copied, setCopied]         = useState(false);
  const [upvoted, setUpvoted]       = useState(new Set());
  const fileInput                   = useRef();

  /* ── SORT ───────────────────────────────────────────────── */
  const sorted = [...files].sort((a, b) => {
    if (sort === 'hot')  return b.upvotes - a.upvotes;
    if (sort === 'new')  return b.id - a.id;
    if (sort === 'top')  return b.views - a.views;
    return 0;
  });

  /* ── UPLOAD ─────────────────────────────────────────────── */
  const handleFiles = useCallback((incoming) => {
    const allowed = ['image/png','image/jpeg','image/gif','image/svg+xml',
                     'video/mp4','audio/mpeg','video/webm'];
    const tooBig  = [...incoming].filter(f => f.size > 50 * 1024 * 1024);
    const badType = [...incoming].filter(f => !allowed.includes(f.type));

    if (tooBig.length)  { setUploadMsg('error-size');   return; }
    if (badType.length) { setUploadMsg('error-type');   return; }

    setUploading(true);
    setUploadMsg(null);

    setTimeout(() => {
      const newItems = [...incoming].map((f, i) => {
        const ext = f.name.split('.').pop().toLowerCase();
        return {
          id:       Date.now() + i,
          name:     f.name,
          type:     ext,
          bg:       BG_CLASSES[Math.floor(Math.random() * BG_CLASSES.length)],
          icon:     '📁',
          upvotes:  0,
          comments: 0,
          views:    0,
          isNew:    true,
          url:      URL.createObjectURL(f),
          size:     f.size,
          added:    new Date().toLocaleDateString(),
        };
      });
      setFiles(prev => [...newItems, ...prev]);
      setUploading(false);
      setUploadMsg('success');
      setTimeout(() => setUploadMsg(null), 2500);
    }, 1200);
  }, []);

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  /* ── UPVOTE ──────────────────────────────────────────────── */
  const toggleUpvote = (id) => {
    setUpvoted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* ── COPY LINK ───────────────────────────────────────────── */
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /* ── UPLOAD ZONE TEXT ────────────────────────────────────── */
  const uploadZoneText = () => {
    if (uploading)              return { h: 'Uploading…', s: 'Adding to the archive' };
    if (uploadMsg === 'success') return { h: 'Uploaded.',  s: 'Now live in the gallery' };
    if (uploadMsg === 'error-size') return { h: 'That file\'s too big.', s: 'Max size is 50MB.' };
    if (uploadMsg === 'error-type') return { h: 'That format isn\'t supported yet.', s: '' };
    if (dragging)               return { h: 'Drop it.',   s: 'Release to add to the gallery' };
    return { h: 'Drop files to upload', s: 'or click to browse your device' };
  };

  const { h, s } = uploadZoneText();

  return (
    <div className="gallery-page">

      {/* ── UPLOAD ZONE ─────────────────────────────────── */}
      <div
        className={`upload-zone ${dragging ? 'drag-over' : ''} ${uploading ? 'uploading' : ''} ${uploadMsg === 'success' ? 'success' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileInput.current.click()}
      >
        <div className="upload-icon-wrap">
          {uploading
            ? <div className="upload-spinner" />
            : <UpArrow />
          }
        </div>
        <div className="upload-heading">{h}</div>
        {s && <div className="upload-sub">{s}</div>}
        {!uploading && !uploadMsg && (
          <div className="upload-formats">
            {['PNG','JPG','GIF','MP4','MP3','SVG','WEBM'].map(f => (
              <span key={f} className="format-pill">{f}</span>
            ))}
          </div>
        )}
        <input
          ref={fileInput}
          type="file"
          multiple
          accept="image/*,video/mp4,audio/mpeg,video/webm"
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* ── GALLERY BAR ─────────────────────────────────── */}
      <div className="gallery-bar">
        <div className="gallery-title">
          Viral Archive
          <span className="gallery-count">{files.length} items</span>
        </div>
        <div className="sort-tabs">
          {['hot','new','top'].map(s => (
            <button
              key={s}
              className={`sort-tab ${sort === s ? 'active' : ''}`}
              onClick={() => setSort(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── GRID ────────────────────────────────────────── */}
      {sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-heading">Nothing here yet.</div>
          <div className="empty-sub">Be the first to upload something.</div>
          <button className="btn btn-outline" onClick={() => fileInput.current.click()}>
            Upload a file
          </button>
        </div>
      ) : (
        <div className="gallery-grid">
          {sorted.map(file => (
            <div
              key={file.id}
              className={`cell ${file.isNew ? 'cell-new' : ''}`}
              onClick={() => setSelected(file)}
            >
              <div className={`cell-thumb ${file.bg}`}>
                {file.url
                  ? <img src={file.url} alt={file.name} />
                  : <span className="cell-icon">{file.icon}</span>
                }
                {(file.isNew) && <span className="tag tag-new cell-badge">New</span>}
                {file.type === 'gif' && <span className="tag tag-red cell-badge">GIF</span>}
                {file.type === 'mp4' && <span className="tag tag-mp4 cell-badge">MP4</span>}
                {file.type === 'mp3' && <span className="tag tag-mp3 cell-badge">MP3</span>}
              </div>
              <div className="cell-meta">
                <div className="cell-name">{file.name}</div>
                <div className="cell-stats">
                  <span className="stat-up">▲ {fmtNum(file.upvotes)}</span>
                  <span>💬 {fmtNum(file.comments)}</span>
                  <span>👁 {fmtNum(file.views)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL ───────────────────────────────────────── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{selected.name}</div>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="modal-preview">
              {selected.url
                ? selected.type === 'mp4'
                  ? <video src={selected.url} controls className="modal-media" />
                  : selected.type === 'mp3'
                  ? <audio src={selected.url} controls className="modal-audio" />
                  : <img src={selected.url} alt={selected.name} className="modal-media" />
                : <div className="modal-placeholder">{selected.icon}</div>
              }
            </div>

            <div className="modal-body">
              <div className="modal-stats">
                <div className="modal-stat">
                  <span className="ms-label">Upvotes</span>
                  <span className="ms-val green">{fmtNum(selected.upvotes + (upvoted.has(selected.id) ? 1 : 0))}</span>
                </div>
                <div className="modal-stat">
                  <span className="ms-label">Views</span>
                  <span className="ms-val">{fmtNum(selected.views)}</span>
                </div>
                <div className="modal-stat">
                  <span className="ms-label">Comments</span>
                  <span className="ms-val">{fmtNum(selected.comments)}</span>
                </div>
              </div>

              <div className="modal-details">
                <div className="detail-row"><span>Format</span><span>{selected.type.toUpperCase()}</span></div>
                {selected.size && <div className="detail-row"><span>Size</span><span>{(selected.size / 1024).toFixed(1)} KB</span></div>}
                {selected.added && <div className="detail-row"><span>Added</span><span>{selected.added}</span></div>}
              </div>

              <div className="modal-actions">
                <button
                  className={`btn ${upvoted.has(selected.id) ? 'btn-green' : 'btn-outline'}`}
                  onClick={() => toggleUpvote(selected.id)}
                >
                  {upvoted.has(selected.id) ? '▲ Upvoted' : '▲ Upvote'}
                </button>
                {selected.url && (
                  <a href={selected.url} download={selected.name} className="btn btn-outline">
                    Download
                  </a>
                )}
                <button className="btn btn-outline" onClick={copyLink}>
                  {copied ? 'Link copied.' : 'Copy link'}
                </button>
              </div>
            </div>
          </div>
        </div>
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
