import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

type Props = {
  children: React.ReactNode;
  allowedRoles?: ('STUDENT' | 'ADMIN' | 'HOD' | 'FACULTY')[];
};

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { user, loading } = useAuth();
  console.log('ProtectedRoute: Render, loading=', loading, 'user=', user?.email);

  // Still restoring session from localStorage — show spinner, don't redirect yet
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  // Not logged in → send to login
  if (!user) {
    console.log('ProtectedRoute: Redirecting to /login (user is null)');
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role → send to their own dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log('ProtectedRoute: Wrong role. User role:', user.role, 'Allowed roles:', allowedRoles);
    const home = { 
        STUDENT: '/student/dashboard', 
        ADMIN: '/admin/dashboard', 
        HOD: '/hod/dashboard', 
        FACULTY: '/faculty/dashboard' 
    }[user.role];
    console.log('ProtectedRoute: Redirecting to', home);
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
