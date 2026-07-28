import { apiClient, StorageService } from './client';
import { User, UserRole } from '../types';

export async function getUsersApi(): Promise<User[]> {
  try {
    const res = await apiClient.get('/api/admin/users');
    return res.data;
  } catch {
    return StorageService.getUsers();
  }
}

export async function createUserApi(userData: {
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
}): Promise<User> {
  try {
    const res = await apiClient.post('/api/admin/users', userData);
    return res.data;
  } catch {
    const users = StorageService.getUsers();
    if (users.some((u) => u.username.toLowerCase() === userData.username.toLowerCase() || u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('Username or email already exists');
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: userData.username,
      email: userData.email,
      role: userData.role,
      status: userData.status,
      createdAt: new Date().toISOString().substring(0, 10)
    };

    users.push(newUser);
    StorageService.setUsers(users);
    return newUser;
  }
}

export async function updateUserRoleApi(id: string, role: UserRole, status?: 'Active' | 'Inactive'): Promise<User> {
  try {
    const res = await apiClient.put(`/api/admin/users/${id}/role`, { role, status });
    return res.data;
  } catch {
    const users = StorageService.getUsers();
    const user = users.find((u) => u.id === id);
    if (!user) throw new Error('User not found');
    user.role = role;
    if (status) user.status = status;
    StorageService.setUsers(users);
    return user;
  }
}

export async function updateUserApi(id: string, data: { username?: string; email?: string; password?: string; role?: UserRole; status?: 'Active' | 'Inactive' }): Promise<User> {
  try {
    const res = await apiClient.put(`/api/admin/users/${id}`, data);
    return res.data;
  } catch {
    const users = StorageService.getUsers();
    const user = users.find((u) => u.id === id);
    if (!user) throw new Error('User not found');
    if (data.username) user.username = data.username;
    if (data.email) user.email = data.email;
    if (data.role) user.role = data.role;
    if (data.status) user.status = data.status;
    StorageService.setUsers(users);
    return user;
  }
}

export async function deleteUserApi(id: string): Promise<void> {
  try {
    await apiClient.delete(`/api/admin/users/${id}`);
  } catch {
    const users = StorageService.getUsers();
    const filtered = users.filter((u) => u.id !== id);
    StorageService.setUsers(filtered);
  }
}
