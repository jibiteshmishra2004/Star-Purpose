import { Navigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';

function homeForRole(role: string): string {
  if (role === 'admin') return '/admin';
  if (role === 'seller') return '/seller';
  return '/dashboard';
}

export function RequireRole({
  role,
  children,
}: {
  role: 'user' | 'seller' | 'admin';
  children: React.ReactNode;
}) {
  const { isLoggedIn, currentUser } = useApp();

  if (!isLoggedIn || !currentUser) {
    if (role === 'admin') {
      return <Navigate to="/admin-signin" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role !== role) {
    return <Navigate to={homeForRole(currentUser.role)} replace />;
  }

  return <>{children}</>;
}
