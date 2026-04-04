import { useState, useRef } from 'react';
import './SubmitModal.css';

export default function SubmitModal({ onClose }) {
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [submitter, setSubmitter] = useState('');
  const [dateCreated, setDateCreated] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef();

  const handleSubmit = async () => {
    if (!file) return;
    setStatus('uploading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'x-filename': encodeURIComponent(file.name),
          'x-filesize': String(file.size),
          'x-title': encodeURIComponent(title),
          'x-context': encodeURIComponent(context),
          'x-submitter': encodeURIComponent(submitter || 'Anonymous'),
          'x-date-created': dateCreated,
        },
        body: file,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Submission failed');
      }

      setStatus('done');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box submit-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Submit a Meme</div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="submit-body">
          {status === 'done' ? (
            <div className="submit-success">
              <div className="submit-success-icon">✓</div>
              <div className="submit-success-text">Submission received!</div>
              <p className="submit-success-sub">It will be reviewed before appearing in the gallery.</p>
              <button className="btn btn-outline" onClick={onClose}>Close</button>
            </div>
          ) : (
            <>
              <div className="submit-field">
                <label className="submit-label">File *</label>
                <div
                  className={`submit-file-zone ${file ? 'has-file' : ''}`}
                  onClick={() => fileRef.current.click()}
                >
                  {file ? (
                    <span className="submit-file-name">{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                  ) : (
                    <span className="submit-file-prompt">Click to choose a file (max 25MB)</span>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/mp4,video/webm,audio/mpeg,audio/wav,audio/ogg"
                    style={{ display: 'none' }}
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="submit-field">
                <label className="submit-label">Title</label>
                <input
                  className="submit-input"
                  type="text"
                  placeholder="Give it a name"
                  maxLength={100}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div className="submit-field">
                <label className="submit-label">Date Created</label>
                <input
                  className="submit-input"
                  type="text"
                  placeholder="e.g. Oct 2016"
                  maxLength={50}
                  value={dateCreated}
                  onChange={e => setDateCreated(e.target.value)}
                />
              </div>

              <div className="submit-field">
                <label className="submit-label">Context / Description</label>
                <textarea
                  className="submit-textarea"
                  placeholder="Any background or context"
                  maxLength={500}
                  rows={3}
                  value={context}
                  onChange={e => setContext(e.target.value)}
                />
              </div>

              <div className="submit-field">
                <label className="submit-label">Your Name</label>
                <input
                  className="submit-input"
                  type="text"
                  placeholder="Anonymous"
                  maxLength={50}
                  value={submitter}
                  onChange={e => setSubmitter(e.target.value)}
                />
              </div>

              {errorMsg && <div className="submit-error">{errorMsg}</div>}

              <button
                className="btn btn-green submit-btn"
                onClick={handleSubmit}
                disabled={!file || status === 'uploading'}
              >
                {status === 'uploading' ? 'Submitting…' : 'Submit'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
