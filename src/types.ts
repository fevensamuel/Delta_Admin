// src/types.ts
export type UserRole = 'Admin';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  isActive?: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export type PackageCategory = 'Economy' | 'Standard' | 'Premium' | 'VIP';

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  description: string;
  image?: string;
}

export interface Package {
  id: string;
  titleEn: string;
  titleAr?: string;
  titleAm?: string;
  category: PackageCategory;
  priceEtb?: number;
  priceUsd?: number;
  priceSar?: number;
  price: number;
  durationDays: number;
  departureCity?: string;
  imageUrl: string;
  inclusions: string[];
  availableDates: string[];
  itinerary: ItineraryDay[];
  whatsappClicks: number;
  status: 'Active' | 'Archived' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export type GalleryType = 'photo' | 'video' | 'Photo' | 'Video';

export interface GalleryItem {
  id: string;
  type: GalleryType;
  titleEn: string;
  titleAr?: string;
  titleAm?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  duration?: string;
  location?: string;
  description?: string;
  isActive: boolean;
  sortOrder?: number;
  uploadDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subscriber {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  channel: string;
  packageInterestId?: string;
  packageInterest?: string;
  optInStatus: 'Active' | 'Opt-out';
  dateSubscribed: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SmsCampaign {
  id: string;
  name: string;
  targetFilter: string;
  message: string;
  recipientsCount: number;
  sentDate: string;
  status: 'Delivered' | 'Failed' | 'Sending';
  recipients?: { phone: string; name?: string; status: 'Delivered' | 'Failed' }[];
}

export type InquiryStatus = 'New' | 'Contacted' | 'Resolved';

export interface Inquiry {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  dateReceived: string;
  adminNotes?: string;
  readAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PackageClickStat {
  packageId: string;
  packageTitle: string;
  category: PackageCategory;
  price: number;
  clickCount: number;
  latestClickDate: string;
  percentageOfTotal: number;
}

export interface LeadAnalytics {
  totalClicks: number;
  todayClicks: number;
  thisWeekClicks: number;
  thisMonthClicks: number;
  packageStats: PackageClickStat[];
  categoryDistribution: { category: PackageCategory; clicks: number }[];
}

export interface DashboardStats {
  totalPackages: number;
  activePackages?: number;
  totalGalleryItems: number;
  totalInquiries: number;
  totalSubscribers: number;
  totalPackageClicks: number;
  totalWhatsappClicks?: number;
  smsSentThisMonth: number;
  recentInquiries: Inquiry[];
  recentGalleryUploads: GalleryItem[];
  recentSubscribers: Subscriber[];
  clicksByCategory: { category: string; clicks: number }[];
  galleryTrend: { date: string; uploads: number }[];
}

// ===== NEW TYPES =====
export interface FAQItem {
  id: string;
  q: string;
  a: string;
}

export interface PackageFAQ {
  id: string;
  packageId: string;
  questions: FAQItem[];
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  isActive: boolean;
  icon: string;
}

export interface PriceLog {
  id: string;
  packageId: string;
  priceUsd: number;
  priceEtb: number;
  priceSar: number;
  previousPriceUsd: number | null;
  previousPriceEtb: number | null;
  previousPriceSar: number | null;
  reason: string;
  updatedBy: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}