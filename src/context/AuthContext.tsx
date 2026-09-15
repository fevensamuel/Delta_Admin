import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { loginApi } from '../api/auth';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: (message?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token') || localStorage.getItem('token');
    const savedUser = localStorage.getItem('admin_user') || localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
        console.log('✅ Auth restored:', parsedUser.username);
      } catch (error) {
        console.error('❌ Error restoring auth:', error);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
  try {
    console.log('📤 Attempting login for:', usernameOrEmail);
    const res = await loginApi(usernameOrEmail, password);

    // ✅ Unwrap the backend's `data` wrapper
    const payload = res.data ?? res;
    const { token: newToken, user: newUser } = payload;

    if (!newToken || !newUser) {
      throw new Error('Invalid response from server.');
    }

    if (newUser.isActive === false) {
      throw new Error('Account is disabled. Contact administrator.');
    }

    setToken(newToken);
    setUser(newUser);

    localStorage.setItem('admin_token', newToken);
    localStorage.setItem('admin_user', JSON.stringify(newUser));
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('role', newUser.role);

    console.log('✅ Login successful:', newUser.username);
    showToast('success', `Welcome back, ${newUser.username}!`);
  } catch (err: any) {
    console.error('❌ Login error:', err.message);
    showToast('error', err.message || 'Login failed. Please check your credentials.');
    throw err;
  }
};

  const logout = (message?: string) => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    showToast('info', message || 'Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};