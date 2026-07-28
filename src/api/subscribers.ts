import { apiClient, StorageService } from './client';
import { Subscriber } from '../types';

export async function getSubscribersApi(): Promise<Subscriber[]> {
  try {
    const res = await apiClient.get('/api/admin/subscribers');
    return res.data;
  } catch {
    return StorageService.getSubscribers();
  }
}

export async function bulkImportSubscribersApi(subscribers: Omit<Subscriber, 'id' | 'dateSubscribed'>[]): Promise<{ added: number; updated: number }> {
  try {
    const res = await apiClient.post('/api/admin/subscribers/bulk', { subscribers });
    return res.data;
  } catch {
    const current = StorageService.getSubscribers();
    let added = 0;
    let updated = 0;

    subscribers.forEach((sub) => {
      const existingIdx = current.findIndex((s) => s.phone === sub.phone);
      if (existingIdx !== -1) {
        current[existingIdx] = {
          ...current[existingIdx],
          email: sub.email || current[existingIdx].email,
          channel: sub.channel || current[existingIdx].channel,
          packageInterest: sub.packageInterest || current[existingIdx].packageInterest,
          optInStatus: sub.optInStatus || 'Active'
        };
        updated++;
      } else {
        current.unshift({
          ...sub,
          id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          dateSubscribed: new Date().toISOString().substring(0, 10),
          optInStatus: sub.optInStatus || 'Active'
        });
        added++;
      }
    });

    StorageService.setSubscribers(current);
    return { added, updated };
  }
}

export async function updateSubscriberStatusApi(id: string, optInStatus: 'Active' | 'Opt-out'): Promise<Subscriber> {
  const current = StorageService.getSubscribers();
  const sub = current.find((s) => s.id === id);
  if (!sub) throw new Error('Subscriber not found');
  sub.optInStatus = optInStatus;
  StorageService.setSubscribers(current);
  return sub;
}

export async function deleteSubscriberApi(id: string): Promise<void> {
  const current = StorageService.getSubscribers();
  const filtered = current.filter((s) => s.id !== id);
  StorageService.setSubscribers(filtered);
}

export async function bulkDeleteSubscribersApi(ids: string[]): Promise<void> {
  const current = StorageService.getSubscribers();
  const filtered = current.filter((s) => !ids.includes(s.id));
  StorageService.setSubscribers(filtered);
}

export const bulkImportSubscribers = bulkImportSubscribersApi;
