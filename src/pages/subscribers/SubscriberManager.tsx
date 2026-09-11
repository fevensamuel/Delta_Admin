import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Subscriber, Package } from '../../types';
import {
  getSubscribersApi,
  updateSubscriberStatusApi,
  deleteSubscriberApi,
  bulkDeleteSubscribersApi,
  bulkImportSubscribersApi,
  createSubscriberApi
} from '../../api/subscribers';
import { getPackagesApi } from '../../api/packages';
import { BulkImportModal } from '../../components/modals/BulkImportModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { ensureArray } from '../../api/client';
import {
  Users,
  Search,
  Filter,
  Download,
  Upload,
  Trash2,
  PhoneCall,
  Mail,
  UserX,
  Send,
  Package as PackageIcon,
  Plus,
  UserPlus,
  X
} from 'lucide-react';

interface AddSubscriberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (subscriber: Omit<Subscriber, 'id' | 'dateSubscribed'>) => Promise<void>;
}

const AddSubscriberModal: React.FC<AddSubscriberModalProps> = ({ isOpen, onClose, onAdd }) => {
  const { showToast } = useToast();
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('Social Media');
  const [packageInterest, setPackageInterest] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      showToast('error', 'Phone number is required');
      return;
    }
    setIsSubmitting(true);
    try {
      await onAdd({
        phone: phone.trim(),
        email: email.trim() || '',
        name: name.trim() || '',
        channel: channel,
        packageInterest: packageInterest || '',
        optInStatus: true
      });
      // Reset form after successful submission
      setPhone('');
      setEmail('');
      setName('');
      setChannel('Social Media');
      setPackageInterest('');
      onClose();
    } catch (error) {
      showToast('error', 'Failed to add subscriber');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#111827]">Add Subscriber</h3>
          <button onClick={onClose} className="text-[#718096] hover:text-[#111827]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+251 91 123 4567"
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Name (Optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Email (Optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E]"
            >
              <option value="Social Media">Social Media</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Direct">Direct</option>
              <option value="Others">Others</option>
              <option value="Bulk Import">Bulk Import</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Package Interest (Optional)</label>
            <input
              type="text"
              value={packageInterest}
              onChange={(e) => setPackageInterest(e.target.value)}
              placeholder="e.g. Premium Umrah Package"
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Subscriber'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#E2E8F0] text-[#718096] hover:bg-[#F9FAFB] transition-colors text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SubscriberManager: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [packageFilter, setPackageFilter] = useState('All');

  // Multi-select for bulk action
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Confirm delete modal
  const [subToDelete, setSubToDelete] = useState<Subscriber | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    setIsLoading(true);
    try {
      const [sData, pData] = await Promise.all([getSubscribersApi(), getPackagesApi()]);
      setSubscribers(ensureArray<Subscriber>(sData));
      setPackages(ensureArray<Package>(pData));
    } catch {
      showToast('error', 'Failed to load subscribers');
      setSubscribers([]);
      setPackages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubscriber = async (subscriberData: Omit<Subscriber, 'id' | 'dateSubscribed'>) => {
    try {
      await createSubscriberApi(subscriberData);
      showToast('success', 'Subscriber added successfully');
      // Refresh the list to show the new subscriber
      await loadSubscribers();
    } catch (error) {
      console.error('Error adding subscriber:', error);
      throw error;
    }
  };

  const isActiveSubscriber = (sub: Subscriber) => {
    return sub.optInStatus === 'Active' || sub.optInStatus === true;
  };

  const handleToggleOptStatus = async (sub: Subscriber) => {
    try {
      const newStatus = isActiveSubscriber(sub) ? false : true;
      await updateSubscriberStatusApi(sub.id, newStatus);
      showToast('success', `Status updated for ${sub.phone}`);
      loadSubscribers();
    } catch {
      showToast('error', 'Failed to update subscriber status');
    }
  };

  const handleDeleteSingle = async () => {
    if (!subToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSubscriberApi(subToDelete.id);
      showToast('success', 'Subscriber record deleted');
      setSubToDelete(null);
      loadSubscribers();
    } catch {
      showToast('error', 'Failed to delete subscriber');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await bulkDeleteSubscribersApi(selectedIds);
      showToast('success', `Deleted ${selectedIds.length} subscribers`);
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      loadSubscribers();
    } catch (error) {
      console.error('Bulk delete error:', error);
      showToast('error', 'Failed to bulk delete subscribers');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCsv = () => {
    const subscribersArray = ensureArray<Subscriber>(subscribers);
    if (subscribersArray.length === 0) {
      showToast('info', 'No subscribers to export');
      return;
    }

    const filteredSubs = getFilteredSubscribers();
    const headers = ['Phone', 'Email', 'Name', 'Channel', 'Package Interest', 'Status', 'Date Subscribed'];
    const rows = filteredSubs.map((s) => [
      s.phone,
      s.email || '',
      s.name || '',
      s.channel || '',
      `"${s.packageInterest || ''}"`,
      isActiveSubscriber(s) ? 'Active' : 'Opt-out',
      s.dateSubscribed || new Date().toISOString().split('T')[0]
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `delta_subscribers_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'Exported subscribers CSV report');
  };

  const getFilteredSubscribers = () => {
    const subscribersArray = ensureArray<Subscriber>(subscribers);
    return subscribersArray.filter((sub) => {
      const matchesSearch =
        sub.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.email && sub.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sub.name && sub.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sub.packageInterest && sub.packageInterest.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesChannel = channelFilter === 'All' || sub.channel === channelFilter;
      
      let matchesStatus = true;
      if (statusFilter === 'Active') {
        matchesStatus = isActiveSubscriber(sub);
      } else if (statusFilter === 'Opt-out') {
        matchesStatus = !isActiveSubscriber(sub);
      }

      const matchesPackage =
        packageFilter === 'All' ||
        (sub.packageInterest &&
          (sub.packageInterest.toLowerCase().includes(packageFilter.toLowerCase()) ||
            packageFilter.toLowerCase().includes(sub.packageInterest.toLowerCase())));

      return matchesSearch && matchesChannel && matchesStatus && matchesPackage;
    });
  };

  const filteredSubscribers = getFilteredSubscribers();
  const totalPages = Math.ceil(filteredSubscribers.length / pageSize) || 1;
  const paginatedSubscribers = filteredSubscribers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedSubscribers.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading Subscriber Database..." />;
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">SMS Subscriber Database</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage opt-in subscribers, WhatsApp marketing leads, and CSV bulk uploads.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4 text-white" /> Add Subscriber
          </button>

          <button
            onClick={() => setIsImportOpen(true)}
            className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-black text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4 text-white" /> Import CSV
          </button>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#111827] font-semibold text-xs transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4 text-[#C8102E]" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-2xl font-black text-[#C8102E]">{subscribers.length}</p>
          <p className="text-xs text-slate-500">Total Subscribers</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-2xl font-black text-emerald-600">{subscribers.filter(s => isActiveSubscriber(s)).length}</p>
          <p className="text-xs text-slate-500">Active Opt-in</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-2xl font-black text-rose-600">{subscribers.filter(s => !isActiveSubscriber(s)).length}</p>
          <p className="text-xs text-slate-500">Opt-out</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-2xl font-black text-amber-600">{packages.length}</p>
          <p className="text-xs text-slate-500">Total Packages</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by phone, email, or name..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1A5B4B]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-[#1A5B4B] bg-white"
            >
              <option value="All">All Packages</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.titleEn}>
                  📦 {pkg.titleEn}
                </option>
              ))}
            </select>

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
            >
              <option value="All">All Channels</option>
              <option value="Web Banner">Web Banner</option>
              <option value="Social Media">Social Media</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Direct">Direct</option>
              <option value="Others">Others</option>
              <option value="Bulk Import">Bulk Import</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Opt-in</option>
              <option value="Opt-out">Opt-out</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
            <span className="text-xs font-bold text-rose-800">{selectedIds.length} Selected</span>
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Table View */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5 pl-5 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length > 0 && selectedIds.length === paginatedSubscribers.length}
                    className="w-4 h-4 rounded text-[#1A5B4B]"
                  />
                </th>
                <th className="p-3.5">Phone Number</th>
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Channel</th>
                <th className="p-3.5">Package Interest</th>
                <th className="p-3.5">Opt-in Status</th>
                <th className="p-3.5">Subscribed Date</th>
                <th className="p-3.5 text-right pr-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {paginatedSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No subscribers match the current filter.
                  </td>
                </tr>
              ) : (
                paginatedSubscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 pl-5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(sub.id)}
                        onChange={() => handleToggleSelectOne(sub.id)}
                        className="w-4 h-4 rounded text-[#1A5B4B]"
                      />
                    </td>

                    <td className="p-3.5 font-bold font-mono text-slate-900 text-sm">
                      {sub.phone || 'N/A'}
                    </td>

                    <td className="p-3.5 text-slate-700">
                      {sub.name || '—'}
                    </td>

                    <td className="p-3.5 text-slate-600">
                      {sub.email || '—'}
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 text-[11px]">
                        {sub.channel || 'Unknown'}
                      </span>
                    </td>

                    <td className="p-3.5 max-w-xs truncate text-slate-700">
                      {sub.packageInterest || 'General Offers'}
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isActiveSubscriber(sub)
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isActiveSubscriber(sub) ? 'Active' : 'Opt-out'}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-500">
                      {sub.dateSubscribed || new Date().toISOString().split('T')[0]}
                    </td>

                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {sub.packageInterest && (
                          <button
                            onClick={() =>
                              navigate('/sms', {
                                state: { targetFilter: `Package: ${sub.packageInterest}` }
                              })
                            }
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-[#1A5B4B]/10 text-[#1A5B4B] transition-colors"
                            title={`Compose SMS for ${sub.packageInterest} Subscribers`}
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleToggleOptStatus(sub)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                          title={isActiveSubscriber(sub) ? 'Mark as Opt-out' : 'Mark as Active'}
                        >
                          <UserX className="w-3.5 h-3.5 text-amber-600" />
                        </button>

                        <button
                          onClick={() => setSubToDelete(sub)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 transition-colors"
                          title="Delete Subscriber"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing {filteredSubscribers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(currentPage * pageSize, filteredSubscribers.length)} of {filteredSubscribers.length} contacts
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold bg-white hover:bg-slate-100 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-2 font-bold text-slate-800">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold bg-white hover:bg-slate-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BulkImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={async (list) => {
          const res = await bulkImportSubscribersApi(list);
          loadSubscribers();
          return res;
        }}
      />

      <AddSubscriberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddSubscriber}
      />

      <ConfirmModal
        isOpen={!!subToDelete}
        title="Delete Subscriber Record?"
        message={`Are you sure you want to delete phone record ${subToDelete?.phone}?`}
        confirmLabel="Delete Subscriber"
        onConfirm={handleDeleteSingle}
        onCancel={() => setSubToDelete(null)}
        isLoading={isDeleting}
      />

      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        title="Delete Selected Subscribers?"
        message={`Are you sure you want to delete ${selectedIds.length} subscriber records from the database?`}
        confirmLabel={`Delete ${selectedIds.length} Records`}
        onConfirm={handleBulkDeleteConfirm}
        onCancel={() => setIsBulkDeleteModalOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  );
};