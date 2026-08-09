import { apiClient } from './client';
import { Inquiry, InquiryStatus } from '../types';

export async function getInquiriesApi(): Promise<Inquiry[]> {
  try {
    const res = await apiClient.get('/admin/inquiries');
    return res.data;
  } catch (error) {
    throw new Error((error as Error)?.message || 'Failed to load inquiries');
  }
}

export async function updateInquiryStatusApi(id: string, status: InquiryStatus, adminNotes?: string): Promise<Inquiry> {
  try {
    const res = await apiClient.put(`/admin/inquiries/${id}`, { status, adminNotes });
    return res.data;
  } catch (error) {
    throw new Error((error as Error)?.message || 'Failed to update inquiry status');
  }
}

export async function deleteInquiryApi(id: string): Promise<void> {
  try {
    await apiClient.delete(`/admin/inquiries/${id}`);
  } catch (error) {
    throw new Error((error as Error)?.message || 'Failed to delete inquiry');
  }
}

export async function bulkUpdateInquiriesStatusApi(ids: string[], status: InquiryStatus): Promise<void> {
  try {
    await apiClient.put('/admin/inquiries/bulk-status', { ids, status });
  } catch (error) {
    throw new Error((error as Error)?.message || 'Failed to bulk update inquiry statuses');
  }
}

export const bulkUpdateInquiriesApi = bulkUpdateInquiriesStatusApi;

export async function bulkDeleteInquiriesApi(ids: string[]): Promise<void> {
  try {
    await apiClient.delete('/admin/inquiries/bulk-delete', { data: { ids } });
  } catch (error) {
    throw new Error((error as Error)?.message || 'Failed to bulk delete inquiries');
  }
}