import { apiClient, StorageService } from './client';
import { Package } from '../types';

export async function getPackagesApi(): Promise<Package[]> {
  try {
    const res = await apiClient.get('/api/packages');
    return res.data;
  } catch {
    return StorageService.getPackages();
  }
}

export async function createPackageApi(pkgData: Omit<Package, 'id' | 'whatsappClicks' | 'createdAt' | 'updatedAt'>): Promise<Package> {
  try {
    const res = await apiClient.post('/api/admin/packages', pkgData);
    return res.data;
  } catch {
    const packages = StorageService.getPackages();
    const newPkg: Package = {
      ...pkgData,
      id: `pkg-${Date.now()}`,
      whatsappClicks: 0,
      createdAt: new Date().toISOString().substring(0, 10),
      updatedAt: new Date().toISOString().substring(0, 10)
    };
    packages.unshift(newPkg);
    StorageService.setPackages(packages);
    return newPkg;
  }
}

export async function updatePackageApi(id: string, pkgData: Partial<Package>): Promise<Package> {
  try {
    const res = await apiClient.put(`/api/admin/packages/${id}`, pkgData);
    return res.data;
  } catch {
    const packages = StorageService.getPackages();
    const idx = packages.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Package not found');
    
    packages[idx] = {
      ...packages[idx],
      ...pkgData,
      updatedAt: new Date().toISOString().substring(0, 10)
    };
    StorageService.setPackages(packages);
    return packages[idx];
  }
}

export async function deletePackageApi(id: string): Promise<void> {
  try {
    await apiClient.delete(`/api/admin/packages/${id}`);
  } catch {
    const packages = StorageService.getPackages();
    const filtered = packages.filter((p) => p.id !== id);
    StorageService.setPackages(filtered);
  }
}

export async function incrementPackageClicksApi(id: string): Promise<number> {
  try {
    const res = await apiClient.post(`/api/packages/${id}/click-whatsapp`);
    return res.data?.whatsappClicks || res.data?.clicks || 1;
  } catch {
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
