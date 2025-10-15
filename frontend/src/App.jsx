// 🔥 Complete App.jsx rewrite with routing
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/Toast'; // ✨ Added Toast Provider
import ErrorBoundary from './components/ErrorBoundary'; // ✨ Added Error Boundary

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home'; // ✨ Added Home Page

// Dashboard Pages
import CustomerDashboard from './pages/CustomerDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <ToastProvider> {/* ✨ Global Toast Provider */}
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} /> {/* ✨ Added Home Route */}
              <Route path="/home" element={<Home />} /> {/* ✨ Added Home Route */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Customer Routes */}
              <Route
                path="/customer/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Driver Routes */}
              <Route
                path="/driver/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['driver']}>
                    <DriverDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;