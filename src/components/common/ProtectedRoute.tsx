import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const session = useAuthStore(s => s.session);
  if (!session) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(session.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
