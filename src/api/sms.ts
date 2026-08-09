import { apiClient } from './client';
import { SmsCampaign } from '../types';

export async function getCampaignsApi(): Promise<SmsCampaign[]> {
  try {
    const res = await apiClient.get('/api/admin/sms/campaigns');
    console.log('📡 SMS campaigns response:', res.data);
    
    // Handle different response structures
    if (res.data && typeof res.data === 'object') {
      // If response has a data property that is an array
      if (Array.isArray(res.data.data)) {
        return res.data.data;
      }
      // If response has a count property and data property
      if (res.data.count !== undefined && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      // If response is directly an array
      if (Array.isArray(res.data)) {
        return res.data;
      }
    }
    
    // If we can't extract campaigns, return empty array
    console.warn('⚠️ Could not extract campaigns from response, returning empty array');
    return [];
  } catch (error) {
    console.error('❌ Error loading SMS campaigns:', error);
    return [];
  }
}

export const getSmsHistory = getCampaignsApi;

export async function sendSmsCampaignApi(campaignData: {
  name: string;
  targetFilter: string;
  message: string;
}): Promise<SmsCampaign> {
  try {
    const res = await apiClient.post('/api/admin/sms/campaign', campaignData);
    // Handle response structure
    const data = res.data?.data || res.data;
    return data;
  } catch (error) {
    console.error('❌ Error sending SMS campaign:', error);
    throw new Error((error as Error)?.message || 'Failed to send SMS campaign');
  }
}

export async function sendTestSmsApi(phone: string, message: string): Promise<boolean> {
  // Simulate test SMS sending
  await new Promise((resolve) => setTimeout(resolve, 800));
  if (!phone || phone.length < 8) {
    throw new Error('Invalid phone number provided for test SMS');
  }
  return true;
}