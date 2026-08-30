import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 120px)',
        background: '#000000',
        color: '#ffffff',
        gap: '16px'
      }}>
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent, #6366f1)' }} />
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Verifying authentication...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login while preserving the attempted location
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectPath}`} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
