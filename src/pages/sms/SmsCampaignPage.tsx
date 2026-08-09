import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SmsCampaign, Subscriber, Package } from '../../types';
import { getCampaignsApi, sendSmsCampaignApi } from '../../api/sms';
import { getSubscribersApi } from '../../api/subscribers';
import { getPackagesApi } from '../../api/packages';
import { TestSmsModal } from '../../components/modals/TestSmsModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { RoleGuard } from '../../components/common/RoleGuard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  MessageSquare,
  Send,
  Smartphone,
  Users,
  AlertTriangle,
  History,
  FileSpreadsheet,
  Package as PackageIcon
} from 'lucide-react';

export const SmsCampaignPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();

  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Campaign Composer State
  const [campaignName, setCampaignName] = useState('Ramadan Umrah Special Promotion 2026');
  const [targetFilter, setTargetFilter] = useState('Active Opt-in');
  const [manualNumbers, setManualNumbers] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [message, setMessage] = useState(
    'Delta Travel Notice: Early bird discount of $150 available on 14 Days Ramadan Umrah packages! Reply YES on WhatsApp to reserve your seat.'
  );

  // Modals
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Handle incoming route state or query params for pre-selected package
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const paramPkg = location.state?.targetFilter || searchParams.get('package');
    if (paramPkg) {
      if (paramPkg.startsWith('Package:')) {
        setTargetFilter(paramPkg);
      } else {
        setTargetFilter(`Package: ${paramPkg}`);
      }
    }
  }, [location.state, location.search]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cData, sData, pData] = await Promise.all([
        getCampaignsApi(),
        getSubscribersApi(),
        getPackagesApi()
      ]);
      
      // Ensure campaigns is always an array
      const campaignData = Array.isArray(cData) ? cData : [];
      const subscriberData = Array.isArray(sData) ? sData : [];
      const packageData = Array.isArray(pData) ? pData : [];
      
      setCampaigns(campaignData);
      setSubscribers(subscriberData.filter((s) => s.optInStatus === 'Active'));
      setPackages(packageData);
    } catch (error) {
      console.error('❌ Error loading SMS campaign data:', error);
      showToast('error', 'Failed to load SMS campaign data');
      // Set empty arrays so UI doesn't break
      setCampaigns([]);
      setSubscribers([]);
      setPackages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to match subscribers to a specific package
  const getSubscribersForPackage = (pkgTitle: string) => {
    const cleanPkgName = pkgTitle.replace(/^Package:\s*/i, '').trim().toLowerCase();
    return subscribers.filter((s) => {
      if (!s.packageInterest) return false;
      const interest = s.packageInterest.toLowerCase();
      return interest.includes(cleanPkgName) || cleanPkgName.includes(interest);
    });
  };

  // Recipient Calculation
  const getEstimatedRecipients = () => {
    if (targetFilter === 'All Subscribers') {
      return subscribers.length;
    }
    if (targetFilter === 'Active Opt-in') {
      return subscribers.filter((s) => s.optInStatus === 'Active').length;
    }
    if (targetFilter === 'Package-specific') {
      return subscribers.filter((s) => s.packageInterest).length;
    }
    if (targetFilter === 'Manual Numbers') {
      const numbers = manualNumbers.split(/[\n,;]+/).filter((n) => n.trim().length > 0);
      return numbers.length;
    }
    if (targetFilter.startsWith('Package:')) {
      return getSubscribersForPackage(targetFilter).length;
    }
    return subscribers.length;
  };

  const estimatedRecipientsCount = getEstimatedRecipients();

  // SMS length calculation (160 standard chars = 1 SMS segment)
  const charLength = message.length;
  const smsSegments = Math.ceil(charLength / 160) || 1;
  const isOverTwilioLimit = charLength > 1600;

  const handleDispatchCampaign = async () => {
    if (!campaignName.trim() || !message.trim()) {
      showToast('error', 'Campaign name and message body are required');
      return;
    }
    if (isOverTwilioLimit) {
      showToast('error', 'Message exceeds 1600 character Twilio limit');
      return;
    }

    setIsSending(true);
    try {
      const newCmp = await sendSmsCampaignApi({
        name: campaignName,
        targetFilter,
        message
      });
      showToast('success', `Campaign "${newCmp.name}" sent to ${newCmp.recipientsCount} subscribers!`);
      setIsSendConfirmOpen(false);
      setMessage('');
      loadData();
    } catch (error) {
      console.error('❌ Error sending campaign:', error);
      showToast('error', 'Failed to send campaign');
    } finally {
      setIsSending(false);
    }
  };

  const handleExportCampaignReport = (cmp: SmsCampaign) => {
    const headers = ['Recipient Phone', 'Name', 'Status'];
    const rows = (cmp.recipients || []).map((r) => [r.phone, r.name || 'Subscriber', r.status]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `sms_report_${cmp.name.replace(/\s+/g, '_')}.csv`;
    link.click();
    showToast('success', 'Exported campaign recipient report CSV');
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading SMS Broadcast Center..." />;
  }

  return (
    <RoleGuard module="sms" action="view">
      <div className="space-y-8 pb-12 animate-in fade-in">
        {/* Header */}
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">SMS Campaign & Broadcast Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">Compose marketing SMS messages, preview mobile layout, send test messages, and dispatch campaigns.</p>
        </div>

        {/* Campaign Composer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Form (2 cols) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#1A5B4B]" /> Campaign Composer
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Reference Name *</label>
              <input
                type="text"
                required
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. Ramadan Early Bird Discount 2026"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1A5B4B]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Selection Filter *</label>
                <select
                  value={targetFilter}
                  onChange={(e) => setTargetFilter(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#1A5B4B]"
                >
                  <option value="Active Opt-in">Active Opt-in Subscribers ({subscribers.filter(s => s.optInStatus === 'Active').length})</option>
                  <option value="All Subscribers">All Subscribers ({subscribers.length})</option>
                  
                  <optgroup label="📦 Package Specific Subscribers">
                    {packages.map((pkg) => {
                      const count = getSubscribersForPackage(pkg.titleEn).length;
                      return (
                        <option key={pkg.id} value={`Package: ${pkg.titleEn}`}>
                          {pkg.titleEn} ({count} subscriber{count !== 1 ? 's' : ''})
                        </option>
                      );
                    })}
                  </optgroup>

                  <optgroup label="⚙️ Other Recipient Filters">
                    <option value="Package-specific">All Package Leads ({subscribers.filter(s => s.packageInterest).length})</option>
                    <option value="Manual Numbers">Manual Numbers Input</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Schedule Dispatch (Optional)</label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>
            </div>

            {targetFilter === 'Manual Numbers' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Manual Phone Numbers (comma or newline separated)</label>
                <textarea
                  rows={3}
                  value={manualNumbers}
                  onChange={(e) => setManualNumbers(e.target.value)}
                  placeholder="+251911223344, +251922334455"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">SMS Message Content *</label>
                <span className={`text-[11px] font-mono font-bold ${charLength > 1500 ? 'text-rose-600' : 'text-slate-500'}`}>
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
                  <AlertTriangle className="w-4 h-4" /> Message exceeds 1600 character Twilio SMS limit!
                </p>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Users className="w-4 h-4 text-[#1A5B4B]" />
                <span>Targeting <strong>{estimatedRecipientsCount}</strong> active contacts</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(true)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 font-semibold text-xs text-slate-800 transition-colors"
                >
                  Send Test SMS
                </button>

                {hasPermission('sms', 'send') && (
                  <button
                    type="button"
                    onClick={() => setIsSendConfirmOpen(true)}
                    disabled={!message.trim() || isOverTwilioLimit}
                    className="px-5 py-2 rounded-xl bg-[#1A5B4B] hover:bg-[#14483B] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 text-[#C9A84C]" /> Launch Campaign
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Mobile Live Preview Card */}
          <div className="bg-[#1A1A2E] text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-[#C9A84C] tracking-wider uppercase flex items-center gap-1">
                  <Smartphone className="w-4 h-4" /> Mobile Live Preview
                </span>
                <span className="text-[10px] text-slate-400">Delta Travel SMS</span>
              </div>

              {/* Simulated Phone Device Frame */}
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-inner space-y-3 my-2">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <div className="w-7 h-7 rounded-full bg-[#1A5B4B] text-xs font-bold flex items-center justify-center text-white">
                    DT
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">Delta Travel</p>
                    <p className="text-[9px] text-slate-400">SMS Broadcast</p>
                  </div>
                </div>

                <div className="p-3 bg-emerald-900/60 border border-emerald-700/50 rounded-xl text-xs text-emerald-100 leading-relaxed font-sans shadow-xs">
                  {message || <span className="text-slate-500 italic">Message preview will appear here as you type...</span>}
                </div>
                <p className="text-[9px] text-slate-400 text-right">Just now • Delivered</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Segments: {smsSegments}</span>
              <span>Estimated Cost: ${(estimatedRecipientsCount * 0.02 * smsSegments).toFixed(2)}</span>
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
                  <th className="p-3">Target Audience</th>
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
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No past campaigns sent yet.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((cmp) => (
                    <tr key={cmp.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{cmp.name}</td>
                      <td className="p-3 text-slate-600">{cmp.targetFilter}</td>
                      <td className="p-3 max-w-xs truncate text-slate-700 font-sans">{cmp.message}</td>
                      <td className="p-3 font-bold text-slate-900">{cmp.recipientsCount}</td>
                      <td className="p-3 text-slate-500">{cmp.sentDate}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {cmp.status}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        <TestSmsModal
          isOpen={isTestModalOpen}
          message={message}
          onClose={() => setIsTestModalOpen(false)}
        />

        <ConfirmModal
          isOpen={isSendConfirmOpen}
          title="Confirm SMS Campaign Broadcast?"
          message={`Are you sure you want to broadcast this message to ${estimatedRecipientsCount} subscribers?`}
          confirmLabel={`Send to ${estimatedRecipientsCount} Contacts`}
          onConfirm={handleDispatchCampaign}
          onCancel={() => setIsSendConfirmOpen(false)}
          isLoading={isSending}
          variant="info"
        />
      </div>
    </RoleGuard>
  );
};