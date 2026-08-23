// src/api/priceLogs.ts
import { apiClient } from './client';
import { PriceLog } from '../types';

export async function getPriceLogsApi(): Promise<PriceLog[]> {
  try {
    const res = await apiClient.get('/admin/price-logs');
    console.log('📥 Price logs raw response:', res.data);
    
    // Handle different response formats
    let data = res.data;
    if (data && data.data) {
      data = data.data;
    }
    if (Array.isArray(data)) {
      console.log('✅ Price logs data:', data);
      return data;
    }
    return [];
  } catch (error) {
    console.error('❌ Error fetching price logs:', error);
    return [];
  }
}

export async function createPriceLogApi(log: Omit<PriceLog, 'id' | 'updatedAt'>): Promise<PriceLog> {
  try {
    const res = await apiClient.post('/admin/price-logs', log);
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error('❌ Error creating price log:', error);
    throw new Error(error?.response?.data?.error || 'Failed to create price log');
  }
}