import './Sidebar.css';
import { GridIcon, ChartIcon, StarIcon } from './Icons.jsx';

const NAV = [
  { id: 'gallery', label: 'Gallery',      icon: GridIcon  },
  { id: 'djpepe',  label: 'DJPEPE Asset', icon: StarIcon, divider: true },
  { id: 'market',  label: 'Market',       icon: ChartIcon },
];

export default function Sidebar({ page, setPage }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        {NAV.map(item => (
          <button
            key={item.id}
            className={`si-item ${page === item.id ? 'active' : ''} ${item.divider ? 'divider' : ''}`}
            onClick={() => setPage(item.id)}
            title={item.label}
            aria-label={item.label}
          >
            <item.icon />
            <span className="si-label">{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
