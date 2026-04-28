import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Upload, FileText, ClipboardCheck,
  FolderOpen, LogOut, Radio,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../common/ThemeToggle';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

  const teacherLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/upload', icon: Upload, label: 'Upload Content' },
    { to: '/my-content', icon: FileText, label: 'My Content' },
  ];

  const principalLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/approvals/pending', icon: ClipboardCheck, label: 'Pending Approvals' },
    { to: '/approvals/all', icon: FolderOpen, label: 'All Content' },
  ];

  const links = user?.role === 'PRINCIPAL' ? principalLinks : teacherLinks;

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Radio size={18} />
          </div>
          <div>
            <div className="sidebar-brand-text">CBS</div>
            <div className="sidebar-brand-sub">Content Broadcasting</div>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{initial}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Menu</div>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <link.icon size={18} />
              {link.label}
            </NavLink>
          ))}

          <div className="sidebar-nav-label">Public</div>
          <NavLink
            to="/broadcast/teacher/1"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Radio size={18} />
            Live Broadcast
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <ThemeToggle />
          <button className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
