// src/api/flightInquiries.ts
import { apiClient, ensureArray } from './client';
import { FlightInquiry } from '../types';

/**
 * GET /admin/flight-inquiries — list all flight inquiries
 */
export async function getFlightInquiriesApi(): Promise<FlightInquiry[]> {
  try {
    const res = await apiClient.get('/admin/flight-inquiries');
    console.log('📥 Flight inquiries response:', res.data);
    return ensureArray<FlightInquiry>(res.data);
  } catch (error) {
    console.error('❌ Error fetching flight inquiries:', error);
    return [];
  }
}

/**
 * POST /admin/flight-inquiries — create a new entry manually
 */
export async function createFlightInquiryApi(
  payload: Partial<FlightInquiry>
): Promise<FlightInquiry> {
  try {
    const res = await apiClient.post('/admin/flight-inquiries', payload);
    return res.data?.data || res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.error || 'Failed to create flight inquiry'
    );
  }
}

/**
 * PUT /admin/flight-inquiries/:id — update status and other fields
 */
export async function updateFlightInquiryApi(
  id: string,
  payload: Partial<FlightInquiry>
): Promise<FlightInquiry> {
  try {
    const res = await apiClient.put(`/admin/flight-inquiries/${id}`, payload);
    return res.data?.data || res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.error || 'Failed to update flight inquiry'
    );
  }
}

/**
 * DELETE /admin/flight-inquiries/:id
 */
export async function deleteFlightInquiryApi(id: string): Promise<void> {
  try {
    await apiClient.delete(`/admin/flight-inquiries/${id}`);
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.error || 'Failed to delete flight inquiry'
    );
  }
}