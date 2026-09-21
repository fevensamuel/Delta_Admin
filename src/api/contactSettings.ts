import { apiClient } from './client';

export interface ContactSettings {
  id: number;
  whatsappNumber: string;
  phoneNumber: string;
  smsNumber: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * GET /admin/contact-settings
 */
export async function getContactSettingsApi(): Promise<ContactSettings> {
  try {
    const res = await apiClient.get('/admin/contact-settings');
    return res.data?.data || res.data;
  } catch (error) {
    console.error('❌ Error fetching contact settings:', error);
    throw error;
  }
}

/**
 * PUT /admin/contact-settings
 */
export async function updateContactSettingsApi(
  data: Partial<ContactSettings>
): Promise<ContactSettings> {
  try {
    const res = await apiClient.put('/admin/contact-settings', data);
    return res.data?.data || res.data;
  } catch (error) {
    console.error('❌ Error updating contact settings:', error);
    throw error;
  }
}