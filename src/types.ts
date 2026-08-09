export type UserRole = 'SuperAdmin' | 'Admin' | 'Editor';

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
  priceEtb?: number; // Primary ETB Price
  priceUsd?: number; // USD Price (Auto-calculated)
  price: number; // Fallback USD/ETB Price
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
  titleAm?: string;  // Added for Amharic titles
  imageUrl: string;
  videoUrl?: string;
  duration?: string;
  location?: string;
  description?: string;
  isActive: boolean;
  sortOrder?: number;
  uploadDate: string;  // Frontend uses this
  createdAt?: string;  // Backend returns this
  updatedAt?: string;  // Backend returns this
}

export interface Subscriber {
  id: string;
  phone: string;
  email?: string;
  name?: string;  // Added
  channel: string;  // Changed from strict union to string for flexibility
  packageInterestId?: string;  // Changed from packageInterest
  packageInterest?: string;  // Kept for backward compatibility
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