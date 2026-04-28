import { createBrowserRouter } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import PublicLayout from './components/layout/PublicLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import MyContentPage from './pages/MyContentPage';
import ContentDetailPage from './pages/ContentDetailPage';
import PendingApprovalsPage from './pages/PendingApprovalsPage';
import AllContentPage from './pages/AllContentPage';
import BroadcastPage from './pages/BroadcastPage';
import NotFoundPage from './pages/NotFoundPage';

export const router = createBrowserRouter([
  // Public auth routes
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // Public broadcast (no layout chrome)
  {
    element: <PublicLayout />,
    children: [
      { path: '/broadcast/teacher/:teacherId', element: <BroadcastPage /> },
    ],
  },

  // Protected dashboard routes
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/dashboard', element: <DashboardPage /> },

      // Teacher routes
      {
        path: '/upload',
        element: (
          <ProtectedRoute allowedRoles={['TEACHER']}>
            <UploadPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/my-content',
        element: (
          <ProtectedRoute allowedRoles={['TEACHER']}>
            <MyContentPage />
          </ProtectedRoute>
        ),
      },

      // Shared
      { path: '/content/:id', element: <ContentDetailPage /> },

      // Principal routes
      {
        path: '/approvals/pending',
        element: (
          <ProtectedRoute allowedRoles={['PRINCIPAL']}>
            <PendingApprovalsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/approvals/all',
        element: (
          <ProtectedRoute allowedRoles={['PRINCIPAL']}>
            <AllContentPage />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // 404
  { path: '*', element: <NotFoundPage /> },
]);
