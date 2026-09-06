// src/api/inquiries.ts
import { apiClient } from './client';
import { Inquiry, InquiryStatus } from '../types';

export async function getInquiriesApi(): Promise<Inquiry[]> {
  try {
    const res = await apiClient.get('/admin/inquiries');
    console.log('📥 Inquiries response:', res.data);
    return res.data?.data || res.data || [];
  } catch (error) {
    console.error('❌ Error fetching inquiries:', error);
    return [];
  }
}

export async function updateInquiryStatusApi(id: string, status: InquiryStatus, adminNotes?: string): Promise<Inquiry> {
  try {
    const res = await apiClient.put(`/admin/inquiries/${id}`, { status, adminNotes });
    return res.data?.data || res.data;
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

export async function bulkUpdateInquiriesStatusApi(ids: string[], status: InquiryStatus): Promise<any> {
  try {
    const payload = { ids, status };
    console.log('📤 Sending bulk update payload:', payload);
    const res = await apiClient.put('/admin/inquiries/bulk-status', payload);
    console.log('📥 Bulk update response:', res.data);
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error('❌ Error bulk updating inquiries:', error);
    console.error('❌ Response:', error.response?.data);
    throw new Error(error?.response?.data?.error || 'Failed to bulk update inquiry statuses');
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