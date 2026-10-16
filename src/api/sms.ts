// src/api/sms.ts
import { apiClient } from './client';
import { SmsCampaign } from '../types';

export async function getCampaignsApi(): Promise<SmsCampaign[]> {
  try {
    const res = await apiClient.get('/admin/sms/campaigns');
    console.log('📡 SMS campaigns response:', res.data);

    if (res.data && typeof res.data === 'object') {
      if (Array.isArray(res.data.data)) {
        return res.data.data;
      }
      if (res.data.count !== undefined && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      if (Array.isArray(res.data)) {
        return res.data;
      }
    }

    console.warn('⚠️ Could not extract campaigns from response, returning empty array');
    return [];
  } catch (error) {
    console.error('❌ Error loading SMS campaigns:', error);
    return [];
  }
}

export const getSmsHistory = getCampaignsApi;

/**
 * ✅ Sends the SMS campaign payload to the backend.
 * IMPORTANT: This function passes the payload through UNCHANGED.
 * The component (SmsCampaignPage) already builds the correct payload with
 * manualNumbers, campaignName, packageInterestId, scheduledDate, etc.
 * Do NOT whitelist fields here — that silently drops data.
 */
export async function sendSmsCampaignApi(campaignData: any): Promise<SmsCampaign> {
  try {
    const payload = {
      ...campaignData,
      campaignName: campaignData.campaignName || campaignData.name,
    };

    console.log('📤 Sending SMS campaign payload:', payload);

    const res = await apiClient.post('/admin/sms/campaign', payload);
    const data = res.data?.data || res.data;
    return data;
  } catch (error) {
    console.error('❌ Error sending SMS campaign:', error);
    throw new Error((error as Error)?.message || 'Failed to send SMS campaign');
  }
}