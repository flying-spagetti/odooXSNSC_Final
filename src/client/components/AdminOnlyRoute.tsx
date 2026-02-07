import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface AdminOnlyRouteProps {
  children: ReactNode;
}

/**
 * Component that redirects PORTAL users away from admin routes
 * Should be used inside ProtectedRoute
 */
export default function AdminOnlyRoute({ children }: AdminOnlyRouteProps) {
  const { user } = useAuthStore();

  // If user is PORTAL, redirect them to portal homepage
  if (user?.role === 'PORTAL') {
    return <Navigate to="/portal" replace />;
  }

  // Admin and Internal users can access
  return <>{children}</>;
}
