import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginForm />;
}
