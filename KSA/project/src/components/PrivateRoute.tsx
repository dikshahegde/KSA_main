// PrivateRoute.tsx
import { useAuth } from "../../src/context/AuthContext";
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
  role?: "customer" | "admin" | "technician";
  children: JSX.Element;
}

export const PrivateRoute = ({ role, children }: PrivateRouteProps) => {
  const { user, loading } = useAuth();

  // Wait until auth finishes loading
  if (loading) return <div>Loading...</div>; // <-- prevents redirect before user is ready

  // Not logged in
  if (!user) return <Navigate to="/" />;

  // Role check
  if (role && user.role !== role) return <Navigate to="/" />;

  // All good
  return children;
};
