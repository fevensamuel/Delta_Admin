import { apiClient } from './client';
import { GalleryItem } from '../types';

// Helper to extract array from response
const extractGalleryItems = (data: any): GalleryItem[] => {
  console.log('🔍 Extracting gallery items from:', data);
  
  if (!data) {
    console.warn('⚠️ No data received from API');
    return [];
  }
  
  if (Array.isArray(data)) {
    console.log('✅ Data is already an array:', data.length);
    return data;
  }
  
  if (data && typeof data === 'object') {
    if (Array.isArray(data.data)) {
      console.log('✅ Found data.data array:', data.data.length);
      return data.data;
    }
    if (Array.isArray(data.items)) {
      console.log('✅ Found data.items array:', data.items.length);
      return data.items;
    }
    if (Array.isArray(data.results)) {
      console.log('✅ Found data.results array:', data.results.length);
      return data.results;
    }
    if (Array.isArray(data.gallery)) {
      console.log('✅ Found data.gallery array:', data.gallery.length);
      return data.gallery;
    }
    if (Array.isArray(data.rows)) {
      console.log('✅ Found data.rows array:', data.rows.length);
      return data.rows;
    }
    if (data.id) {
      console.log('✅ Single item found, wrapping in array');
      return [data];
    }
  }
  
  console.warn('⚠️ Could not extract array from response, returning empty array');
  return [];
};

// Helper to extract single item from response
const extractGalleryItem = (data: any): GalleryItem | null => {
  if (!data) return null;
  if (data.data) return data.data;
  if (data.id) return data;
  return null;
};

export async function getGalleryItems(params: Record<string, any> = {}): Promise<GalleryItem[]> {
  try {
    const res = await apiClient.get('/gallery', { params });
    console.log('📡 API Response for getGalleryItems:', res.data);
    const items = extractGalleryItems(res.data);
    console.log('✅ Gallery items loaded from API:', items.length);
    return items;
  } catch (error) {
    console.error('❌ API Error loading gallery items:', error);
    throw error;
  }
}

export async function getGalleryItem(id: string): Promise<GalleryItem> {
  try {
    const res = await apiClient.get(`/gallery/${id}`);
    const item = extractGalleryItem(res.data);
    if (!item) throw new Error('Gallery item not found');
    return item;
  } catch (error) {
    throw new Error((error as Error)?.message || 'Gallery item not found');
  }
}

// FIX: Accept both FormData and JSON payload
export async function createGalleryItem(data: FormData | Omit<GalleryItem, 'id' | 'uploadDate'>): Promise<GalleryItem> {
  try {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const res = await apiClient.post('/admin/gallery', data, config);
    const newItem = extractGalleryItem(res.data) || res.data;
    console.log('✅ Gallery item created via API:', newItem?.titleEn);
    return newItem;
  } catch (error: any) {
    console.error('❌ Error creating gallery item:', error);
    throw new Error(error?.response?.data?.error || 'Failed to create gallery item');
  }
}

// FIX: Accept both FormData and JSON payload
export async function updateGalleryItem(id: string, data: FormData | Partial<GalleryItem>): Promise<GalleryItem> {
  try {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const res = await apiClient.put(`/admin/gallery/${id}`, data, config);
    const updatedItem = extractGalleryItem(res.data) || res.data;
    console.log('✅ Gallery item updated via API:', updatedItem?.titleEn);
    return updatedItem;
  } catch (error: any) {
    console.error('❌ Error updating gallery item:', error);
    throw new Error(error?.response?.data?.error || 'Failed to update gallery item');
  }
}

export async function deleteGalleryItem(id: string): Promise<void> {
  try {
    await apiClient.delete(`/admin/gallery/${id}`);
    console.log('✅ Gallery item deleted via API:', id);
  } catch (error: any) {
    console.error('❌ Error deleting gallery item:', error);
    throw new Error(error?.response?.data?.error || 'Failed to delete gallery item');
  }
}

// FIX: Bulk upload with FormData support
export async function bulkUploadGallery(
  files: FormData | {
    titleEn: string;
    imageUrl?: string;
    videoUrl?: string;
    titleAr?: string;
    titleAm?: string;
    location?: string;
    description?: string;
    type?: 'Photo' | 'Video';
    isActive?: boolean;
    sortOrder?: number;
    duration?: string;
  }[]
): Promise<GalleryItem[]> {
  try {
    let payload: any;
    let isFormData = false;

    if (files instanceof FormData) {
      isFormData = true;
      payload = files;
    } else {
      payload = { items: files };
    }

    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    
    console.log('📤 Sending bulk upload payload:', payload);
    const res = await apiClient.post('/admin/gallery/bulk', payload, config);
    console.log('📡 Bulk upload response:', res.data);
    
    const items = extractGalleryItems(res.data);
    if (items.length > 0) {
      console.log('✅ Bulk upload successful via API:', items.length, 'items');
      return items;
    }
    
    if (res.data && res.data.success !== false) {
      console.log('✅ Bulk upload successful but no items returned, using response data');
      return res.data.data || res.data.items || [];
    }
    
    console.warn('⚠️ Bulk upload response did not contain items');
    return [];
  } catch (error: any) {
    console.error('❌ Error in bulk upload:', error);
    throw new Error(error?.response?.data?.error || 'Failed to bulk upload gallery items');
  }
}

// Named aliases for compatibility
export const getGalleryItemsApi = getGalleryItems;
export const createGalleryItemApi = createGalleryItem;
export const updateGalleryItemApi = updateGalleryItem;
export const deleteGalleryItemApi = deleteGalleryItem;
export const bulkUploadGalleryApi = bulkUploadGallery;