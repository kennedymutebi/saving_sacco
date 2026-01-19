// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import type { UserData } from '../types/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserData | null;
  login: () => void;
  logout: () => void;
  setUser: (user: UserData | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return authService.isAuthenticated();
  });
  
  const [user, setUserState] = useState<UserData | null>(() => {
    return authService.getUserData();
  });

  // Sync authentication state with localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      const userData = authService.getUserData();
      
      console.log('AuthContext useEffect - checking auth:', {
        authenticated,
        hasUserData: !!userData,
        currentIsAuthenticated: isAuthenticated,
      });
      
      setIsAuthenticated(authenticated);
      
      if (authenticated && userData) {
        setUserState(userData);
      } else if (!authenticated) {
        setUserState(null);
      }
    };

    // Check auth on mount and whenever storage changes
    checkAuth();

    // Listen for storage events (for cross-tab synchronization)
    window.addEventListener('storage', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  const login = () => {
    const authenticated = authService.isAuthenticated();
    const userData = authService.getUserData();
    
    console.log('AuthContext login called:', {
      authenticated,
      hasUserData: !!userData,
      accessToken: localStorage.getItem('access_token'),
    });
    
    setIsAuthenticated(authenticated);
    
    if (authenticated && userData) {
      setUserState(userData);
    }
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUserState(null);
  };

  const setUser = (userData: UserData | null) => {
    setUserState(userData);
    if (userData) {
      localStorage.setItem('user_data', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user_data');
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};