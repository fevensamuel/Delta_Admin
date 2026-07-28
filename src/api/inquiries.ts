import { apiClient, StorageService } from './client';
import { Inquiry, InquiryStatus } from '../types';

export async function getInquiriesApi(): Promise<Inquiry[]> {
  try {
    const res = await apiClient.get('/api/admin/inquiries');
    return res.data;
  } catch {
    return StorageService.getInquiries();
  }
}

export async function updateInquiryStatusApi(id: string, status: InquiryStatus, adminNotes?: string): Promise<Inquiry> {
  try {
    const res = await apiClient.put(`/api/admin/inquiries/${id}/status`, { status, adminNotes });
    return res.data;
  } catch {
    const inquiries = StorageService.getInquiries();
    const inq = inquiries.find((i) => i.id === id);
    if (!inq) throw new Error('Inquiry not found');
    inq.status = status;
    if (adminNotes !== undefined) inq.adminNotes = adminNotes;
    if (!inq.readAt) inq.readAt = new Date().toISOString();
    StorageService.setInquiries(inquiries);
    return inq;
  }
}

export async function deleteInquiryApi(id: string): Promise<void> {
  const inquiries = StorageService.getInquiries();
  const filtered = inquiries.filter((i) => i.id !== id);
  StorageService.setInquiries(filtered);
}

export async function bulkUpdateInquiriesStatusApi(ids: string[], status: InquiryStatus): Promise<void> {
  const inquiries = StorageService.getInquiries();
  inquiries.forEach((inq) => {
    if (ids.includes(inq.id)) {
      inq.status = status;
      if (!inq.readAt) inq.readAt = new Date().toISOString();
    }
  });
  StorageService.setInquiries(inquiries);
}

export const bulkUpdateInquiriesApi = bulkUpdateInquiriesStatusApi;

export async function bulkDeleteInquiriesApi(ids: string[]): Promise<void> {
  const inquiries = StorageService.getInquiries();
  const filtered = inquiries.filter((i) => !ids.includes(i.id));
  StorageService.setInquiries(filtered);
}
