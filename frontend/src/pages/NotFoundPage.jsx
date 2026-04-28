import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FileQuestion } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: '24px', animation: 'fadeIn 0.4s ease',
    }}>
      <div style={{
        width: 100, height: 100, borderRadius: '50%', marginBottom: 24,
        background: 'var(--accent-light)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
      }}>
        <FileQuestion size={44} />
      </div>
      <h1 style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginBottom: '8px' }}>
        404
      </h1>
      <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Page not found
      </p>
      <Link to={isAuthenticated ? '/dashboard' : '/login'}>
        <Button>Go {isAuthenticated ? 'Home' : 'to Login'}</Button>
      </Link>
    </div>
  );
}
