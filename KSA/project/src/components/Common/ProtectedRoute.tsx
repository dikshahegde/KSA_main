import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role-based check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/customer" replace />; // Or some "Unauthorized" page
  }

  return <>{children}</>;
};

export default ProtectedRoute;
