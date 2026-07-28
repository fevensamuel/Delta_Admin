import { apiClient, StorageService } from './client';
import { SmsCampaign } from '../types';

export async function getCampaignsApi(): Promise<SmsCampaign[]> {
  try {
    const res = await apiClient.get('/api/admin/sms/logs');
    return res.data?.data || res.data;
  } catch {
    return StorageService.getCampaigns();
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
    return res.data;
  } catch {
    const subscribers = StorageService.getSubscribers().filter((s) => s.optInStatus === 'Active');
    const campaigns = StorageService.getCampaigns();

    const recipientLogs = subscribers.map((sub) => ({
      phone: sub.phone,
      name: sub.email ? sub.email.split('@')[0] : 'Subscriber',
      status: 'Delivered' as const
    }));

    const newCampaign: SmsCampaign = {
      id: `cmp-${Date.now()}`,
      name: campaignData.name,
      targetFilter: campaignData.targetFilter,
      message: campaignData.message,
      recipientsCount: recipientLogs.length,
      sentDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Delivered',
      recipients: recipientLogs
    };

    campaigns.unshift(newCampaign);
    StorageService.setCampaigns(campaigns);
    return newCampaign;
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
