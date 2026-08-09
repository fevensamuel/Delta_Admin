import { apiClient } from './client';
import { Subscriber } from '../types';

export async function getSubscribersApi(): Promise<Subscriber[]> {
  try {
    const res = await apiClient.get('/api/admin/subscribers');
    return res.data;
  } catch (error) {
    throw new Error((error as Error)?.message || 'Failed to load subscribers');
  }
}

export async function bulkImportSubscribersApi(subscribers: Omit<Subscriber, 'id' | 'dateSubscribed'>[]): Promise<{ added: number; updated: number }> {
  try {
    const res = await apiClient.post('/api/admin/subscribers/bulk', { subscribers });
    return res.data;
  } catch (error) {
    throw new Error((error as Error)?.message || 'Failed to bulk import subscribers');
  }
}

export async function updateSubscriberStatusApi(id: string, optInStatus: 'Active' | 'Opt-out'): Promise<Subscriber> {
  try {
    const res = await apiClient.put(`/api/admin/subscribers/${id}`, { optInStatus });
    return res.data;
  } catch (error) {
    throw new Error((error as Error)?.message || 'Failed to update subscriber status');
  }
}

export async function deleteSubscriberApi(id: string): Promise<void> {
  try {
    await apiClient.delete(`/api/admin/subscribers/${id}`);
  } catch (error) {
    throw new Error((error as Error)?.message || 'Failed to delete subscriber');
  }
}

export async function bulkDeleteSubscribersApi(ids: string[]): Promise<void> {
  try {
    await apiClient.delete('/api/admin/subscribers/bulk-delete', { data: { ids } });
  } catch (error) {
    throw new Error((error as Error)?.message || 'Failed to bulk delete subscribers');
  }
}

export const bulkImportSubscribers = bulkImportSubscribersApi;
