import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: ReactNode;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>; // Show spinner or loading text

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};
