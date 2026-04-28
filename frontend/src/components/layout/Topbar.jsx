import { Menu } from 'lucide-react';
import './Topbar.css';

export default function Topbar({ title, onMenuClick, children }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <h1 className="topbar-title">{title}</h1>
      </div>
      <div className="topbar-right">{children}</div>
    </header>
  );
}
