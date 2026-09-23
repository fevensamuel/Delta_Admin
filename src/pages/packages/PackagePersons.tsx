import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, CustomerCategory } from '../../types';
import { getPackagesApi } from '../../api/packages';
import { useToast } from '../../context/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Search, Filter, User, Edit, Users, Phone, RefreshCw, MapPin, UserPlus } from 'lucide-react';

interface PackagePerson {
  id: string;
  name: string;
  phone: string;
  gender?: 'Male' | 'Female' | 'Child';
  customerCategory?: CustomerCategory;
}

const CATEGORY_OPTIONS: Array<'All' | CustomerCategory> = [
  'All',
  'New',
  'Customer',
  'Regular Customer',
];

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

export const PackagePersons: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | CustomerCategory>('All');

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setIsLoading(true);
    try {
      const data = await getPackagesApi();
      const packageArray = Array.isArray(data) ? data : [];
      setPackages(packageArray);
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
    showToast('success', 'Persons list refreshed');
  };

  const getAllPersons = () => {
    const allPersons: (PackagePerson & { packageTitle: string; packageId: string; packageCategory: string })[] = [];
    
    packages.forEach(pkg => {
      if (pkg.persons && Array.isArray(pkg.persons) && pkg.persons.length > 0) {
        pkg.persons.forEach((person: any) => {
          allPersons.push({
            id: person.id || `person-${Date.now()}-${Math.random()}`,
            name: person.name || 'Unnamed',
            phone: person.phone || '',
            gender: person.gender,
            customerCategory: person.customerCategory || 'New',
            packageTitle: pkg.titleEn || 'Unknown Package',
            packageId: pkg.id,
            packageCategory: pkg.category || 'Uncategorized'
          });
        });
      }
    });
    
    return allPersons;
  };

  const allPersons = getAllPersons();

  const filteredPersons = allPersons.filter((person) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      person.name?.toLowerCase().includes(searchLower) ||
      person.phone?.includes(searchTerm) ||
      person.packageTitle?.toLowerCase().includes(searchLower);
    const matchesPackage = selectedPackageId === 'All' || person.packageId === selectedPackageId;
    const matchesCategory =
      categoryFilter === 'All' ||
      (person.customerCategory || 'New') === categoryFilter;
    return matchesSearch && matchesPackage && matchesCategory;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(filteredPersons.length / pageSize) || 1;
  const paginatedPersons = filteredPersons.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedPackageId, categoryFilter]);

  if (isLoading) {
    return <LoadingSpinner text="Loading package persons..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#111827] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#2D7D6B]" /> Persons on Packages
          </h2>
          <p className="text-xs text-[#718096] mt-0.5">
            View all people added to packages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/packages')}
            className="px-4 py-2.5 rounded-lg bg-[#2D7D6B] hover:bg-[#236355] text-white font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" /> Add Person
          </button>
          <button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-[#2D3748] font-bold text-xs hover:bg-[#F9FAFB] transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-[#718096] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone, or package..."
              className="w-full pl-10 pr-3.5 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-[#718096]" />
            <select
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]"
            >
              <option value="All">All Packages ({allPersons.length})</option>
              {packages.map((pkg) => {
                const personCount = pkg.persons?.length || 0;
                return (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.titleEn} ({personCount} persons)
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="text-xs text-[#718096]">
          Total: <span className="font-bold text-[#111827]">{allPersons.length}</span> persons
        </div>
      </div>

      {allPersons.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center text-blue-800">
          <Users className="w-12 h-12 mx-auto text-blue-400 mb-3" />
          <p className="font-bold">No Persons Found</p>
          <p className="text-xs mt-1">
            No people have been added to any packages yet.
          </p>
          <p className="text-xs mt-1 text-blue-600">
            Go to <button onClick={() => navigate('/packages')} className="underline font-bold">Package Manager</button> and click "Add Person" on any package.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs overflow-hidden">
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
                      No persons found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedPersons.map((person) => (
                    <tr key={person.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#2D7D6B]/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-[#2D7D6B]" />
                          </div>
                          <span className="font-bold text-[#111827]">{person.name}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 text-[#718096]">
                          <Phone className="w-3 h-3" />
                          {person.phone || '—'}
                        </div>
                      </td>
                      <td className="p-3.5 text-[#718096]">
                        {person.gender || '—'}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getCategoryColor(person.customerCategory)}`}>
                          {person.customerCategory || 'New'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => navigate(`/packages/${person.packageId}/edit`)}
                          className="text-[#2D7D6B] hover:underline font-semibold flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" />
                          {person.packageTitle || 'Unknown'}
                        </button>
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <button
                          onClick={() => navigate(`/packages/${person.packageId}/edit`)}
                          className="px-3 py-1.5 rounded-lg bg-[#2D7D6B] hover:bg-[#236355] text-white text-xs font-bold transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Edit className="w-3 h-3" /> Edit Package
                        </button>
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
                Showing {((currentPage - 1) * pageSize) + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredPersons.length)} of {filteredPersons.length} persons
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] font-semibold bg-white hover:bg-[#F9FAFB] disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-2 font-bold text-[#111827]">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] font-semibold bg-white hover:bg-[#F9FAFB] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};