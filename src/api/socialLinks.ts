// src/api/socialLinks.ts
import { apiClient } from './client';
import { SocialLink } from '../types';

// Get all social links (Admin)
export async function getSocialLinksApi(): Promise<SocialLink[]> {
  try {
    const res = await apiClient.get('/admin/social-links');
    return res.data?.data || [];
  } catch (error) {
    console.error('❌ Error fetching social links:', error);
    return [];
  }
}

// Create a new social link
export async function createSocialLinkApi(data: Partial<SocialLink>): Promise<SocialLink> {
  try {
    const res = await apiClient.post('/admin/social-links', data);
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error('❌ Error creating social link:', error);
    throw new Error(error?.response?.data?.error || 'Failed to create social link');
  }
}

// Update a social link
export async function updateSocialLinkApi(id: string, data: Partial<SocialLink>): Promise<SocialLink> {
  try {
    const res = await apiClient.put(`/admin/social-links/${id}`, data);
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error('❌ Error updating social link:', error);
    throw new Error(error?.response?.data?.error || 'Failed to update social link');
  }
}

// Delete a social link
export async function deleteSocialLinkApi(id: string): Promise<void> {
  try {
    await apiClient.delete(`/admin/social-links/${id}`);
  } catch (error: any) {
    console.error('❌ Error deleting social link:', error);
    throw new Error(error?.response?.data?.error || 'Failed to delete social link');
  }
}

// Get public social links (Public website)
export async function getPublicSocialLinksApi(): Promise<SocialLink[]> {
  try {
    const res = await apiClient.get('/social-links');
    return res.data?.data || [];
  } catch (error) {
    console.error('❌ Error fetching public social links:', error);
    return [];
  }
}