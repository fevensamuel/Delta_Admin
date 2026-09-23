import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, CustomerCategory } from '../../types';
import { getPackagesApi, deletePackageApi, updatePackageApi } from '../../api/packages';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Pagination } from '../../components/common/Pagination';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';

import { 
  Plus, Search, Filter, Edit, Trash2, Archive, MessageSquare, 
  Package as PackageIcon, RefreshCw, Users, UserPlus, User, X
} from 'lucide-react';
import { useExchangeRateStore } from '../../store/useExchangeRateStore';

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

const CATEGORY_OPTIONS: CustomerCategory[] = ['New', 'Customer', 'Regular Customer'];

const getCategoryColor = (category?: string): string => {
  switch (category) {
    case 'New':
      return 'bg-yellow-100 text-yellow-800';
    case 'Customer':
      return 'bg-blue-100 text-blue-800';
    case 'Regular Customer':
      return 'bg-emerald-100 text-emerald-800';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export const PackageList: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { rate, fetchRate } = useExchangeRateStore();

  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'persons'>('catalog');

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'priceEtb' | 'duration' | 'clicks'>('clicks');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedPackageForDelete, setSelectedPackageForDelete] = useState<Package | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Persons tab state
  const [personSearchTerm, setPersonSearchTerm] = useState('');
  const [selectedPackageFilter, setSelectedPackageFilter] = useState<string>('All');
  const [personCategoryFilter, setPersonCategoryFilter] = useState<'All' | CustomerCategory>('All');
  const [personsCurrentPage, setPersonsCurrentPage] = useState(1);
  const personsPageSize = 10;

  // Add Person Modal state
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [selectedPackageForPerson, setSelectedPackageForPerson] = useState<Package | null>(null);
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [newPerson, setNewPerson] = useState({
    name: '',
    phone: '',
    gender: '' as 'Male' | 'Female' | 'Child' | '',
    customerCategory: 'New' as CustomerCategory,
  });

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

  const handleAddPersonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackageForPerson) return;
    if (!newPerson.name.trim()) {
      showToast('error', 'Name is required');
      return;
    }
    if (!newPerson.phone.trim()) {
      showToast('error', 'Phone number is required');
      return;
    }

    setIsAddingPerson(true);
    try {
      const updatedPersons = [...(selectedPackageForPerson.persons || []), {
        id: `person-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: newPerson.name.trim(),
        phone: newPerson.phone.trim(),
        gender: newPerson.gender || undefined,
        customerCategory: newPerson.customerCategory || 'New',
      }];
      
      await updatePackageApi(selectedPackageForPerson.id, { persons: updatedPersons });
      showToast('success', `Person "${newPerson.name}" added successfully`);
      setShowAddPersonModal(false);
      setNewPerson({ name: '', phone: '', gender: '', customerCategory: 'New' });
      await loadPackages();
    } catch (error) {
      console.error('Error adding person:', error);
      showToast('error', 'Failed to add person');
    } finally {
      setIsAddingPerson(false);
    }
  };

  const handleRemovePerson = async (person: any, packageId: string) => {
    if (!window.confirm(`Remove "${person.name}" from this package?`)) return;
    
    try {
      const pkg = packagesArray.find(p => p.id === packageId);
      if (!pkg) return;
      
      const updatedPersons = (pkg.persons || []).filter((p: any) => p.id !== person.id);
      await updatePackageApi(packageId, { persons: updatedPersons });
      showToast('success', `Person "${person.name}" removed successfully`);
      await loadPackages();
    } catch (error) {
      console.error('Error removing person:', error);
      showToast('error', 'Failed to remove person');
    }
  };

  const handleQuickCategoryChange = async (person: any, packageId: string, newCategory: CustomerCategory) => {
    try {
      const pkg = packagesArray.find(p => p.id === packageId);
      if (!pkg) return;
      
      const updatedPersons = (pkg.persons || []).map((p: any) => 
        p.id === person.id ? { ...p, customerCategory: newCategory } : p
      );
      await updatePackageApi(packageId, { persons: updatedPersons });
      showToast('success', `Category updated to "${newCategory}"`);
      await loadPackages();
    } catch (error) {
      console.error('Error updating category:', error);
      showToast('error', 'Failed to update category');
    }
  };

  const packagesArray = Array.isArray(packages) ? packages : [];

  const getAllPersons = () => {
    const allPersons: any[] = [];
    packagesArray.forEach(pkg => {
      if (pkg.persons && Array.isArray(pkg.persons)) {
        pkg.persons.forEach((person: any) => {
          allPersons.push({
            ...person,
            packageTitle: pkg.titleEn,
            packageId: pkg.id,
            packageCategory: pkg.category
          });
        });
      }
    });
    return allPersons;
  };

  const allPersons = getAllPersons();

  const filteredPersons = allPersons.filter((person) => {
    const matchesSearch = 
      person.name?.toLowerCase().includes(personSearchTerm.toLowerCase()) ||
      person.phone?.includes(personSearchTerm);
    const matchesPackage = selectedPackageFilter === 'All' || person.packageId === selectedPackageFilter;
    const matchesCategory =
      personCategoryFilter === 'All' ||
      (person.customerCategory || 'New') === personCategoryFilter;
    return matchesSearch && matchesPackage && matchesCategory;
  });

  const personsTotalPages = Math.ceil(filteredPersons.length / personsPageSize) || 1;
  const paginatedPersons = filteredPersons.slice(
    (personsCurrentPage - 1) * personsPageSize, 
    personsCurrentPage * personsPageSize
  );

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
    return <LoadingSpinner text="Loading Packages..." />;
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

      {/* Tabs */}
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
          <Users className="w-4 h-4" /> Persons on Package ({allPersons.length})
        </button>
      </div>

      {/* Package Catalog Tab */}
      {activeTab === 'catalog' && (
        <>
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
        </>
      )}

      {/* Persons on Package Tab */}
      {activeTab === 'persons' && (
        <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-[#718096] absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={personSearchTerm}
                  onChange={(e) => { setPersonSearchTerm(e.target.value); setPersonsCurrentPage(1); }}
                  placeholder="Search persons by name or phone..."
                  className="w-full pl-10 pr-3.5 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-[#718096]" />
                <select
                  value={selectedPackageFilter}
                  onChange={(e) => { setSelectedPackageFilter(e.target.value); setPersonsCurrentPage(1); }}
                  className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]"
                >
                  <option value="All">All Packages ({allPersons.length})</option>
                  {packagesArray.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.titleEn} ({pkg.persons?.length || 0})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={personCategoryFilter}
                  onChange={(e) => { setPersonCategoryFilter(e.target.value as any); setPersonsCurrentPage(1); }}
                  className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]"
                >
                  <option value="All">All Categories</option>
                  <option value="New">New</option>
                  <option value="Customer">Customer</option>
                  <option value="Regular Customer">Regular Customer</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedPackageForPerson?.id || ''}
                onChange={(e) => {
                  const pkg = packagesArray.find(p => p.id === e.target.value);
                  setSelectedPackageForPerson(pkg || null);
                }}
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]"
              >
                <option value="">Select Package</option>
                {packagesArray.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.titleEn} ({pkg.persons?.length || 0} persons)
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (!selectedPackageForPerson) {
                    showToast('error', 'Please select a package first');
                    return;
                  }
                  setShowAddPersonModal(true);
                }}
                className="px-4 py-2 rounded-lg bg-[#2D7D6B] hover:bg-[#236355] text-white font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" /> Add Person
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] text-[#111827] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-3.5 pl-5">Name</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Gender</th>
                  <th className="p-3.5">Customer Category</th>
                  <th className="p-3.5">Package</th>
                  <th className="p-3.5 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] font-medium text-[#2D3748]">
                {paginatedPersons.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#718096]">
                      {allPersons.length === 0 
                        ? 'No persons found. Select a package and click "Add Person".' 
                        : 'No persons match the current search or filter criteria.'}
                    </td>
                  </tr>
                ) : (
                  paginatedPersons.map((person, index) => (
                    <tr key={person.id || index} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#2D7D6B]/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-[#2D7D6B]" />
                          </div>
                          <span className="font-bold text-[#111827]">{person.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-[#718096]">{person.phone || '—'}</td>
                      <td className="p-3.5 text-[#718096]">{person.gender || '—'}</td>
                      <td className="p-3.5">
                        <select
                          value={person.customerCategory || 'New'}
                          onChange={(e) => handleQuickCategoryChange(person, person.packageId, e.target.value as CustomerCategory)}
                          className={`px-2 py-1 rounded-full text-[10px] font-bold border-0 cursor-pointer ${getCategoryColor(person.customerCategory)}`}
                        >
                          {CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => navigate(`/packages/${person.packageId}/edit`)}
                          className="text-[#2D7D6B] hover:underline font-semibold"
                        >
                          {person.packageTitle || 'Unknown'}
                        </button>
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/packages/${person.packageId}/edit`)}
                            className="px-3 py-1.5 rounded-lg bg-[#2D7D6B] hover:bg-[#236355] text-white text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" /> View Package
                          </button>
                          <button
                            onClick={() => handleRemovePerson(person, person.packageId)}
                            className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-rose-50 text-[#C8102E] transition-colors"
                            title="Remove Person"
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

          {filteredPersons.length > 0 && (
            <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#718096]">
              <span>
                Showing {((personsCurrentPage - 1) * personsPageSize) + 1} to{' '}
                {Math.min(personsCurrentPage * personsPageSize, filteredPersons.length)} of {filteredPersons.length} persons
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPersonsCurrentPage(p => Math.max(1, p - 1))}
                  disabled={personsCurrentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] font-semibold bg-white hover:bg-[#F9FAFB] disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-2 font-bold text-[#111827]">
                  {personsCurrentPage} / {personsTotalPages}
                </span>
                <button
                  onClick={() => setPersonsCurrentPage(p => Math.min(personsTotalPages, p + 1))}
                  disabled={personsCurrentPage === personsTotalPages}
                  className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] font-semibold bg-white hover:bg-[#F9FAFB] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Person Modal */}
      {showAddPersonModal && selectedPackageForPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#111827]">Add Person to {selectedPackageForPerson.titleEn}</h3>
              <button 
                onClick={() => {
                  setShowAddPersonModal(false);
                  setNewPerson({ name: '', phone: '', gender: '', customerCategory: 'New' });
                }} 
                className="text-[#718096] hover:text-[#111827]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddPersonSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newPerson.name}
                  onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={newPerson.phone}
                  onChange={(e) => setNewPerson({ ...newPerson, phone: e.target.value })}
                  placeholder="+251 91 123 4567"
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
                />
                <p className="text-[9px] text-[#718096] mt-1">Required for SMS campaigns</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1">Customer Category *</label>
                <select
                  value={newPerson.customerCategory}
                  onChange={(e) => setNewPerson({ ...newPerson, customerCategory: e.target.value as CustomerCategory })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1">Gender (Optional)</label>
                <select
                  value={newPerson.gender || ''}
                  onChange={(e) => setNewPerson({ ...newPerson, gender: e.target.value as 'Male' | 'Female' | 'Child' | '' })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Child">Child</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isAddingPerson}
                  className="flex-1 px-4 py-2 rounded-lg bg-[#2D7D6B] hover:bg-[#236355] text-white font-bold text-sm transition-colors disabled:opacity-50"
                >
                  {isAddingPerson ? 'Adding...' : 'Add Person'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPersonModal(false);
                    setNewPerson({ name: '', phone: '', gender: '', customerCategory: 'New' });
                  }}
                  className="px-4 py-2 rounded-lg border border-[#E2E8F0] text-[#718096] hover:bg-[#F9FAFB] transition-colors text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
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