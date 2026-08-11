import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from '../../types';
import { getPackagesApi, deletePackageApi, updatePackageApi } from '../../api/packages';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { PackageSkeleton } from '../../components/common/PackageSkeleton';
import { Pagination } from '../../components/common/Pagination';
import { PackagePersonsTable } from '../../components/packages/PackagePersonsTable';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import { Plus, Search, Filter, Edit, Trash2, Archive, MessageSquare, Package as PackageIcon, Users } from 'lucide-react';
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

  const [activeTab, setActiveTab] = useState<'catalog' | 'persons'>('catalog');
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    }
  };

  const handleArchive = async (pkg: Package) => {
    try {
      const newStatus = pkg.status === 'Archived' ? 'Active' : 'Archived';
      const newIsActive = pkg.status === 'Archived' ? true : false;
      await updatePackageApi(pkg.id, { 
        status: newStatus,
        isActive: newIsActive
      });
      showToast('success', `Package "${pkg.titleEn}" status set to ${newStatus}`);
      loadPackages();
    } catch {
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
      loadPackages();
    } catch {
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
        valA = a.priceEtb || (a.priceUsd || a.price || 0) * rate;
        valB = b.priceEtb || (b.priceUsd || b.price || 0) * rate;
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

        <button
          onClick={() => navigate('/packages/new')}
          className="px-5 py-2.5 rounded-lg bg-[#2D7D6B] hover:bg-[#236355] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" /> Create New Package
        </button>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`py-3 px-5 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'catalog'
              ? 'border-[#2D7D6B] text-[#2D7D6B] bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PackageIcon className="w-4 h-4" /> Package Catalog ({packagesArray.length})
        </button>
        <button
          onClick={() => setActiveTab('persons')}
          className={`py-3 px-5 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'persons'
              ? 'border-[#2D7D6B] text-[#2D7D6B] bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-[#C9A84C]" /> Persons on Packages / Subscriptions
        </button>
      </div>

      {activeTab === 'persons' ? (
        <PackagePersonsTable />
      ) : (
        <>
          <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-[#718096] absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search packages by title..."
                  className="w-full pl-10 pr-3.5 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-[#718096]" />
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]"
                >
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
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]"
                >
                  <option value="clicks">WhatsApp Clicks</option>
                  <option value="priceEtb">Price (ETB)</option>
                  <option value="duration">Duration (Days)</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-2.5 py-2 rounded-lg border border-[#E2E8F0] text-xs font-bold text-[#2D3748] hover:bg-[#F9FAFB] cursor-pointer"
                  title="Toggle Sort Order"
                >
                  {sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
                </button>
              </div>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2.5 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs overflow-hidden">
            {isLoading ? (
              <PackageSkeleton />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F9FAFB] text-[#111827] font-bold border-b border-[#E2E8F0]">
                      <tr>
                        <th className="p-3.5 pl-5">Package</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Price (ETB) <span className="text-[10px] text-emerald-600 font-bold">(Primary)</span></th>
                        <th className="p-3.5">Price (USD) <span className="text-[10px] text-[#718096] font-normal">(Auto)</span></th>
                        <th className="p-3.5">Price (SAR) <span className="text-[10px] text-[#718096] font-normal">(Auto)</span></th>
                        <th className="p-3.5">Duration</th>
                        <th className="p-3.5">WhatsApp Clicks</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right pr-5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] font-medium text-[#2D3748]">
                      {paginatedPackages.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-[#718096]">
                            {packagesArray.length === 0 ? 'No packages found. Create your first package!' : 'No packages match the current search or filter criteria.'}
                          </td>
                        </tr>
                      ) : (
                        paginatedPackages.map((pkg) => {
                          const titleEn = pkg.titleEn || 'Untitled Package';
                          const category = pkg.category || 'Uncategorized';
                          const status = pkg.status || (pkg.isActive ? 'Active' : 'Inactive');
                          const isActive = pkg.isActive !== undefined ? pkg.isActive : status === 'Active';
                          
                          const priceUsdVal = pkg.priceUsd || pkg.price || 0;
                          const priceEtbVal = pkg.priceEtb || Math.round(priceUsdVal * rate);
                          const autoUsdVal = rate > 0 ? (priceEtbVal / rate).toFixed(2) : priceUsdVal.toFixed(2);
                          const priceSarVal = Math.round(priceUsdVal * 3.75);

                          return (
                            <tr key={pkg.id} className="hover:bg-[#F9FAFB] transition-colors">
                              <td className="p-3.5 pl-5">
                                <div className="flex items-center gap-3">
                                  {pkg.imageUrl ? (
                                    <img
                                      src={getFullImageUrl(pkg.imageUrl)}
                                      alt={titleEn}
                                      loading="lazy"
                                      className="w-14 h-11 object-cover rounded-lg border border-[#E2E8F0] shrink-0 bg-slate-100"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-14 h-11 flex items-center justify-center bg-slate-100 rounded-lg border border-[#E2E8F0] shrink-0">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                        <circle cx="8.5" cy="8.5" r="1.5"/>
                                        <polyline points="21 15 16 10 5 21"/>
                                      </svg>
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-bold text-[#111827] text-sm truncate max-w-xs">{titleEn}</p>
                                    <p className="text-[11px] text-[#718096] font-normal truncate">{pkg.inclusions?.[0] || 'Full Package'}</p>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3.5">
                                <span
                                  className={`px-2.5 py-1 rounded-full font-bold text-[11px] text-white ${
                                    category === 'Premium' || category === 'VIP'
                                      ? 'bg-[#111827]'
                                      : 'bg-[#2D7D6B]'
                                  }`}
                                >
                                  {category}
                                </span>
                              </td>

                              <td className="p-3.5 font-bold text-[#2D7D6B] text-sm">
                                {priceEtbVal.toLocaleString()} ETB
                              </td>

                              <td className="p-3.5 font-semibold text-[#718096] text-xs">
                                ${autoUsdVal}
                              </td>

                              <td className="p-3.5 font-semibold text-[#718096] text-xs">
                                {priceSarVal.toLocaleString()} SAR
                              </td>

                              <td className="p-3.5 text-[#2D3748]">
                                {pkg.durationDays || 0} Days
                              </td>

                              <td className="p-3.5">
                                <div className="inline-flex items-center gap-1.5 font-bold text-[#2D7D6B] bg-[#2D7D6B]/10 px-3 py-1 rounded-lg border border-[#2D7D6B]/20">
                                  <MessageSquare className="w-3.5 h-3.5 text-[#2D7D6B]" />
                                  <span>{pkg.whatsappClicks || 0}</span>
                                </div>
                              </td>

                              <td className="p-3.5">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white ${
                                    isActive
                                      ? 'bg-emerald-600'
                                      : 'bg-[#C8102E]'
                                  }`}
                                >
                                  {isActive ? 'Active' : 'Archived'}
                                </span>
                              </td>

                              <td className="p-3.5 pr-5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => navigate(`/packages/${pkg.id}/edit`)}
                                    className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F9FAFB] text-[#111827] transition-colors cursor-pointer"
                                    title="Edit Package"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => handleArchive(pkg)}
                                    className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F9FAFB] text-amber-600 transition-colors cursor-pointer"
                                    title={isActive ? 'Archive' : 'Unarchive'}
                                  >
                                    <Archive className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => setSelectedPackageForDelete(pkg)}
                                    className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-rose-50 text-[#C8102E] transition-colors cursor-pointer"
                                    title="Delete Package"
                                  >
                                    <Trash2 className="w-4 h-4" />
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

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredPackages.length}
                  pageSize={pageSize}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              </>
            )}
          </div>
        </>
      )}

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