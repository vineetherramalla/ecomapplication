import { Navigate } from 'react-router-dom';
import authService from '@/features/auth/services/authService';
import { isAdminUser } from '@/features/auth/utils/access';

function RoleBasedRoute({ children, requiredRole }) {
  const user = authService.getCurrentUser();
  const role = authService.getUserRole();
  const isAdmin = isAdminUser(user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'customer' && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    if (role === 'admin') {
      return <Navigate to="/admin" replace />;
    }

    if (role === 'customer') {
      return <Navigate to="/" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
}

export default RoleBasedRoute;
