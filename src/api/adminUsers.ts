// src/api/adminUsers.ts
//
// SuperAdmin-only endpoints for managing other admin accounts and their
// page-level permissions (Role-Based Access Control).
//
// NOTE FOR BACKEND: these endpoints don't exist yet anywhere else in this
// repo (this project is the frontend only). Implement the following on the
// server, all restricted to requests from an authenticated SuperAdmin:
//
//   GET    /admin/users              -> { data: AdminUser[] }
//   POST   /admin/users              -> body: CreateAdminPayload            -> { data: AdminUser }
//   PUT    /admin/users/:id          -> body: UpdateAdminPayload            -> { data: AdminUser }
//   PUT    /admin/users/:id/permissions -> body: { permissions: string[] }  -> { data: AdminUser }
//   PUT    /admin/users/:id/status   -> body: { isActive: boolean }         -> { data: AdminUser }
//   DELETE /admin/users/:id          -> 204
//
// The server should reject (403) any attempt by a non-SuperAdmin to hit
// these routes, and should never let an Admin escalate their own role or
// permissions via them.

import { apiClient } from './client';
import { User, CreateAdminPayload, UpdateAdminPayload } from '../types';

export async function getAdminUsersApi(): Promise<User[]> {
  try {
    const res = await apiClient.get('/admin/users');
    return res.data?.data || res.data || [];
  } catch (error: any) {
    console.error('❌ Error fetching admin users:', error);
    throw new Error(error?.response?.data?.error || 'Failed to load admin users');
  }
}

export async function createAdminUserApi(payload: CreateAdminPayload): Promise<User> {
  try {
    const res = await apiClient.post('/admin/users', payload);
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error);
    throw new Error(error?.response?.data?.error || 'Failed to create admin user');
  }
}

export async function updateAdminUserApi(id: string, payload: UpdateAdminPayload): Promise<User> {
  try {
    const res = await apiClient.put(`/admin/users/${id}`, payload);
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error('❌ Error updating admin user:', error);
    throw new Error(error?.response?.data?.error || 'Failed to update admin user');
  }
}

export async function updateAdminPermissionsApi(id: string, permissions: string[]): Promise<User> {
  try {
    const res = await apiClient.put(`/admin/users/${id}/permissions`, { permissions });
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error('❌ Error updating admin permissions:', error);
    throw new Error(error?.response?.data?.error || 'Failed to update permissions');
  }
}

export async function setAdminStatusApi(id: string, isActive: boolean): Promise<User> {
  try {
    const res = await apiClient.put(`/admin/users/${id}/status`, { isActive });
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error('❌ Error updating admin status:', error);
    throw new Error(error?.response?.data?.error || 'Failed to update admin status');
  }
}

export async function deleteAdminUserApi(id: string): Promise<void> {
  try {
    await apiClient.delete(`/admin/users/${id}`);
  } catch (error: any) {
    console.error('❌ Error deleting admin user:', error);
    throw new Error(error?.response?.data?.error || 'Failed to delete admin user');
  }
}
