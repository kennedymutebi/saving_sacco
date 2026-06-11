/**
 * AuthContext.tsx — Global Authentication State
 *
 * Provides authentication state (isAuthenticated, user)
 * and actions (login, logout) to every component in the app
 * without prop drilling.
 *
 * Usage in any component:
 *   const { isAuthenticated, user, logout } = useAuth();
 */

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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => authService.isAuthenticated()
  );

  const [user, setUserState] = useState<UserData | null>(
    () => authService.getUserData()
  );

  // Re-check auth state on mount and on cross-tab storage changes.
  // This handles cases like logging out in another browser tab.
  useEffect(() => {
    const syncAuthState = () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      setUserState(authenticated ? authService.getUserData() : null);
    };

    syncAuthState();
    window.addEventListener('storage', syncAuthState);
    return () => window.removeEventListener('storage', syncAuthState);
  }, []);

  /**
   * Call this after a successful OTP verification.
   * Reads the newly stored token and user data from localStorage.
   */
  const login = () => {
    const authenticated = authService.isAuthenticated();
    setIsAuthenticated(authenticated);
    if (authenticated) setUserState(authService.getUserData());
  };

  /**
   * Clears tokens from localStorage and resets state.
   * The user is redirected to /login by the consuming component.
   */
  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUserState(null);
  };

  /**
   * Manually update the user object in both state and localStorage.
   * Useful after profile updates.
   */
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

/**
 * useAuth — Custom hook to access auth context.
 * Must be used inside a component wrapped by <AuthProvider>.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};