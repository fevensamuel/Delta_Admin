// src/pages/sms/SmsCampaignPage.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { SmsCampaign, Subscriber, Package } from '../../types';
import { getCampaignsApi, sendSmsCampaignApi } from '../../api/sms';
import { getSubscribersApi } from '../../api/subscribers';
import { getPackagesApi } from '../../api/packages';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import {
  MessageSquare,
  Send,
  Smartphone,
  Users,
  AlertTriangle,
  History,
  FileSpreadsheet,
  User
} from 'lucide-react';

const API_BASE =
  (import.meta as any).env?.VITE_API_URL || 'https://api.deltagrouptravelumrah.com/api';

export const SmsCampaignPage: React.FC = () => {
  const { showToast } = useToast();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Campaign Composer State
  const [campaignName, setCampaignName] = useState('Ramadan Umrah Special Promotion 2026');
  const [targetFilter, setTargetFilter] = useState('Active Opt-in');
  const [recipientType, setRecipientType] = useState<'subscribers' | 'persons'>('subscribers');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [manualNumbers, setManualNumbers] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [message, setMessage] = useState(
    'Delta Travel Notice: Early bird discount of $150 available on 14 Days Ramadan Umrah packages! Reply YES on WhatsApp to reserve your seat.'
  );

  // Modals
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const pkgId = searchParams.get('packageId');
    if (pkgId && packages.length > 0) {
      const pkg = packages.find((p) => p.id === pkgId);
      if (pkg) {
        setRecipientType('subscribers');
        setTargetFilter(`Package:${pkgId}`);
      }
    }
  }, [searchParams, packages]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cData, sData, pData] = await Promise.all([
        getCampaignsApi(),
        getSubscribersApi(),
        getPackagesApi()
      ]);

      setCampaigns(Array.isArray(cData) ? cData : []);
      setSubscribers(Array.isArray(sData) ? sData : []);
      setPackages(Array.isArray(pData) ? pData : []);
    } catch (error) {
      console.error('❌ Error loading SMS campaign data:', error);
      showToast('error', 'Failed to load SMS campaign data');
      setCampaigns([]);
      setSubscribers([]);
      setPackages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const isActiveSubscriber = (sub: Subscriber) => {
    return sub.optInStatus === true || (sub.optInStatus as any) === 'Active';
  };

  const getSubscribersForPackageId = (pkgId: string) => {
    return subscribers.filter((s) => s.packageInterestId === pkgId);
  };

  const getPersonsForPackage = (pkgId: string) => {
    const pkg = packages.find((p) => p.id === pkgId);
    if (!pkg || !(pkg as any).persons) return [];
    return (pkg as any).persons.filter((p: any) => p.phone);
  };

  const getAllPersons = () => {
    const allPersons: any[] = [];
    packages.forEach((pkg) => {
      const persons = (pkg as any).persons;
      if (persons && Array.isArray(persons)) {
        persons.forEach((person: any) => {
          if (person.phone) {
            allPersons.push({
              ...person,
              packageTitle: pkg.titleEn,
              packageId: pkg.id
            });
          }
        });
      }
    });
    return allPersons;
  };

  const getEstimatedRecipients = () => {
    if (recipientType === 'persons') {
      if (selectedPackageId) return getPersonsForPackage(selectedPackageId).length;
      return getAllPersons().length;
    }

    if (targetFilter === 'All Subscribers') return subscribers.length;
    if (targetFilter === 'Active Opt-in') return subscribers.filter((s) => isActiveSubscriber(s)).length;
    if (targetFilter === 'Package-specific') return subscribers.filter((s) => s.packageInterestId).length;
    if (targetFilter === 'Manual Numbers') {
      return manualNumbers.split(/[\n,;]+/).filter((n) => n.trim().length > 0).length;
    }
    if (targetFilter.startsWith('Package:')) {
      const pkgId = targetFilter.slice('Package:'.length);
      return getSubscribersForPackageId(pkgId).length;
    }
    return subscribers.filter((s) => isActiveSubscriber(s)).length;
  };

  const estimatedRecipientsCount = getEstimatedRecipients();
  const activeSubscribersCount = subscribers.filter((s) => isActiveSubscriber(s)).length;
  const allPersonsCount = getAllPersons().length;

  const charLength = message.length;
  const smsSegments = Math.ceil(charLength / 160) || 1;
  const isOverTwilioLimit = charLength > 1600;

  const handleDispatchCampaign = async () => {
    if (!campaignName.trim() || !message.trim()) {
      showToast('error', 'Campaign name and message body are required');
      return;
    }
    if (isOverTwilioLimit) {
      showToast('error', 'Message exceeds 1600 character limit');
      return;
    }

    setIsSending(true);
    try {
      const payload: any = {
        name: campaignName,
        campaignName,
        message,
        recipientType,
      };

      if (recipientType === 'persons') {
        payload.packageId = selectedPackageId || undefined;
        payload.targetFilter = selectedPackageId ? 'Package-specific' : 'All Persons';
      } else {
        payload.targetFilter = targetFilter;

        if (targetFilter === 'Manual Numbers') {
          payload.manualNumbers = manualNumbers;
        }

        if (targetFilter.startsWith('Package:')) {
          const pkgId = targetFilter.slice('Package:'.length);
          const pkgTitle = packages.find((p) => p.id === pkgId)?.titleEn || 'Package';
          payload.targetFilter = `Package: ${pkgTitle}`;
          payload.packageInterestId = pkgId;
        }
      }

      if (scheduledDate) payload.scheduledDate = scheduledDate;

      console.log('📤 Sending SMS campaign payload:', payload);

      const newCmp: any = await sendSmsCampaignApi(payload);

      showToast(
        'success',
        `Campaign "${newCmp.campaignName || newCmp.name || campaignName}" sent. ` +
          `Accepted by AfroMessage: ${newCmp.sent ?? 0}, Failed: ${newCmp.failed ?? 0}`
      );
      setIsSendConfirmOpen(false);
      setMessage('');
      loadData();
    } catch (error: any) {
      console.error('❌ Error sending campaign:', error);
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
         error?.message ||
        'Failed to send campaign';
      showToast('error', msg);
    } finally {
      setIsSending(false);
    }
  };

  // ✅ Rewritten — fetches recipients from backend
  const handleExportCampaignReport = async (cmp: any) => {
    const campaignNameToExport = cmp.campaignName || cmp.name;
    if (!campaignNameToExport) {
      showToast('error', 'Campaign name missing');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('token') || '';
      const url = `${API_BASE}/admin/sms/campaigns/${encodeURIComponent(
        campaignNameToExport
      )}/recipients`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const json = await res.json();
      const recipients: any[] = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json)
          ? json
          : [];

      if (recipients.length === 0) {
        showToast('info', 'No recipients to export for this campaign');
        return;
      }

      const escapeCsv = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;

      const headers = ['Phone', 'Status', 'Error', 'Sent At'];
      const rows = recipients.map((r) => [
        `"\t${r.phone || ''}"`,
        escapeCsv(r.status || ''),
        escapeCsv(r.error_message || r.errorMessage || ''),
        escapeCsv(r.sent_at || r.sentAt || ''),
      ]);

      const csvBody = [
        headers.map(escapeCsv).join(','),
        ...rows.map((r) => r.join(',')),
      ].join('\r\n');

      const csvContent = '\uFEFF' + csvBody;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', blobUrl);
      link.setAttribute(
        'download',
        `campaign_${campaignNameToExport.replace(/[^a-z0-9]/gi, '_')}_${new Date()
          .toISOString()
          .substring(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      showToast('success', `Exported ${recipients.length} recipients`);
    } catch (error: any) {
      console.error('❌ Export error:', error);
      showToast('error', error?.message || 'Failed to export campaign report');
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading SMS Broadcast Center..." />;
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">SMS Campaign & Broadcast Center</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Compose marketing SMS messages, preview mobile layout, send test messages, and dispatch campaigns.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-2xl font-black text-[#C8102E]">{subscribers.length}</p>
          <p className="text-xs text-slate-500">Total Subscribers</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-2xl font-black text-emerald-600">{activeSubscribersCount}</p>
          <p className="text-xs text-slate-500">Active Opt-in</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-2xl font-black text-blue-600">{allPersonsCount}</p>
          <p className="text-xs text-slate-500">Persons on Package</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-2xl font-black text-amber-600">{campaigns.length}</p>
          <p className="text-xs text-slate-500">Campaigns Sent</p>
        </div>
      </div>

      {/* Campaign Composer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#1A5B4B]" /> Campaign Composer
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Campaign Reference Name *
            </label>
            <input
              type="text"
              required
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. Ramadan Early Bird Discount 2026"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1A5B4B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Type *</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRecipientType('subscribers')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  recipientType === 'subscribers'
                    ? 'bg-[#1A5B4B] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Users className="w-4 h-4" /> SMS Subscribers
              </button>
              <button
                type="button"
                onClick={() => setRecipientType('persons')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  recipientType === 'persons'
                    ? 'bg-[#1A5B4B] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <User className="w-4 h-4" /> Persons on Package
              </button>
            </div>
          </div>

          {recipientType === 'persons' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Package</label>
              <select
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#1A5B4B]"
              >
                <option value="">All Packages ({allPersonsCount} persons)</option>
                {packages.map((pkg) => {
                  const count = ((pkg as any).persons?.filter((p: any) => p.phone)?.length) || 0;
                  return (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.titleEn} ({count} person{count !== 1 ? 's' : ''})
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recipient Selection Filter *
                </label>
                <select
                  value={targetFilter}
                  onChange={(e) => setTargetFilter(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#1A5B4B]"
                >
                  <option value="Active Opt-in">
                    Active Opt-in Subscribers ({activeSubscribersCount})
                  </option>
                  <option value="All Subscribers">All Subscribers ({subscribers.length})</option>

                  <optgroup label="📦 Package Specific Subscribers">
                    {packages.map((pkg) => {
                      const count = getSubscribersForPackageId(pkg.id).length;
                      return (
                        <option key={pkg.id} value={`Package:${pkg.id}`}>
                          {pkg.titleEn} ({count} subscriber{count !== 1 ? 's' : ''})
                        </option>
                      );
                    })}
                  </optgroup>

                  <optgroup label="⚙️ Other Recipient Filters">
                    <option value="Package-specific">
                      All Package Leads ({subscribers.filter((s) => s.packageInterestId).length})
                    </option>
                    <option value="Manual Numbers">Manual Numbers Input</option>
                  </optgroup>
                </select>
              </div>

              {targetFilter === 'Manual Numbers' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Manual Phone Numbers (comma or newline separated)
                  </label>
                  <textarea
                    rows={3}
                    value={manualNumbers}
                    onChange={(e) => setManualNumbers(e.target.value)}
                    placeholder="+251911223344, +251922334455"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-[#C8102E]"
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Schedule Dispatch (Optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-[#C8102E]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">SMS Message Content *</label>
              <span
                className={`text-[11px] font-mono font-bold ${
                  charLength > 1500 ? 'text-rose-600' : 'text-slate-500'
                }`}
              >
                {charLength} / 1600 chars ({smsSegments} {smsSegments === 1 ? 'segment' : 'segments'})
              </span>
            </div>
            <textarea
              rows={5}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your promotional message..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1A5B4B]"
            />

            {isOverTwilioLimit && (
              <p className="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Message exceeds 1600 character limit!
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Users className="w-4 h-4 text-[#1A5B4B]" />
              <span>
                Targeting <strong>{estimatedRecipientsCount}</strong>{' '}
                {recipientType === 'persons' ? 'persons' : 'contacts'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSendConfirmOpen(true)}
                disabled={!message.trim() || isOverTwilioLimit}
                className="px-5 py-2 rounded-xl bg-[#1A5B4B] hover:bg-[#14483B] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-[#C9A84C]" /> Launch Campaign
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A2E] text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-[#C9A84C] tracking-wider uppercase flex items-center gap-1">
                <Smartphone className="w-4 h-4" /> Mobile Live Preview
              </span>
              <span className="text-[10px] text-slate-400">Delta Travel SMS</span>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-inner space-y-3 my-2">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <div className="w-7 h-7 rounded-full bg-[#1A5B4B] text-xs font-bold flex items-center justify-center text-white">
                  DT
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">Delta Group</p>
                  <p className="text-[9px] text-slate-400">SMS Broadcast</p>
                </div>
              </div>

              <div className="p-3 bg-emerald-900/60 border border-emerald-700/50 rounded-xl text-xs text-emerald-100 leading-relaxed font-sans shadow-xs">
                {message || (
                  <span className="text-slate-500 italic">
                    Message preview will appear here as you type...
                  </span>
                )}
              </div>
              <p className="text-[9px] text-slate-400 text-right">Just now • Delivered</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Segments: {smsSegments}</span>
            <span>
              Estimated Cost: ${(estimatedRecipientsCount * 0.02 * smsSegments).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Campaign History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-[#1A5B4B]" /> Sent Campaigns History
          </h3>
          <span className="text-xs text-slate-500">{campaigns.length} campaigns</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Campaign Name</th>
                <th className="p-3">Message Preview</th>
                <th className="p-3">Recipients</th>
                <th className="p-3">Sent Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
  {campaigns.length === 0 ? (
    <tr>
      <td colSpan={6} className="p-8 text-center text-slate-500">
        No past campaigns sent yet.
      </td>
    </tr>
  ) : (
    campaigns.map((cmp: any, idx: number) => {
      const name = cmp.campaignName || cmp.name || '—';
      const sentAt = cmp.sentAt || cmp.sentDate || cmp.sent_date;
      const status = cmp.status || 'Pending';
      return (
        <tr key={cmp.id || `${name}-${idx}`} className="hover:bg-slate-50">
          <td className="p-3 font-bold text-slate-900">{name}</td>
          <td className="p-3 max-w-xs truncate text-slate-700 font-sans">
            {cmp.message || '—'}
          </td>
          <td className="p-3 font-bold text-slate-900">
            {cmp.recipients_count ?? cmp.recipientsCount ?? 1}
          </td>
          <td className="p-3 text-slate-500">
            {sentAt ? new Date(sentAt).toLocaleString() : '—'}
          </td>
          <td className="p-3">
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                status === 'Delivered'
                  ? 'bg-emerald-100 text-emerald-800'
                  : status === 'Sent'
                    ? 'bg-sky-100 text-sky-800'
                    : status === 'Failed'
                      ? 'bg-rose-100 text-rose-800'
                      : status === 'Partial'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
              }`}
            >
              {status}
            </span>
          </td>
          <td className="p-3 text-right">
            <button
              onClick={() => handleExportCampaignReport(cmp)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold inline-flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#1A5B4B]" /> Export CSV
            </button>
          </td>
        </tr>
      );
    })
  )}
</tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={isSendConfirmOpen}
        title="Confirm SMS Campaign Broadcast?"
        message={`Are you sure you want to broadcast this message to ${estimatedRecipientsCount} ${
          recipientType === 'persons' ? 'persons' : 'subscribers'
        }?`}
        confirmLabel={`Send to ${estimatedRecipientsCount} ${
          recipientType === 'persons' ? 'Persons' : 'Contacts'
        }`}
        onConfirm={handleDispatchCampaign}
        onCancel={() => setIsSendConfirmOpen(false)}
        isLoading={isSending}
        variant="info"
      />
    </div>
  );
};