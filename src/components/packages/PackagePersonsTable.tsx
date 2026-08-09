import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Subscriber, Package } from '../../types';
import { getSubscribersApi, updateSubscriberStatusApi, deleteSubscriberApi } from '../../api/subscribers';
import { getPackagesApi } from '../../api/packages';
import { useToast } from '../../context/ToastContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Pagination } from '../common/Pagination';
import { ensureArray } from '../../api/client';
import {
  Users,
  Search,
  Filter,
  MessageSquare,
  Send,
  Download,
  Trash2,
  UserX,
  ExternalLink,
  Package as PackageIcon,
  CheckCircle2
} from 'lucide-react';

interface PackagePersonsTableProps {
  initialPackageTitle?: string;
}

export const PackagePersonsTable: React.FC<PackagePersonsTableProps> = ({ initialPackageTitle }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedPackageTitle, setSelectedPackageTitle] = useState<string>(initialPackageTitle || 'All');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sData, pData] = await Promise.all([
        getSubscribersApi(),
        getPackagesApi()
      ]);
      // Use ensureArray to guarantee arrays
      setSubscribers(ensureArray<Subscriber>(sData));
      setPackages(ensureArray<Package>(pData));
      console.log('✅ PackagePersonsTable loaded:', {
        subscribers: sData?.length || 0,
        packages: pData?.length || 0
      });
      console.log('📦 Packages in PackagePersonsTable:', pData);
    } catch (error) {
      console.error('❌ Error loading data:', error);
      showToast('error', 'Failed to load package subscription records');
      setSubscribers([]);
      setPackages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleOptStatus = async (sub: Subscriber) => {
    try {
      const newStatus = sub.optInStatus === 'Active' ? 'Opt-out' : 'Active';
      await updateSubscriberStatusApi(sub.id, newStatus);
      showToast('success', `Updated status for ${sub.phone}`);
      loadData();
    } catch {
      showToast('error', 'Failed to update subscriber status');
    }
  };

  const handleDelete = async (id: string, phone: string) => {
    if (!window.confirm(`Are you sure you want to remove person ${phone} from package records?`)) return;
    try {
      await deleteSubscriberApi(id);
      showToast('success', 'Subscriber removed');
      loadData();
    } catch {
      showToast('error', 'Failed to delete subscriber');
    }
  };

  // Filter subscribers by selected package interest & search term
  const subscribersArray = ensureArray<Subscriber>(subscribers);
  const packagesArray = ensureArray<Package>(packages);

  const filteredSubscribers = subscribersArray.filter((sub) => {
    const pkgInterest = (sub.packageInterest || '').toLowerCase();
    const cleanSelectedPkg = selectedPackageTitle.toLowerCase();

    const matchesPackage =
      selectedPackageTitle === 'All' ||
      pkgInterest.includes(cleanSelectedPkg) ||
      cleanSelectedPkg.includes(pkgInterest);

    const matchesSearch =
      sub.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.email && sub.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      pkgInterest.includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || sub.optInStatus === statusFilter;

    return matchesPackage && matchesSearch && matchesStatus;
  });

  // Calculate summary metrics
  const totalEnrolled = subscribersArray.length;
  const activeOptIns = subscribersArray.filter((s) => s.optInStatus === 'Active').length;
  const selectedPkgCount = filteredSubscribers.length;

  // Pagination calculation
  const totalPages = Math.ceil(filteredSubscribers.length / pageSize) || 1;
  const paginatedSubscribers = filteredSubscribers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportPackageCsv = () => {
    if (filteredSubscribers.length === 0) {
      showToast('info', 'No records to export');
      return;
    }

    const headers = ['Phone', 'Email', 'Package Interest', 'Channel', 'Opt-in Status', 'Date Subscribed'];
    const rows = filteredSubscribers.map((s) => [
      s.phone,
      s.email || '',
      `"${s.packageInterest || 'General'}"`,
      s.channel || '',
      s.optInStatus || 'Active',
      s.dateSubscribed || new Date().toISOString().substring(0, 10)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `package_persons_${selectedPackageTitle.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'Exported package subscribers CSV');
  };

  const handleSendPackageSms = (pkgTitle: string) => {
    navigate('/sms', { state: { targetFilter: `Package: ${pkgTitle}` } });
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading package subscribers table..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#2D7D6B]/10 flex items-center justify-center text-[#2D7D6B]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled Persons</p>
            <p className="text-lg font-bold text-slate-900">{totalEnrolled}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Opt-In Contacts</p>
            <p className="text-lg font-bold text-emerald-700">{activeOptIns}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Filtered View Count</p>
            <p className="text-lg font-bold text-[#2D7D6B]">{selectedPkgCount} Records</p>
          </div>
          <button
            onClick={handleExportPackageCsv}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#2D7D6B]" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Select Specific Package */}
          <div className="flex items-center gap-2">
            <PackageIcon className="w-4 h-4 text-[#2D7D6B]" />
            <select
              value={selectedPackageTitle}
              onChange={(e) => {
                setSelectedPackageTitle(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-[#2D7D6B]"
            >
              <option value="All">All Packages ({subscribersArray.length} persons)</option>
              {packagesArray.map((pkg) => {
                const count = subscribersArray.filter((s) => {
                  const interest = (s.packageInterest || '').toLowerCase();
                  const title = (pkg.titleEn || '').toLowerCase();
                  return interest.includes(title) || title.includes(interest);
                }).length;
                return (
                  <option key={pkg.id} value={pkg.titleEn || 'Untitled'}>
                    📦 {pkg.titleEn || 'Untitled Package'} ({count} person{count !== 1 ? 's' : ''})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by person phone, email or package name..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#2D7D6B]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Opt-in</option>
              <option value="Opt-out">Opt-out</option>
            </select>
          </div>
        </div>

        {/* Quick Send SMS Action for current package */}
        {selectedPackageTitle !== 'All' && (
          <button
            onClick={() => handleSendPackageSms(selectedPackageTitle)}
            className="px-4 py-2 rounded-xl bg-[#2D7D6B] hover:bg-[#236355] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-[#C9A84C]" /> Compose SMS for this Package
          </button>
        )}
      </div>

      {/* Package Persons Table View */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5 pl-5">Person Contact</th>
                <th className="p-3.5">Subscribed Package</th>
                <th className="p-3.5">Channel</th>
                <th className="p-3.5">Opt-in Status</th>
                <th className="p-3.5">Subscribed Date</th>
                <th className="p-3.5 text-right pr-5">Target Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {paginatedSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    {subscribersArray.length === 0 ? 'No subscribers found.' : 'No persons subscribed to this package match your filter criteria.'}
                  </td>
                </tr>
              ) : (
                paginatedSubscribers.map((sub) => {
                  const matchedPkg = packagesArray.find(
                    (p) =>
                      sub.packageInterest &&
                      ((p.titleEn || '').toLowerCase().includes(sub.packageInterest.toLowerCase()) ||
                        sub.packageInterest.toLowerCase().includes((p.titleEn || '').toLowerCase()))
                  );

                  const pkgTitle = sub.packageInterest || 'General Umrah Offers';
                  const categoryName = matchedPkg?.category || 'Standard';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      {/* Person Contact */}
                      <td className="p-3.5 pl-5">
                        <div>
                          <p className="font-bold text-slate-900 font-mono text-sm">{sub.phone}</p>
                          <p className="text-[11px] text-slate-500 font-normal">{sub.email || 'No email registered'}</p>
                        </div>
                      </td>

                      {/* Subscribed Package */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] text-white shrink-0 ${
                              categoryName === 'VIP' || categoryName === 'Premium'
                                ? 'bg-slate-900'
                                : 'bg-[#2D7D6B]'
                            }`}
                          >
                            {categoryName}
                          </span>
                          <span className="font-semibold text-slate-900 truncate max-w-xs" title={pkgTitle}>
                            {pkgTitle}
                          </span>
                        </div>
                      </td>

                      {/* Source Channel */}
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {sub.channel || 'Unknown'}
                        </span>
                      </td>

                      {/* Opt-in Status */}
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            sub.optInStatus === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {sub.optInStatus || 'Active'}
                        </span>
                      </td>

                      {/* Subscribed Date */}
                      <td className="p-3.5 text-slate-500">{sub.dateSubscribed || 'N/A'}</td>

                      {/* Actions */}
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* WhatsApp Link */}
                          <a
                            href={`https://wa.me/${sub.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-slate-200 text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>

                          {/* Send Package SMS */}
                          <button
                            onClick={() => handleSendPackageSms(pkgTitle)}
                            className="p-1.5 rounded-lg border border-slate-200 text-[#2D7D6B] hover:bg-[#2D7D6B]/10 transition-colors cursor-pointer"
                            title={`Send SMS to ${pkgTitle} Subscribers`}
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Status */}
                          <button
                            onClick={() => handleToggleOptStatus(sub)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title={sub.optInStatus === 'Active' ? 'Mark as Opt-out' : 'Mark as Active'}
                          >
                            <UserX className="w-3.5 h-3.5 text-amber-600" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(sub.id, sub.phone)}
                            className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredSubscribers.length}
          pageSize={pageSize}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </div>
    </div>
  );
};