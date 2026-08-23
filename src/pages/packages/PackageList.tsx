import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from '../../types';
import { getPackagesApi, deletePackageApi, updatePackageApi } from '../../api/packages';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { Pagination } from '../../components/common/Pagination';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import { Plus, Search, Filter, Edit, Trash2, Archive, MessageSquare, Package as PackageIcon, RefreshCw } from 'lucide-react';
import { useExchangeRateStore } from '../../store/useExchangeRateStore';

// Helper function to get full image URL
const getFullImageUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (path.startsWith('data:')) {
    return path;
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const baseWithoutApi = baseUrl.replace(/\/api$/, '');
  if (path.startsWith('/uploads')) {
    return `${baseWithoutApi}${path}`;
  }
  return `${baseWithoutApi}/uploads/packages/${path}`;
};

export const PackageList: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { rate, fetchRate } = useExchangeRateStore();

  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'priceEtb' | 'duration' | 'clicks'>('clicks');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedPackageForDelete, setSelectedPackageForDelete] = useState<Package | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchRate();
    loadPackages();
  }, [fetchRate]);

  const loadPackages = async () => {
    setIsLoading(true);
    try {
      const data = await getPackagesApi();
      const packageArray = Array.isArray(data) ? data : [];
      setPackages(packageArray);
      console.log('✅ Packages loaded:', packageArray.length);
    } catch (error) {
      console.error('❌ Error loading packages:', error);
      showToast('error', 'Failed to load packages');
      setPackages([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPackages();
    showToast('success', 'Packages refreshed');
  };

  const handleToggleStatus = async (pkg: Package) => {
    try {
      const newStatus = pkg.isActive ? 'Inactive' : 'Active';
      await updatePackageApi(pkg.id, { 
        isActive: !pkg.isActive,
        status: newStatus
      });
      showToast('success', `Package "${pkg.titleEn}" status set to ${newStatus}`);
      await loadPackages();
    } catch (error) {
      console.error('❌ Error updating status:', error);
      showToast('error', 'Failed to update package status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPackageForDelete) return;
    setIsDeleting(true);
    try {
      await deletePackageApi(selectedPackageForDelete.id);
      showToast('success', `Package "${selectedPackageForDelete.titleEn}" deleted successfully`);
      setSelectedPackageForDelete(null);
      await loadPackages();
    } catch (error) {
      console.error('❌ Error deleting package:', error);
      showToast('error', 'Failed to delete package');
    } finally {
      setIsDeleting(false);
    }
  };

  const packagesArray = Array.isArray(packages) ? packages : [];

  const filteredPackages = packagesArray
    .filter((pkg) => {
      const query = debouncedSearchTerm.toLowerCase();
      const titleEn = pkg.titleEn || '';
      const titleAr = pkg.titleAr || '';
      const titleAm = pkg.titleAm || '';
      const matchesSearch = 
        titleEn.toLowerCase().includes(query) ||
        titleAr.includes(query) ||
        titleAm.includes(query);
      const matchesCategory = selectedCategory === 'All' || pkg.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortBy === 'priceEtb') {
        valA = a.priceEtb || (a.priceUsd || 0) * rate;
        valB = b.priceEtb || (b.priceUsd || 0) * rate;
      } else if (sortBy === 'duration') {
        valA = a.durationDays || 0;
        valB = b.durationDays || 0;
      } else {
        valA = a.whatsappClicks || 0;
        valB = b.whatsappClicks || 0;
      }
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

  const totalPages = Math.ceil(filteredPackages.length / pageSize) || 1;
  const paginatedPackages = filteredPackages.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C8102E]"></div>
      <span className="ml-2 text-sm text-[#718096]">Loading packages...</span>
    </div>;
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#111827]">Umrah & Hajj Package Manager</h2>
          <p className="text-xs text-[#718096] mt-0.5">Manage pricing in ETB (primary), inclusions, departure dates, and WhatsApp clicks.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-[#2D3748] font-bold text-xs hover:bg-[#F9FAFB] transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => navigate('/packages/new')} className="px-5 py-2.5 rounded-lg bg-[#2D7D6B] hover:bg-[#236355] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer">
            <Plus className="w-4 h-4 text-white" /> Create New Package
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-[#718096] absolute left-3.5 top-3" />
            <input type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} placeholder="Search packages by title..." className="w-full pl-10 pr-3.5 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]" />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-[#718096]" />
            <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }} className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]">
              <option value="All">All Categories</option>
              <option value="Economy">Economy</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
              <option value="VIP">VIP</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[#718096] font-medium">Sort by:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-2.5 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]">
              <option value="clicks">WhatsApp Clicks</option>
              <option value="priceEtb">Price (ETB)</option>
              <option value="duration">Duration (Days)</option>
            </select>
            <button type="button" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="px-2.5 py-2 rounded-lg border border-[#E2E8F0] text-xs font-bold text-[#2D3748] hover:bg-[#F9FAFB] cursor-pointer" title="Toggle Sort Order">{sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}</button>
          </div>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="px-2.5 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]">
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] text-[#111827] font-bold border-b border-[#E2E8F0]">
              <tr>
                <th className="p-3.5 pl-5">Package</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Price (ETB)</th>
                <th className="p-3.5">Discounts</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">WhatsApp Clicks</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right pr-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] font-medium text-[#2D3748]">
              {paginatedPackages.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#718096]">
                    {packagesArray.length === 0 ? 'No packages found. Create your first package!' : 'No packages match the current search or filter criteria.'}
                  </td>
                </tr>
              ) : (
                paginatedPackages.map((pkg) => {
                  const titleEn = pkg.titleEn || 'Untitled Package';
                  const category = pkg.category || 'Uncategorized';
                  const isActive = pkg.isActive !== undefined ? pkg.isActive : true;
                  const priceUsdVal = pkg.priceUsd || 0;
                  const priceEtbVal = pkg.priceEtb || Math.round(priceUsdVal * rate);
                  const hasRange = pkg.priceType === 'range' || (pkg.priceUsdMax && pkg.priceUsdMax > priceUsdVal);
                  const hasDiscounts = pkg.discounts && pkg.discounts.length > 0;

                  let priceDisplay = `${priceEtbVal.toLocaleString()} ETB`;
                  if (hasRange) {
                    const maxEtb = pkg.priceEtbMax || Math.round((pkg.priceUsdMax || priceUsdVal) * rate);
                    priceDisplay = `${priceEtbVal.toLocaleString()} - ${maxEtb.toLocaleString()} ETB`;
                  }

                  return (
                    <tr key={pkg.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-3">
                          {pkg.imageUrl ? (
                            <img src={getFullImageUrl(pkg.imageUrl)} alt={titleEn} loading="lazy" className="w-14 h-11 object-cover rounded-lg border border-[#E2E8F0] shrink-0 bg-slate-100" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div className="w-14 h-11 flex items-center justify-center bg-slate-100 rounded-lg border border-[#E2E8F0] shrink-0">
                              <PackageIcon className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-[#111827] text-sm truncate max-w-xs">{titleEn}</p>
                            <p className="text-[11px] text-[#718096] font-normal truncate">{pkg.inclusions?.[0] || 'Full Package'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] text-white ${category === 'Premium' || category === 'VIP' ? 'bg-[#111827]' : 'bg-[#2D7D6B]'}`}>{category}</span>
                      </td>

                      <td className="p-3.5 font-bold text-[#2D7D6B] text-sm">
                        {priceDisplay}
                      </td>

                      <td className="p-3.5">
                        {hasDiscounts && pkg.discounts ? (
                          <div className="flex flex-wrap gap-1">
                            {pkg.discounts.filter(d => d.isActive !== false).map((d, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold" title={d.description}>
                                {d.label}: {d.type === 'percentage' ? `${d.value}%` : `$${d.value}`}
                                {d.minPersons && ` (${d.minPersons}+)`}
                                {d.ageGroup && ` (${d.ageGroup})`}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#718096] text-[10px]">—</span>
                        )}
                      </td>

                      <td className="p-3.5 text-[#2D3748]">{pkg.durationDays || 0} Days</td>

                      <td className="p-3.5">
                        <div className="inline-flex items-center gap-1.5 font-bold text-[#2D7D6B] bg-[#2D7D6B]/10 px-3 py-1 rounded-lg border border-[#2D7D6B]/20">
                          <MessageSquare className="w-3.5 h-3.5 text-[#2D7D6B]" />
                          <span>{pkg.whatsappClicks || 0}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white ${isActive ? 'bg-emerald-600' : 'bg-[#C8102E]'}`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => navigate(`/packages/${pkg.id}/edit`)} className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F9FAFB] text-[#111827] transition-colors cursor-pointer" title="Edit Package"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleToggleStatus(pkg)} className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F9FAFB] text-amber-600 transition-colors cursor-pointer" title={isActive ? 'Set Inactive' : 'Set Active'}><Archive className="w-4 h-4" /></button>
                          <button onClick={() => setSelectedPackageForDelete(pkg)} className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-rose-50 text-[#C8102E] transition-colors cursor-pointer" title="Delete Package"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredPackages.length} pageSize={pageSize} onPageChange={(p) => setCurrentPage(p)} />
      </div>

      <ConfirmModal
        isOpen={!!selectedPackageForDelete}
        title="Delete Package Permanently?"
        message={`Are you sure you want to delete "${selectedPackageForDelete?.titleEn || 'this package'}"? This action cannot be undone.`}
        confirmLabel="Delete Package"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setSelectedPackageForDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};