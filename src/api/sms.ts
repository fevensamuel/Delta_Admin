// src/api/sms.ts
import { apiClient } from './client';
import { SmsCampaign } from '../types';

// Campaign sends go out one SMS at a time, so a big campaign can take minutes.
const SEND_CAMPAIGN_TIMEOUT_MS = 10 * 60 * 1000;

export async function getCampaignsApi(): Promise<SmsCampaign[]> {
  try {
    const res = await apiClient.get('/admin/sms/campaigns');
    console.log('📡 SMS campaigns response:', res.data);

    if (Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    if (Array.isArray(res.data)) {
      return res.data;
    }

    console.warn('⚠️ Could not extract campaigns from response, returning empty array');
    return [];
  } catch (error) {
    console.error('❌ Error loading SMS campaigns:', error);
    return [];
  }
}

export const getSmsHistory = getCampaignsApi;

export interface FailedNumber {
  phone: string;
  campaignName: string;
  message: string;
  error: string;
  failedAt: string;
}

/** Numbers whose latest attempt failed (optionally for one campaign), plus campaigns being resent now. */
export async function getFailedNumbersApi(
  campaignName?: string
): Promise<{ items: FailedNumber[]; running: string[] }> {
  const res = await apiClient.get('/admin/sms/failed', {
    params: campaignName ? { campaign: campaignName } : undefined,
  });
  const data = res.data?.data || res.data;
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    running: Array.isArray(data?.running) ? data.running : [],
  };
}

/** Resends a campaign's message to its failed numbers (all of them, or only `phones`). */
export async function resendFailedApi(
  campaignName: string,
  phones?: string[]
): Promise<{ started: boolean; total: number }> {
  const res = await apiClient.post('/admin/sms/resend-failed', { campaignName, phones });
  return res.data?.data || res.data;
}

export async function sendSmsCampaignApi(campaignData: any): Promise<SmsCampaign> {
  try {
    const payload = {
      ...campaignData,
      campaignName: campaignData.campaignName || campaignData.name,
    };

    console.log('📤 Sending SMS campaign payload:', payload);

    const res = await apiClient.post('/admin/sms/campaign', payload, {
      timeout: SEND_CAMPAIGN_TIMEOUT_MS,
    });
    const data = res.data?.data || res.data;
    return data;
  } catch (error) {
    console.error('❌ Error sending SMS campaign:', error);
    // Rethrow the ORIGINAL error so error.response.data (the backend's message) survives.
    throw error;
  }
}