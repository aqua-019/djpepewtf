import { useEffect, useCallback } from 'react';
import { findTimelineEvents } from '../lib/timelineCorrelation.js';
import './GalleryModal.css';

const IMAGE_TYPES = new Set(['jpg','jpeg','png','gif','svg','webp','tiff','bmp','avif']);
const VIDEO_TYPES = new Set(['mp4','webm','mov','avi','ogv']);
const AUDIO_TYPES = new Set(['mp3','wav','ogg','flac','aac','m4a']);
const HEIC_TYPES  = new Set(['heic','heif']);

const X_SHARE_TEXT = encodeURIComponent('Found this in the DJPEPE archive \u{1F438} www.djpepe.wtf @scrillaventura');

function ChevronLeft() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

export default function GalleryModal({ file, onClose, onPrev, onNext }) {
  const ext = (file.type || file.name?.split('.').pop() || '').toLowerCase();
  const isImage = IMAGE_TYPES.has(ext);
  const isVideo = VIDEO_TYPES.has(ext);
  const isAudio = AUDIO_TYPES.has(ext);
  const isHeic  = HEIC_TYPES.has(ext);

  const timelineEvents = findTimelineEvents(file.name || file.pathname || '');

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && onPrev) onPrev();
    if (e.key === 'ArrowRight' && onNext) onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const xIntentUrl = `https://x.com/intent/tweet?text=${X_SHARE_TEXT}${file.url ? '&url=' + encodeURIComponent(file.url) : ''}`;

  return (
    <div
      className="gm-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="gm-shell" onClick={(e) => e.stopPropagation()}>

        {/* Close button */}
        <button className="gm-close" onClick={onClose} aria-label="Back to gallery">
          <span className="gm-close-x" aria-hidden="true">&#x2715;</span>
          <span className="gm-close-label">BACK</span>
        </button>

        {/* Nav arrows */}
        {onPrev && (
          <button className="gm-nav gm-nav--prev" onClick={onPrev} aria-label="Previous">
            <ChevronLeft />
          </button>
        )}
        {onNext && (
          <button className="gm-nav gm-nav--next" onClick={onNext} aria-label="Next">
            <ChevronRight />
          </button>
        )}

        {/* Media */}
        <div className="gm-media">
          {isImage && (
            <img src={file.url} alt="" className="gm-media-content" draggable={false} />
          )}
          {isVideo && (
            <video src={file.url} controls className="gm-media-content" />
          )}
          {isAudio && (
            <div className="gm-audio-wrap">
              <span className="gm-audio-icon">{'\u{1F3B5}'}</span>
              <audio src={file.url} controls className="gm-audio-player" />
            </div>
          )}
          {isHeic && (
            <div className="gm-heic-placeholder">
              <span className="gm-heic-icon">{'\u{1F438}'}</span>
              <p>HEIC files can't preview in browser</p>
              {file.url && (
                <a href={file.url} download className="gm-btn gm-btn-outline">Download to view</a>
              )}
            </div>
          )}
          {!isImage && !isVideo && !isAudio && !isHeic && (
            <div className="gm-heic-placeholder">
              <span className="gm-heic-icon">{'\u{1F438}'}</span>
              <p>Preview not available</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="gm-actions">
          {file.url && (
            <a href={file.url} download={file.name} className="gm-btn gm-btn-outline">
              Download
            </a>
          )}
          <a href={xIntentUrl} target="_blank" rel="noopener noreferrer" className="gm-btn gm-btn-accent">
            Post on X
          </a>
        </div>

        {/* Timeline events */}
        {timelineEvents.length > 0 && (
          <div className="gm-timeline">
            <div className="gm-timeline-label">Related DJPEPE History</div>
            {timelineEvents.map((evt, i) => (
              <div key={i} className="gm-timeline-card">
                <div className="gm-timeline-date">{evt.date}</div>
                <div className="gm-timeline-title">{evt.title}</div>
                <div className="gm-timeline-desc">{evt.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
