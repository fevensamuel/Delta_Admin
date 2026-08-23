// src/api/officeImages.ts
import { apiClient } from './client';
import { OfficeImage } from '../types';

export async function getOfficeImagesApi(): Promise<OfficeImage[]> {
  try {
    const res = await apiClient.get('/admin/office-images');
    let data = res.data;
    if (data && data.data) {
      data = data.data;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    console.error('❌ Error fetching office images:', error);
    return [];
  }
}

export async function createOfficeImageApi(data: FormData): Promise<OfficeImage> {
  try {
    const res = await apiClient.post('/admin/office-images', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error('❌ Error creating office image:', error);
    throw new Error(error?.response?.data?.error || 'Failed to create office image');
  }
}

export async function updateOfficeImageApi(id: string, data: Partial<OfficeImage>): Promise<OfficeImage> {
  try {
    const res = await apiClient.put(`/admin/office-images/${id}`, data);
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error('❌ Error updating office image:', error);
    throw new Error(error?.response?.data?.error || 'Failed to update office image');
  }
}

export async function deleteOfficeImageApi(id: string): Promise<void> {
  try {
    await apiClient.delete(`/admin/office-images/${id}`);
  } catch (error: any) {
    console.error('❌ Error deleting office image:', error);
    throw new Error(error?.response?.data?.error || 'Failed to delete office image');
  }
}

export async function getPublicOfficeImagesApi(): Promise<OfficeImage[]> {
  try {
    const res = await apiClient.get('/office-images');
    let data = res.data;
    if (data && data.data) {
      data = data.data;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    console.error('❌ Error fetching public office images:', error);
    return [];
  }
}