import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { session } from '../api';

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (!session.get()) return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}
