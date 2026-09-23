// src/types.ts
export type UserRole = 'Admin';

export type CustomerCategory = 'New' | 'Customer' | 'Regular Customer';

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
export type PriceType = 'single' | 'range';
export type DiscountType = 'percentage' | 'fixed';

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  description: string;
  image?: string;
}

export interface PersonPrice {
  id: string;
  label: string;
  priceUsd: number;
  priceEtb: number;
  priceSar: number;
  minAge?: number;
  maxAge?: number;
  isDefault?: boolean;
  isActive: boolean;
}

export interface Discount {
  id: string;
  type: DiscountType;
  value: number;
  discountedPriceUsd?: number;
  discountedPriceEtb?: number;
  discountedPriceSar?: number;
  label: string;
  description?: string;
  minPersons?: number;
  maxPersons?: number;
  ageGroup?: string;
  isActive: boolean;
}

export interface Package {
  id: string;
  titleEn: string;
  titleAr?: string;
  titleAm?: string;
  category: PackageCategory;

  price: number;
  priceUsd?: number;
  priceEtb?: number;
  priceSar?: number;
  priceType?: PriceType;

  priceUsdMin?: number;
  priceUsdMax?: number;
  priceEtbMin?: number;
  priceEtbMax?: number;
  priceSarMin?: number;
  priceSarMax?: number;

  discounts?: Discount[];

  durationDays: number;
  departureCity?: string;
  imageUrl: string;
  inclusions: string[];
  availableDates: string[];
  itinerary: ItineraryDay[];
  whatsappClicks: number;
  status: 'Active' | 'Archived' | 'Inactive';
  isActive?: boolean;
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
  packageTitle?: string;
  packageCategory?: string;
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

export interface OfficeImage {
  id: string;
  title?: string;
  imageUrl: string;
  description?: string;
  order?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  textAr?: string;
  date: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  name: string;
  phone: string;
  gender?: 'Male' | 'Female' | 'Child';
  customerCategory: CustomerCategory;
  createdAt?: string;
  updatedAt?: string;
}

export interface AudioTrack {
  id: string;
  titleEn: string;
  titleAm: string;
  titleAr: string;
  audioUrl: string;
  duration: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FlightInquiry {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  fromCity: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  tripType: string;
  passengers: number;
  cabinClass: string;
  preferredAirline: string;
  notes: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export type FlightInquiryStatus = 'New' | 'Booked' | 'Cancelled';
export type TripType = 'One Way' | 'Round Trip';