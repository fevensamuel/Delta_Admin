import axios from 'axios';
import {
  INITIAL_PACKAGES,
  INITIAL_GALLERY,
  INITIAL_SUBSCRIBERS,
  INITIAL_CAMPAIGNS,
  INITIAL_INQUIRIES,
  INITIAL_USERS,
  INITIAL_LEAD_STATS
} from './mockData';

const BASE_URL = ((import.meta as any).env?.VITE_API_URL as string) || 'https://api.deltatravel.com';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 5000
});

// Interceptor to inject JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// In-Memory store cache to ensure instant reactivity and avoid localStorage quota crashes
const memoryStore: Record<string, any> = {};

// Local Storage Helper for Mock Fallback Persistence
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

  // Packages
  static getPackages() {
    return this.get('packages', INITIAL_PACKAGES);
  }
  static setPackages(data: typeof INITIAL_PACKAGES) {
    this.set('packages', data);
  }

  // Gallery
  static getGallery() {
    return this.get('gallery', INITIAL_GALLERY);
  }
  static setGallery(data: typeof INITIAL_GALLERY) {
    this.set('gallery', data);
  }

  // Subscribers
  static getSubscribers() {
    return this.get('subscribers', INITIAL_SUBSCRIBERS);
  }
  static setSubscribers(data: typeof INITIAL_SUBSCRIBERS) {
    this.set('subscribers', data);
  }

  // Campaigns
  static getCampaigns() {
    return this.get('campaigns', INITIAL_CAMPAIGNS);
  }
  static setCampaigns(data: typeof INITIAL_CAMPAIGNS) {
    this.set('campaigns', data);
  }

  // Inquiries
  static getInquiries() {
    return this.get('inquiries', INITIAL_INQUIRIES);
  }
  static setInquiries(data: typeof INITIAL_INQUIRIES) {
    this.set('inquiries', data);
  }

  // Users
  static getUsers() {
    return this.get('users', INITIAL_USERS);
  }
  static setUsers(data: typeof INITIAL_USERS) {
    this.set('users', data);
  }

  // Lead Stats
  static getLeadStats() {
    return this.get('lead_stats', INITIAL_LEAD_STATS);
  }
  static setLeadStats(data: typeof INITIAL_LEAD_STATS) {
    this.set('lead_stats', data);
  }
}
