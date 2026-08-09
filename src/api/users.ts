import { apiClient, ensureArray } from './client';
import { User, UserRole } from '../types';

export async function getUsersApi(): Promise<User[]> {
  try {
    const res = await apiClient.get('/api/admin/users');
    const data = res.data?.data || res.data;
    return ensureArray<User>(data);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return [];
  }
}

export async function createUserApi(userData: {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
}): Promise<User> {
  try {
    console.log('📤 createUserApi called with:', {
      ...userData,
      password: userData.password ? '***' : '(missing)'
    });
    const res = await apiClient.post('/api/admin/users', userData);
    console.log('✅ User created successfully:', res.data);
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error('❌ Error creating user:', error);
    console.error('❌ Response data:', error.response?.data);
    console.error('❌ Response status:', error.response?.status);
    throw error;
  }
}

export async function updateUserRoleApi(id: string, role: UserRole, status?: 'Active' | 'Inactive'): Promise<User> {
  try {
    const res = await apiClient.put(`/api/admin/users/${id}/role`, { role, status });
    return res.data?.data || res.data;
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    throw error;
  }
}

export async function updateUserApi(id: string, data: { 
  username?: string; 
  email?: string; 
  password?: string; 
  role?: UserRole; 
  status?: 'Active' | 'Inactive' 
}): Promise<User> {
  try {
    console.log('📤 updateUserApi called with:', {
      id,
      ...data,
      password: data.password ? '***' : '(not changed)'
    });
    const res = await apiClient.put(`/api/admin/users/${id}`, data);
    return res.data?.data || res.data;
  } catch (error) {
    console.error('❌ Error updating user:', error);
    throw error;
  }
}

export async function deleteUserApi(id: string): Promise<void> {
  try {
    await apiClient.delete(`/api/admin/users/${id}`);
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    throw error;
  }
}