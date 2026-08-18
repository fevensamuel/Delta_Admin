import axios from 'axios';

// Get the base URL from environment or use default
// IMPORTANT: Keep the /api in the URL
const BASE_URL = ((import.meta as any).env?.VITE_API_URL as string) || 'http://localhost:3000/api';

console.log('🔗 API Base URL:', BASE_URL);

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // Increased timeout for video uploads
});

// Interceptor to inject JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle API response structures
apiClient.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Helper function to ensure data is always an array
export const ensureArray = <T,>(data: any): T[] => {
  // If it's already an array, return it
  if (Array.isArray(data)) return data;
  
  // If it's an object with a data property that's an array
  if (data && typeof data === 'object') {
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.packages)) return data.packages;
    if (Array.isArray(data.inquiries)) return data.inquiries;
    if (Array.isArray(data.subscribers)) return data.subscribers;
    if (Array.isArray(data.gallery)) return data.gallery;
  }
  
  return [];
};

// In-Memory store cache
const memoryStore: Record<string, any> = {};

// Local Storage Helper for offline-safe persistence
export class StorageService {
  private static get<T>(key: string, initialData: T): T {
    if (memoryStore[key]) {
      return memoryStore[key];
    }
    try {
      const item = localStorage.getItem(`delta_admin_${key}`);
      if (!item) {
        memoryStore[key] = initialData;
        try {
          localStorage.setItem(`delta_admin_${key}`, JSON.stringify(initialData));
        } catch {
          // Ignore quota error on initial seed
        }
        return initialData;
      }
      const parsed = JSON.parse(item);
      memoryStore[key] = parsed;
      return parsed;
    } catch {
      memoryStore[key] = initialData;
      return initialData;
    }
  }

  private static set<T>(key: string, value: T): void {
    memoryStore[key] = value;
    try {
      localStorage.setItem(`delta_admin_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn(`LocalStorage quota limit reached for delta_admin_${key}. Stored in high-capacity memory state.`, e);
    }
  }

  static getPackages() {
    return this.get('packages', [] as any[]);
  }
  static setPackages(data: any[]) {
    this.set('packages', data);
  }
  static getGallery() {
    return this.get('gallery', [] as any[]);
  }
  static setGallery(data: any[]) {
    this.set('gallery', data);
  }
  static getSubscribers() {
    return this.get('subscribers', [] as any[]);
  }
  static setSubscribers(data: any[]) {
    this.set('subscribers', data);
  }
  static getCampaigns() {
    return this.get('campaigns', [] as any[]);
  }
  static setCampaigns(data: any[]) {
    this.set('campaigns', data);
  }
  static getInquiries() {
    return this.get('inquiries', [] as any[]);
  }
  static setInquiries(data: any[]) {
    this.set('inquiries', data);
  }
  static getUsers() {
    return this.get('users', [] as any[]);
  }
  static setUsers(data: any[]) {
    this.set('users', data);
  }
  static getLeadStats() {
    return this.get('lead_stats', {
      totalClicks: 0,
      todayClicks: 0,
      thisWeekClicks: 0,
      thisMonthClicks: 0,
      packageStats: [],
      categoryDistribution: []
    } as any);
  }
  static setLeadStats(data: any) {
    this.set('lead_stats', data);
  }
}