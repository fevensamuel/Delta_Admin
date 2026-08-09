import { apiClient } from './client';

export interface LoginResponse {
  status: string;
  success: boolean;
  message: string;
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    isActive: boolean;
    status: string;
  };
}

export const loginApi = async (usernameOrEmail: string, password: string): Promise<LoginResponse> => {
  try {
    // Backend expects 'username' field - send the email as username
    const response = await apiClient.post('/admin/auth/login', {
      username: usernameOrEmail,  // This can be email or username
      password: password
    });
    
    return response.data;
  } catch (error: any) {
    // Extract error message from response
    const errorMessage = error?.response?.data?.error || error?.message || 'Login failed';
    throw new Error(errorMessage);
  }
};

export const logoutApi = async (): Promise<void> => {
  try {
    await apiClient.post('/admin/auth/logout');
  } catch {
    // Silently handle logout errors
  }
};

export const getCurrentUserApi = async () => {
  try {
    const response = await apiClient.get('/admin/auth/me');
    return response.data;
  } catch {
    return null;
  }
};