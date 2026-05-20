import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../auth-store';

const ProtectedRoute = ({ children }) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  // If no access token exists, redirect to login
  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
