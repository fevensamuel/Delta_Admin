import { apiClient, StorageService } from './client';
import { GalleryItem } from '../types';

export async function getGalleryItems(params: Record<string, any> = {}): Promise<GalleryItem[]> {
  try {
    const res = await apiClient.get('/api/gallery', { params });
    return res.data?.data || res.data;
  } catch {
    let items = StorageService.getGallery();
    if (params.type && params.type !== 'all' && params.type !== 'All') {
      const typeLower = params.type.toLowerCase();
      items = items.filter((g) => g.type.toLowerCase() === typeLower);
    }
    return items;
  }
}

export async function getGalleryItem(id: string): Promise<GalleryItem> {
  try {
    const res = await apiClient.get(`/api/gallery/${id}`);
    return res.data?.data || res.data;
  } catch {
    const items = StorageService.getGallery();
    const found = items.find((g) => g.id === id);
    if (!found) throw new Error('Gallery item not found');
    return found;
  }
}

export async function createGalleryItem(data: FormData | Omit<GalleryItem, 'id' | 'uploadDate'>): Promise<GalleryItem> {
  try {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const res = await apiClient.post('/api/admin/gallery', data, config);
    return res.data?.data || res.data;
  } catch {
    const items = StorageService.getGallery();
    let newItem: GalleryItem;

    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      const titleEn = (data.get('titleEn') as string) || 'New Item';
      const titleAr = (data.get('titleAr') as string) || undefined;
      const typeStr = (data.get('type') as string) || 'Photo';
      const type = (typeStr.toLowerCase() === 'video' ? 'Video' : 'Photo') as 'Photo' | 'Video';
      const location = (data.get('location') as string) || undefined;
      const description = (data.get('description') as string) || undefined;
      const isActive = data.get('isActive') !== 'false';
      const sortOrder = Number(data.get('sortOrder')) || 1;
      const duration = (data.get('duration') as string) || undefined;

      newItem = {
        id: `gal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type,
        titleEn,
        titleAr,
        imageUrl: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&q=80&w=800',
        duration,
        location,
        description,
        isActive,
        sortOrder,
        uploadDate: new Date().toISOString().substring(0, 10),
      };
    } else {
      newItem = {
        ...(data as Omit<GalleryItem, 'id' | 'uploadDate'>),
        id: `gal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        uploadDate: new Date().toISOString().substring(0, 10),
      };
    }

    items.unshift(newItem);
    StorageService.setGallery(items);
    return newItem;
  }
}

export async function updateGalleryItem(id: string, data: FormData | Partial<GalleryItem>): Promise<GalleryItem> {
  try {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const res = await apiClient.put(`/api/admin/gallery/${id}`, data, config);
    return res.data?.data || res.data;
  } catch {
    const items = StorageService.getGallery();
    const idx = items.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error('Gallery item not found');

    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      const titleEn = data.get('titleEn') as string;
      if (titleEn) items[idx].titleEn = titleEn;
      const titleAr = data.get('titleAr') as string;
      if (titleAr !== null) items[idx].titleAr = titleAr;
      const location = data.get('location') as string;
      if (location !== null) items[idx].location = location;
      const description = data.get('description') as string;
      if (description !== null) items[idx].description = description;
      if (data.has('isActive')) items[idx].isActive = data.get('isActive') === 'true';
      if (data.has('sortOrder')) items[idx].sortOrder = Number(data.get('sortOrder'));
      if (data.has('duration')) items[idx].duration = data.get('duration') as string;
    } else {
      items[idx] = { ...items[idx], ...(data as Partial<GalleryItem>) };
    }

    StorageService.setGallery(items);
    return items[idx];
  }
}

export async function deleteGalleryItem(id: string): Promise<void> {
  try {
    await apiClient.delete(`/api/admin/gallery/${id}`);
  } catch {
    const items = StorageService.getGallery();
    const filtered = items.filter((g) => g.id !== id);
    StorageService.setGallery(filtered);
  }
}

export async function bulkUploadGallery(
  files: (FormData | Omit<GalleryItem, 'id' | 'uploadDate'> | {
    titleEn: string;
    imageUrl: string;
    titleAr?: string;
    location?: string;
    description?: string;
    type?: 'Photo' | 'Video';
    isActive?: boolean;
    sortOrder?: number;
  })[]
): Promise<GalleryItem[]> {
  try {
    const res = await apiClient.post('/api/admin/gallery/bulk', { files });
    return res.data?.data || res.data;
  } catch {
    const items = StorageService.getGallery();
    const createdItems: GalleryItem[] = files.map((f: any, i) => ({
      id: `gal-bulk-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
      type: f.type || 'Photo',
      titleEn: f.titleEn || `Uploaded Image ${i + 1}`,
      titleAr: f.titleAr,
      imageUrl: f.imageUrl || 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&q=80&w=800',
      location: f.location,
      description: f.description,
      isActive: f.isActive ?? true,
      sortOrder: f.sortOrder || (i + 1),
      uploadDate: new Date().toISOString().substring(0, 10),
    }));
    const newGallery = [...createdItems, ...items];
    StorageService.setGallery(newGallery);
    return createdItems;
  }
}

// Named aliases for compatibility
export const getGalleryItemsApi = getGalleryItems;
export const createGalleryItemApi = createGalleryItem;
export const updateGalleryItemApi = updateGalleryItem;
export const deleteGalleryItemApi = deleteGalleryItem;
export const bulkUploadGalleryApi = bulkUploadGallery;
