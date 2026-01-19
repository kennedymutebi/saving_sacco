// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Debug logs
  console.log('ProtectedRoute check:', {
    isAuthenticated,
    currentPath: location.pathname,
    accessToken: localStorage.getItem('access_token'),
  });

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    // Redirect to login and save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('Authenticated, rendering protected content');
  return <>{children}</>;
}