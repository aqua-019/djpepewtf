import { useState, useEffect, useRef, useCallback } from 'react';
import { useUploadQueue } from '../components/useUploadQueue.js';
import UploadQueuePanel  from '../components/UploadQueuePanel.jsx';
import SubmitModal        from '../components/SubmitModal.jsx';
import GalleryModal       from '../components/GalleryModal.jsx';
import { ImageIcon, VideoIcon, AudioIcon, GifIcon, VectorIcon, FileIcon } from '../components/Icons.jsx';
import './Gallery.css';

const ICON_MAP = { image: ImageIcon, video: VideoIcon, audio: AudioIcon, gif: GifIcon, vector: VectorIcon, file: FileIcon };

// ── HELPERS ───────────────────────────────────────────────
const BG_CLASSES = ['g1','g2','g3','g4','g5','g6'];

function extFromMime(mime = '') {
  const map = {
    'image/png':'png','image/jpeg':'jpg','image/gif':'gif',
    'image/svg+xml':'svg','image/webp':'webp','image/tiff':'tiff',
    'image/bmp':'bmp','image/avif':'avif','image/heic':'heic','image/heif':'heif',
    'video/mp4':'mp4','video/webm':'webm','video/quicktime':'mov',
    'video/x-msvideo':'avi','video/ogg':'ogv',
    'audio/mpeg':'mp3','audio/mp3':'mp3','audio/wav':'wav',
    'audio/ogg':'ogg','audio/flac':'flac','audio/aac':'aac','audio/x-m4a':'m4a',
  };
  return map[mime] || mime.split('/').pop();
}

// ── COMPONENT ─────────────────────────────────────────────
export default function Gallery({ onFileCount }) {
  const [files, setFiles]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [activeIdx, setActiveIdx] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [cellSize, setCellSize] = useState(() => {
    try { return parseInt(localStorage.getItem('gallery-cell-size')) || 180; } catch { return 180; }
  });
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const fileInput               = useRef();

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
      icon:       'file',
      isNew: true,
    };
    setFiles(prev => {
      const next = [newItem, ...prev.map(f => ({ ...f, isNew: false }))];
      onFileCount?.(next.length);
      return next;
    });
  }, [onFileCount]);

  const { queue, counts, enqueue, clearDone, retryErrors } = useUploadQueue(onFileUploaded);

  const handleFiles = useCallback((incoming) => {
    const list = [...incoming];
    if (!list.length) return;
    setShowQueue(true);
    enqueue(list);
  }, [enqueue]);

  // Recursively extract files from dropped folders
  const getFilesFromEntry = (entry) => {
    return new Promise((resolve) => {
      if (entry.isFile) {
        entry.file(f => resolve([f]), (err) => {
          console.warn('[folder-reader] skipped file:', entry.fullPath, err);
          resolve([]);
        });
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const allEntries = [];
        const readBatch = () => {
          reader.readEntries(entries => {
            if (entries.length === 0) {
              Promise.all(allEntries.map(getFilesFromEntry)).then(arrs => resolve(arrs.flat()));
            } else {
              allEntries.push(...entries);
              readBatch();
            }
          }, (err) => {
            console.warn('[folder-reader] directory read error:', entry.fullPath, err);
            resolve([]);
          });
        };
        readBatch();
      } else {
        resolve([]);
      }
    });
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setDragging(false);

    // Check for folder drops via webkitGetAsEntry
    const items = e.dataTransfer.items;
    if (items && items.length > 0 && items[0].webkitGetAsEntry) {
      const entries = [...items].map(i => i.webkitGetAsEntry()).filter(Boolean);
      const hasDir = entries.some(e => e.isDirectory);
      if (hasDir) {
        const allFiles = await Promise.all(entries.map(getFilesFromEntry));
        handleFiles(allFiles.flat());
        return;
      }
    }

    handleFiles(e.dataTransfer.files);
  };

  // ── FETCH GALLERY FROM API ─────────────────────────────────
  const fetchPage = useCallback(async (pageCursor) => {
    const url = pageCursor ? `/api/gallery?cursor=${encodeURIComponent(pageCursor)}` : '/api/gallery';
    const res  = await fetch(url);
    const data = await res.json();
    const remote = (data.files || []).map((f, i) => ({ ...f, bg: BG_CLASSES[i % 6] }));
    return { items: remote, hasMore: data.hasMore || false, cursor: data.cursor || null };
  }, []);

  useEffect(() => {
    async function fetchGallery() {
      try {
        const { items, hasMore: more, cursor: next } = await fetchPage(null);
        setFiles(items);
        setHasMore(more);
        setCursor(next);
        onFileCount?.(items.length);
      } catch {
        setFiles([]);
        onFileCount?.(0);
      } finally {
        setLoading(false);
      }
    }
    fetchGallery();
  }, [onFileCount, fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const { items, hasMore: more, cursor: next } = await fetchPage(cursor);
      setFiles(prev => {
        const existingIds = new Set(prev.map(f => f.id));
        const newItems = items.filter(f => !existingIds.has(f.id));
        const all = [...prev, ...newItems];
        onFileCount?.(all.length);
        return all;
      });
      setHasMore(more);
      setCursor(next);
    } catch { /* silently fail */ }
    finally { setLoadingMore(false); }
  }, [hasMore, loadingMore, cursor, fetchPage, onFileCount]);

  // ── FILTER + SORT ──────────────────────────────────────────
  const IMAGE_EXTS = new Set(['jpg','jpeg','png','gif','svg','webp','tiff','bmp','avif','heic','heif']);
  const VIDEO_EXTS = new Set(['mp4','webm','mov','avi','ogv']);
  const AUDIO_EXTS = new Set(['mp3','wav','ogg','flac','aac','m4a']);

  const filtered = files.filter(f => {
    if (filterType === 'image' && !IMAGE_EXTS.has(f.type)) return false;
    if (filterType === 'video' && !VIDEO_EXTS.has(f.type)) return false;
    if (filterType === 'audio' && !AUDIO_EXTS.has(f.type)) return false;
    if (filterCategory !== 'all' && f.category !== filterCategory) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    return new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0);
  });

  // ── OPEN FILE ──────────────────────────────────────────────
  const openFile = (file, idx) => {
    setSelected(file);
    setActiveIdx(idx);
  };

  // ── UPLOAD ZONE COPY ──────────────────────────────────────
  const isUploading = (counts.uploading || 0) > 0 || (counts.queued || 0) > 0;
  const zoneCopy    = dragging
    ? { h: 'Drop it.', s: 'Release to add to the gallery' }
    : isUploading
    ? { h: `Uploading ${counts.done || 0} / ${queue.length} files…`, s: 'Queue panel bottom-right' }
    : { h: 'Upload to the archive', s: 'Drop files or click — duplicates auto-detected' };

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
            <span className="format-pill">All file types accepted</span>
          </div>
        )}
        <input
          ref={fileInput} type="file" multiple
          accept="*/*"
          style={{ display:'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      <div className="submit-cta-row">
        <button className="btn btn-green" onClick={() => setShowSubmit(true)}>Submit a Meme</button>
      </div>

      {/* ── GALLERY BAR ──────────────────────────────────── */}
      <div className="gallery-bar">
        <div className="gallery-title">
          Viral Archive
          <span className="gallery-count">
            {loading ? 'loading…' : `${filtered.length} items`}
          </span>
        </div>
      </div>

      {/* ── FILTER BAR ───────────────────────────────────── */}
      <div className="filter-bar">
        <div className="filter-group">
          {[['all','All'],['image','Images'],['gif','GIFs'],['video','Video'],['audio','Audio']].map(([key, label]) => (
            <button key={key} className={`filter-pill ${filterCategory===key?'active':''}`} onClick={() => { setFilterCategory(key); setFilterType(key === 'all' ? 'all' : key); }}>
              {label}
            </button>
          ))}
        </div>
        <div className="size-slider-wrap">
          <span className="size-label">Size</span>
          <input
            type="range"
            className="size-slider"
            min="80"
            max="400"
            step="1"
            value={cellSize}
            onChange={e => {
              const v = Number(e.target.value);
              setCellSize(v);
              try { localStorage.setItem('gallery-cell-size', String(v)); } catch {}
            }}
          />
        </div>
      </div>

      {/* ── GRID ─────────────────────────────────────────── */}
      {loading ? (
        <div className="gallery-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="cell cell-skeleton">
              <div className="skeleton-thumb"/>
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
        <>
          <div className="gallery-grid" style={{ '--cell-min': cellSize + 'px' }}>
            {sorted.map((file, idx) => (
              <div
                key={file.id}
                className={`cell ${file.isNew ? 'cell-new' : ''}`}
                onClick={() => openFile(file, idx)}
              >
                <div className={`cell-thumb ${file.bg}`}>
                  {file.url && IMAGE_EXTS.has(file.type)
                    ? <>
                        <img src={file.url} alt={file.name} loading="lazy"
                             onError={(e) => { e.target.style.display='none'; e.target.nextElementSibling.style.display='flex'; }}/>
                        <span className="cell-icon" style={{ display:'none' }}>{(() => { const Icon = ICON_MAP[file.icon] || ImageIcon; return <Icon />; })()}</span>
                      </>
                    : file.url && VIDEO_EXTS.has(file.type)
                    ? <>
                        <video src={file.url} muted preload="metadata"
                               onLoadedData={(e) => { e.target.currentTime = 0.5; }}
                               onError={(e) => { e.target.style.display='none'; e.target.nextElementSibling.style.display='flex'; }}/>
                        <span className="cell-icon" style={{ display:'none' }}>{(() => { const Icon = ICON_MAP[file.icon] || VideoIcon; return <Icon />; })()}</span>
                      </>
                    : <span className="cell-icon">{(() => { const Icon = ICON_MAP[file.icon] || FileIcon; return <Icon />; })()}</span>
                  }
                  {file.isNew                        && <span className="tag tag-new cell-badge">New</span>}
                  {!file.isNew && file.type==='gif'  && <span className="tag tag-red  cell-badge">GIF</span>}
                  {!file.isNew && VIDEO_EXTS.has(file.type) && <span className="tag tag-mp4  cell-badge">{file.type.toUpperCase()}</span>}
                  {!file.isNew && AUDIO_EXTS.has(file.type) && <span className="tag tag-mp3  cell-badge">{file.type.toUpperCase()}</span>}
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="load-more-wrap">
              <button className="btn btn-outline load-more-btn" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── MODAL ────────────────────────────────────────── */}
      {selected && (
        <GalleryModal
          file={selected}
          onClose={() => { setSelected(null); setActiveIdx(null); }}
          onPrev={activeIdx > 0
            ? () => { setSelected(sorted[activeIdx - 1]); setActiveIdx(activeIdx - 1); }
            : null}
          onNext={activeIdx != null && activeIdx < sorted.length - 1
            ? () => { setSelected(sorted[activeIdx + 1]); setActiveIdx(activeIdx + 1); }
            : null}
        />
      )}

      {/* ── SUBMIT MODAL ────────────────────────────────── */}
      {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)} />}

      {/* ── UPLOAD QUEUE PANEL───────────────────────────── */}
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
