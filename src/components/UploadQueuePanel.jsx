import './UploadQueuePanel.css';

const STATUS_LABEL = {
  queued:      { txt: 'Queued',     cls: 'grey'  },
  uploading:   { txt: 'Uploading…', cls: 'green' },
  done:        { txt: 'Done',       cls: 'done'  },
  'error-size':{ txt: 'Too large',  cls: 'red'   },
  'error-type':{ txt: 'Bad format', cls: 'red'   },
  'error-net': { txt: 'Failed',     cls: 'red'   },
};

export default function UploadQueuePanel({ queue, counts, onClear, onRetry, onClose }) {
  if (queue.length === 0) return null;

  const total    = queue.length;
  const done     = counts.done       || 0;
  const errors   = (counts['error-net'] || 0) + (counts['error-size'] || 0) + (counts['error-type'] || 0);
  const uploading= counts.uploading  || 0;
  const queued   = counts.queued     || 0;
  const pct      = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone  = done + errors === total;

  return (
    <div className="uqp-panel">
      {/* Header */}
      <div className="uqp-header">
        <div className="uqp-title">
          {allDone
            ? `Done — ${done} uploaded${errors ? `, ${errors} failed` : ''}`
            : `Uploading ${done} / ${total} files`
          }
        </div>
        <div className="uqp-actions">
          {errors > 0 && (
            <button className="uqp-btn retry" onClick={onRetry}>
              ↺ Retry {errors} failed
            </button>
          )}
          {allDone && (
            <button className="uqp-btn clear" onClick={onClear}>Clear done</button>
          )}
          <button className="uqp-btn close" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="uqp-bar-wrap">
        <div className="uqp-bar" style={{ width: `${pct}%` }}/>
        {errors > 0 && <div className="uqp-bar-err" style={{ width: `${Math.round(errors/total*100)}%` }}/>}
      </div>
      <div className="uqp-bar-label">
        <span>{pct}%</span>
        {uploading > 0 && <span className="uqp-uploading">{uploading} uploading</span>}
        {queued    > 0 && <span>{queued} queued</span>}
        {errors    > 0 && <span className="uqp-err-count">{errors} failed</span>}
      </div>

      {/* File list — virtualised-ish: only show first 120 */}
      <div className="uqp-list">
        {queue.slice(0, 120).map(item => {
          const s = STATUS_LABEL[item.status] ?? { txt: item.status, cls: 'grey' };
          return (
            <div key={item.id} className={`uqp-row ${s.cls}`}>
              <span className="uqp-dot"/>
              <span className="uqp-name">{item.name}</span>
              <span className="uqp-status">{s.txt}</span>
              {item.status === 'uploading' && <div className="uqp-spinner"/>}
            </div>
          );
        })}
        {queue.length > 120 && (
          <div className="uqp-more">+ {queue.length - 120} more files…</div>
        )}
      </div>
    </div>
  );
}
