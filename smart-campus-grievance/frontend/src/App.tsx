import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import NewComplaint from './pages/NewComplaint';
import ComplaintDetail from './pages/ComplaintDetail';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import HODDashboard from './pages/HODDashboard';
import { Loader2 } from 'lucide-react';

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={40} />
          <p className="text-gray-500 font-medium">Loading Smart Campus...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={
        user ? (
          <Navigate to={
            user.role === 'STUDENT' ? '/student/dashboard' :
            user.role === 'ADMIN' ? '/admin/dashboard' :
            user.role === 'HOD' ? '/hod/dashboard' :
            '/faculty/dashboard'
          } replace />
        ) : <Navigate to="/login" replace />
      } />
      
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      
      <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/new" element={<ProtectedRoute allowedRoles={['STUDENT']}><NewComplaint /></ProtectedRoute>} />
      
      <Route path="/complaint/:id" element={<ProtectedRoute allowedRoles={['STUDENT', 'FACULTY', 'ADMIN', 'HOD']}><ComplaintDetail /></ProtectedRoute>} />
      
      <Route path="/faculty/dashboard" element={<ProtectedRoute allowedRoles={['FACULTY']}><FacultyDashboard /></ProtectedRoute>} />
      <Route path="/hod/dashboard" element={<ProtectedRoute allowedRoles={['HOD']}><HODDashboard /></ProtectedRoute>} />
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
