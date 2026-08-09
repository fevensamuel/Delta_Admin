import { create } from 'zustand';
import { getExchangeRate } from '../api/exchangeRate';

interface ExchangeRateState {
  rate: number;
  lastUpdated: string | null;
  isLoading: boolean;
  setRate: (rate: number) => void;
  fetchRate: (force?: boolean) => Promise<void>;
}

const ONE_HOUR_MS = 3600000;

export const useExchangeRateStore = create<ExchangeRateState>((set, get) => ({
  rate: Number(import.meta.env.VITE_EXCHANGE_RATE_FALLBACK || import.meta.env.VITE_EXCHANGE_RATE_FALLE || 159.98),
  lastUpdated: new Date().toISOString(),
  isLoading: false,

  setRate: (rate: number) => set({ rate, lastUpdated: new Date().toISOString() }),

  fetchRate: async (force = false) => {
    const { lastUpdated, isLoading } = get();

    // Cache check: If updated within the last 1 hour, reuse cached rate unless forced
    if (!force && lastUpdated && Date.now() - new Date(lastUpdated).getTime() < ONE_HOUR_MS) {
      return;
    }

    if (isLoading) return;

    set({ isLoading: true });
    try {
      const rate = await getExchangeRate();
      const validRate = rate && rate > 0 ? rate : Number(import.meta.env.VITE_EXCHANGE_RATE_FALLBACK || import.meta.env.VITE_EXCHANGE_RATE_FALLE || 159.98);
      set({
        rate: validRate,
        lastUpdated: new Date().toISOString(),
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch exchange rate, using cached/fallback:', error);
    }
  },
}));

export const convertUsdToEtb = (usd: number): number => {
  const rate = useExchangeRateStore.getState().rate;
  return usd * rate;
};

export const convertEtbToUsd = (etb: number): number => {
  const rate = useExchangeRateStore.getState().rate;
  return rate > 0 ? etb / rate : 0;
};
