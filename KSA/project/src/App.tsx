// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider,useAuth } from "./context/AuthContext";
import Navbar from './components/Navbar';
import { PrivateRoute } from './components/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Customer
import CustomerDashboard from './pages/Customer/CustomerDashboard';
import NewComplaint from './pages/Customer/NewComplaint';
import MyComplaints from './pages/Customer/MyComplaints';

// Technician
import TechnicianDashboard from './pages/Technician/TechnicianDashboard';
import AssignedComplaints from './pages/Technician/AssignedComplaints';

// Admin
import AdminDashboard from './pages/Admin/AdminDashboard';
import AllComplaints from './pages/Admin/AllComplaints';
import ManageTechnicians from './pages/Admin/ManageTechnicians';
import CreateUser from './pages/Admin/CreateUser';

// Role-based redirect after login
const RoleRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'customer':
          navigate('/customer', { replace: true });
          break;
        case 'technician':
          navigate('/technician', { replace: true });
          break;
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    }
  }, [user, navigate]);

  return null;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<RoleRedirect />} />

          {/* Customer Routes */}
          <Route
            path="/customer"
            element={
              <PrivateRoute role="customer">
                <CustomerDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/customer/new-complaint"
            element={
              <PrivateRoute role="customer">
                <NewComplaint />
              </PrivateRoute>
            }
          />
          <Route
            path="/customer/complaints"
            element={
              <PrivateRoute role="customer">
                <MyComplaints />
              </PrivateRoute>
            }
          />

          {/* Technician Routes */}
          <Route
            path="/technician"
            element={
              <PrivateRoute role="technician">
                <TechnicianDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/technician/complaints"
            element={
              <PrivateRoute role="technician">
                <AssignedComplaints />
              </PrivateRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <PrivateRoute role="admin">
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <PrivateRoute role="admin">
                <AllComplaints />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/technicians"
            element={
              <PrivateRoute role="admin">
                <ManageTechnicians />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/create-user"
            element={
              <PrivateRoute role="admin">
                <CreateUser />
              </PrivateRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'white',
              color: '#374151',
              border: '1px solid #D1D5DB',
              borderRadius: '12px',
              boxShadow:
                '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
              padding: '16px',
            },
            success: { iconTheme: { primary: '#10B981', secondary: 'white' } },
            error: { iconTheme: { primary: '#EF4444', secondary: 'white' } },
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
