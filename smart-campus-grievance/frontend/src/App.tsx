import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import NewComplaint from './pages/NewComplaint';
import ComplaintDetail from './pages/ComplaintDetail';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children, allowedRoles }: { children: any, allowedRoles: string[] }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user && !allowedRoles.includes(user.role)) return <Navigate to="/login" />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={
        user ? (
          user.role === 'STUDENT' ? <Navigate to="/student/dashboard" /> :
            user.role === 'ADMIN' ? <Navigate to="/admin/dashboard" /> :
              <Navigate to="/faculty/dashboard" />
        ) : <Navigate to="/login" />
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/new" element={<ProtectedRoute allowedRoles={['STUDENT']}><NewComplaint /></ProtectedRoute>} />
      <Route path="/complaint/:id" element={<ProtectedRoute allowedRoles={['STUDENT', 'FACULTY', 'ADMIN']}><ComplaintDetail /></ProtectedRoute>} />
      <Route path="/faculty/dashboard" element={<ProtectedRoute allowedRoles={['FACULTY']}><FacultyDashboard /></ProtectedRoute>} />
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
