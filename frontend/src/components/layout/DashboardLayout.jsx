import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './DashboardLayout.css';

const titleMap = {
  '/dashboard': 'Dashboard',
  '/upload': 'Upload Content',
  '/my-content': 'My Content',
  '/approvals/pending': 'Pending Approvals',
  '/approvals/all': 'All Content',
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const pageTitle = titleMap[location.pathname] || 'CBS';

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar title={pageTitle} onMenuClick={() => setSidebarOpen(true)} />
      <main className="dashboard-main">
        <div className="page-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
