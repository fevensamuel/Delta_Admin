import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { loginApi } from '../api/auth';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: (message?: string) => void;
  switchRoleForDemo: (newRole: UserRole) => void;
  hasPermission: (module: string, action?: 'view' | 'create' | 'edit' | 'delete' | 'send' | 'import') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  useEffect(() => {
    // Restore auth state from localStorage on load
    const savedToken = localStorage.getItem('token') || localStorage.getItem('admin_token');
    const savedUser = localStorage.getItem('user') || localStorage.getItem('admin_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      const res = await loginApi(usernameOrEmail, password);
      
      // Check isActive status
      if (res.user && res.user.isActive === false) {
        throw new Error('Account is disabled. Contact administrator.');
      }

      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      localStorage.setItem('role', res.user.role);
      localStorage.setItem('admin_token', res.token);
      localStorage.setItem('admin_user', JSON.stringify(res.user));
      showToast('success', `Welcome back, ${res.user.username} (${res.user.role})!`);
    } catch (err: any) {
      showToast('error', err.message || 'Login failed');
      throw err;
    }
  };

  const logout = (message?: string) => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    showToast('info', message || 'Logged out successfully');
  };

  const switchRoleForDemo = (newRole: UserRole) => {
    if (!user) return;
    const updatedUser: User = { ...user, role: newRole };
    setUser(updatedUser);
    localStorage.setItem('admin_user', JSON.stringify(updatedUser));
    showToast('info', `Switched active role to ${newRole} for demonstration`);
  };

  const hasPermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'send' | 'import' = 'view'): boolean => {
    if (!user) return false;
    const role = user.role;

    // SuperAdmin has full access to everything
    if (role === 'SuperAdmin') return true;

    // User Management is SuperAdmin ONLY
    if (module === 'users') {
      return false;
    }

    // Admin role permissions
    if (role === 'Admin') {
      return true;
    }

    // Editor role permissions
    if (role === 'Editor') {
      switch (module) {
        case 'dashboard':
        case 'visa':
        case 'partners':
        case 'leads':
          return true;
        case 'packages':
        case 'gallery':
          if (action === 'delete') return false;
          return true; // view, create, edit allowed
        case 'subscribers':
          if (action === 'view') return true;
          return false; // View only, no import/delete
        case 'sms':
          return false; // Editor cannot launch or access SMS broadcast module
        case 'inquiries':
          if (action === 'delete') return false;
          return true; // view, update status allowed
        default:
          return false;
      }
    }

    return false;
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
        switchRoleForDemo,
        hasPermission
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
