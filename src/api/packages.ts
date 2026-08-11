import { apiClient, StorageService } from './client';
import { Package } from '../types';

// Helper to extract array from response
const extractPackages = (data: any): Package[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.packages)) return data.packages;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.items)) return data.items;
  }
  return [];
};

export async function getPackagesApi(): Promise<Package[]> {
  try {
    const res = await apiClient.get('/admin/packages');
    const packages = extractPackages(res.data);
    console.log('✅ API Response - packages loaded:', packages.length);
    return packages;
  } catch (error) {
    console.error('❌ API Error - falling back to storage:', error);
    return StorageService.getPackages();
  }
}

export async function getPackageApi(id: string): Promise<Package | null> {
  try {
    const res = await apiClient.get(`/admin/packages/${id}`);
    const data = res.data;
    if (data && typeof data === 'object') {
      if (data.data) return data.data;
      return data;
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching package:', error);
    const packages = StorageService.getPackages();
    const pkg = packages.find((p) => p.id === id);
    return pkg || null;
  }
}

// Create package with FormData (for file upload)
export async function createPackageApi(data: FormData): Promise<Package> {
  try {
    console.log('📤 createPackageApi - FormData');
    
    const res = await apiClient.post('/admin/packages', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    const newPkg = res.data?.data || res.data;
    console.log('✅ Package created via API:', newPkg);
    return newPkg;
  } catch (error: any) {
    console.error('❌ API Error - creating package:', error);
    console.error('❌ Response data:', error.response?.data);
    console.error('❌ Response status:', error.response?.status);
    throw error;
  }
}

// Update package - FIXED: Handle both FormData and JSON, preserve image
export async function updatePackageApi(id: string, data: FormData | Partial<Package>): Promise<Package> {
  try {
    const isFormData = data instanceof FormData;
    
    console.log(`📤 updatePackageApi - ${isFormData ? 'FormData' : 'JSON'}:`, { id });
    
    const config = isFormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } } 
      : {};

    const res = await apiClient.put(`/admin/packages/${id}`, data, config);
    const updatedPkg = res.data?.data || res.data;
    console.log('✅ Package updated via API:', updatedPkg);
    return updatedPkg;
  } catch (error: any) {
    console.error('❌ API Error - updating package:', error);
    console.error('❌ Response data:', error.response?.data);
    console.error('❌ Response status:', error.response?.status);
    throw error;
  }
}

// Delete package
export async function deletePackageApi(id: string): Promise<void> {
  try {
    await apiClient.delete(`/admin/packages/${id}`);
    console.log('✅ Package deleted via API:', id);
  } catch (error) {
    console.error('❌ API Error - deleting from storage:', error);
    const packages = StorageService.getPackages();
    const filtered = packages.filter((p) => p.id !== id);
    StorageService.setPackages(filtered);
  }
}

export async function incrementPackageClicksApi(id: string): Promise<number> {
  try {
    const res = await apiClient.post(`/packages/${id}/click-whatsapp`);
    const clicks = res.data?.whatsappClicks || res.data?.clicks || 0;
    console.log('✅ Click incremented via API:', clicks);
    return clicks;
  } catch (error) {
    console.error('❌ API Error - incrementing in storage:', error);
    const packages = StorageService.getPackages();
    const pkg = packages.find((p) => p.id === id);
    if (pkg) {
      pkg.whatsappClicks = (pkg.whatsappClicks || 0) + 1;
      StorageService.setPackages(packages);
      return pkg.whatsappClicks;
    }
    return 0;
  }
}

export const trackPackageClick = incrementPackageClicksApi;