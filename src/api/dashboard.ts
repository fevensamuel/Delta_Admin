import { apiClient } from './client';
import { DashboardStats, LeadAnalytics } from '../types';

export async function getDashboardStatsApi(): Promise<DashboardStats> {
  try {
    const res = await apiClient.get('/admin/dashboard/stats');
    return res.data?.data || res.data;
  } catch (error) {
    throw new Error((error as Error)?.message || 'Failed to load dashboard stats');
  }
}

export async function getLeadStatsApi(): Promise<LeadAnalytics> {
  try {
    const res = await apiClient.get('/admin/packages/stats');
    return res.data;
  } catch (error) {
    throw new Error((error as Error)?.message || 'Failed to load lead stats');
  }
}
export const getDashboardStats = getDashboardStatsApi;