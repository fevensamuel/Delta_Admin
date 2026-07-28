import { apiClient, StorageService } from './client';
import { DashboardStats, LeadAnalytics } from '../types';

export async function getDashboardStatsApi(): Promise<DashboardStats> {
  try {
    const res = await apiClient.get('/api/admin/dashboard/stats');
    return res.data?.data || res.data;
  } catch {
    const subscribers = StorageService.getSubscribers();
    const inquiries = StorageService.getInquiries();
    const packages = StorageService.getPackages();
    const gallery = StorageService.getGallery();
    const campaigns = StorageService.getCampaigns();

    const totalPackageClicks = packages.reduce((acc, p) => acc + (p.whatsappClicks || 0), 0);
    const smsSentThisMonth = campaigns.reduce((acc, c) => acc + c.recipientsCount, 0);

    const categoryClicksMap: Record<string, number> = {
      Economy: 0,
      Standard: 0,
      Premium: 0,
      VIP: 0,
      Hajj: 0
    };

    packages.forEach((p) => {
      categoryClicksMap[p.category] = (categoryClicksMap[p.category] || 0) + (p.whatsappClicks || 0);
    });

    const clicksByCategory = Object.entries(categoryClicksMap).map(([category, clicks]) => ({
      category,
      clicks
    }));

    const galleryTrend = [
      { date: 'May', uploads: 2 },
      { date: 'Jun', uploads: 5 },
      { date: 'Jul', uploads: gallery.length }
    ];

    const activePackagesCount = packages.filter(p => p.status === 'Active' || p.status !== 'Inactive').length;

    return {
      totalPackages: packages.length,
      activePackages: activePackagesCount,
      totalGalleryItems: gallery.length,
      totalInquiries: inquiries.length,
      totalSubscribers: subscribers.length,
      totalPackageClicks,
      totalWhatsappClicks: totalPackageClicks,
      smsSentThisMonth,
      recentInquiries: inquiries.slice(0, 5),
      recentGalleryUploads: gallery.slice(0, 5),
      recentSubscribers: subscribers.slice(0, 5),
      clicksByCategory,
      galleryTrend
    };
  }
}

export async function getLeadStatsApi(): Promise<LeadAnalytics> {
  try {
    const res = await apiClient.get('/api/admin/packages/stats');
    return res.data;
  } catch {
    const packages = StorageService.getPackages();
    const totalClicks = packages.reduce((acc, p) => acc + (p.whatsappClicks || 0), 0);

    const categoryMap: Record<string, number> = {
      Economy: 0,
      Standard: 0,
      Premium: 0,
      VIP: 0,
      Hajj: 0
    };

    const packageStats = packages.map((p) => {
      const clickCount = p.whatsappClicks || 0;
      categoryMap[p.category] = (categoryMap[p.category] || 0) + clickCount;
      const pct = totalClicks > 0 ? parseFloat(((clickCount / totalClicks) * 100).toFixed(1)) : 0;
      return {
        packageId: p.id,
        packageTitle: p.titleEn,
        category: p.category,
        price: p.price,
        clickCount,
        latestClickDate: p.updatedAt,
        percentageOfTotal: pct
      };
    });

    const categoryDistribution = Object.entries(categoryMap).map(([category, clicks]) => ({
      category: category as any,
      clicks
    }));

    return {
      totalClicks,
      todayClicks: Math.round(totalClicks * 0.05),
      thisWeekClicks: Math.round(totalClicks * 0.22),
      thisMonthClicks: Math.round(totalClicks * 0.75),
      packageStats,
      categoryDistribution
    };
  }
}

export const getDashboardStats = getDashboardStatsApi;
