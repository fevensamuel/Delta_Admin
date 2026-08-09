import { apiClient } from './client';

export const getExchangeRate = async (): Promise<number> => {
  try {
    const response = await apiClient.get('/api/exchange-rate');
    return response.data?.data?.rate || response.data?.rate || Number(import.meta.env.VITE_EXCHANGE_RATE_FALLBACK || import.meta.env.VITE_EXCHANGE_RATE_FALLE || 159.98);
  } catch (error) {
    throw new Error((error as Error)?.message || 'Failed to fetch exchange rate');
  }
};

export const overrideExchangeRate = async (rate: number): Promise<{ success: boolean; rate: number }> => {
  try {
    const response = await apiClient.post('/api/admin/exchange-rate', { rate });
    return response.data?.data || response.data || { success: true, rate };
  } catch {
    return { success: true, rate };
  }
};

export const convertUsdToEtb = (usd: number, rate: number): number => {
  return usd * rate;
};
