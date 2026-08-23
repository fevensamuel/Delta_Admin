import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, PersonPrice } from '../../types';
import { getPackagesApi } from '../../api/packages';
import { useToast } from '../../context/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Search, Filter, User, Edit, Users, DollarSign, Calendar } from 'lucide-react';

export const PackagePersons: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('All');

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setIsLoading(true);
    try {
      const data = await getPackagesApi();
      setPackages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Error loading packages:', error);
      showToast('error', 'Failed to load packages');
      setPackages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getAllPersons = () => {
    const allPersons: (PersonPrice & { packageTitle: string; packageId: string; packageCategory: string })[] = [];
    packages.forEach(pkg => {
      if (pkg.persons && Array.isArray(pkg.persons)) {
        pkg.persons.forEach((person: PersonPrice) => {
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
      person.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.packageTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPackage = selectedPackageId === 'All' || person.packageId === selectedPackageId;
    return matchesSearch && matchesPackage;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(filteredPersons.length / pageSize) || 1;
  const paginatedPersons = filteredPersons.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isLoading) {
    return <LoadingSpinner text="Loading package persons..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-xl font-extrabold text-[#111827] flex items-center gap-2">
          <Users className="w-6 h-6 text-[#2D7D6B]" /> Persons on Packages
        </h2>
        <p className="text-xs text-[#718096] mt-0.5">
          View all person categories across packages
        </p>
      </div>

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
              placeholder="Search by category or package name..."
              className="w-full pl-10 pr-3.5 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-[#718096]" />
            <select
              value={selectedPackageId}
              onChange={(e) => {
                setSelectedPackageId(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]"
            >
              <option value="All">All Packages</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.titleEn}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-[#718096]">
            Total: <span className="font-bold text-[#111827]">{allPersons.length}</span> persons
          </span>
        </div>
        <button
          onClick={() => navigate('/packages')}
          className="px-4 py-2 rounded-lg bg-[#2D7D6B] hover:bg-[#236355] text-white font-bold text-xs transition-colors flex items-center gap-1.5"
        >
          <Edit className="w-4 h-4" /> Manage Packages
        </button>
      </div>

      {allPersons.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center text-blue-800">
          <Users className="w-12 h-12 mx-auto text-blue-400 mb-3" />
          <p className="font-bold">No Person Categories Found</p>
          <p className="text-xs mt-1">
            Person categories are added when creating packages.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] text-[#111827] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-3.5 pl-5">Category</th>
                  <th className="p-3.5">Price (USD)</th>
                  <th className="p-3.5">Price (ETB)</th>
                  <th className="p-3.5">Price (SAR)</th>
                  <th className="p-3.5">Age Range</th>
                  <th className="p-3.5">Package</th>
                  <th className="p-3.5 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] font-medium text-[#2D3748]">
                {paginatedPersons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#718096]">
                      No persons found
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
                          <div>
                            <span className="font-bold text-[#111827]">{person.label || 'Unnamed'}</span>
                            {person.isDefault && (
                              <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold">Default</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-[#111827]">${person.priceUsd?.toFixed(2) || '0'}</td>
                      <td className="p-3.5 font-bold text-[#2D7D6B]">{person.priceEtb?.toLocaleString() || '0'} ETB</td>
                      <td className="p-3.5 font-bold text-[#C9A84C]">{person.priceSar?.toLocaleString() || '0'} SAR</td>
                      <td className="p-3.5 text-[#718096]">
                        {person.minAge !== undefined && person.maxAge !== undefined 
                          ? `${person.minAge} - ${person.maxAge} yrs`
                          : person.minAge !== undefined 
                            ? `${person.minAge}+ yrs`
                            : 'All ages'}
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