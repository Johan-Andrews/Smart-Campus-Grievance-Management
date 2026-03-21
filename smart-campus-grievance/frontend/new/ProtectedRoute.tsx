// components/ProtectedRoute.tsx
// Wraps any route that requires authentication.
// Redirects to /login if not logged in.
// Redirects to the correct dashboard if the wrong role tries to access a route.

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

type Props = {
  children: React.ReactNode;
  allowedRoles?: ('STUDENT' | 'ADMIN' | 'HOD')[];
};

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { user, loading } = useAuth();

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
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role → send to their own dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const home = { STUDENT: '/student', ADMIN: '/admin', HOD: '/hod' }[user.role];
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;


// ================================================================
// App.tsx — paste this into your src/App.tsx
// ================================================================
//
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider } from './context/AuthContext';
// import ProtectedRoute from './components/ProtectedRoute';
// import LoginPage from './pages/LoginPage';
// import StudentDashboard from './pages/StudentDashboard';
// import AdminDashboard from './pages/AdminDashboard';
// import HodDashboard from './pages/HodDashboard';
// import NewGrievancePage from './pages/NewGrievancePage';
//
// export default function App() {
//   return (
//     <BrowserRouter>
//       <AuthProvider>
//         <Routes>
//
//           {/* Public */}
//           <Route path="/login" element={<LoginPage />} />
//
//           {/* Student */}
//           <Route path="/student" element={
//             <ProtectedRoute allowedRoles={['STUDENT']}>
//               <StudentDashboard />
//             </ProtectedRoute>
//           }/>
//           <Route path="/student/new" element={
//             <ProtectedRoute allowedRoles={['STUDENT']}>
//               <NewGrievancePage />
//             </ProtectedRoute>
//           }/>
//
//           {/* Admin */}
//           <Route path="/admin" element={
//             <ProtectedRoute allowedRoles={['ADMIN']}>
//               <AdminDashboard />
//             </ProtectedRoute>
//           }/>
//
//           {/* HOD */}
//           <Route path="/hod" element={
//             <ProtectedRoute allowedRoles={['HOD']}>
//               <HodDashboard />
//             </ProtectedRoute>
//           }/>
//
//           {/* Fallback */}
//           <Route path="*" element={<Navigate to="/login" replace />} />
//
//         </Routes>
//       </AuthProvider>
//     </BrowserRouter>
//   );
// }
