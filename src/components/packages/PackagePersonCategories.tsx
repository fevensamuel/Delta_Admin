import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, PersonPrice } from '../../types';
import { User, Search, Filter, Edit, Users, DollarSign, Calendar } from 'lucide-react';

interface PackagePersonCategoriesProps {
  packages?: Package[];
  onRefresh?: () => void;
}

export const PackagePersonCategories: React.FC<PackagePersonCategoriesProps> = ({ packages = [], onRefresh }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('All');

  // Get all person categories from all packages
  const getAllPersonCategories = () => {
    const allCategories: (PersonPrice & { packageTitle: string; packageId: string; packageCategory: string })[] = [];
    packages.forEach(pkg => {
      if (pkg.persons && Array.isArray(pkg.persons) && pkg.priceType === 'perPerson') {
        pkg.persons.forEach((person: PersonPrice) => {
          allCategories.push({
            ...person,
            packageTitle: pkg.titleEn,
            packageId: pkg.id,
            packageCategory: pkg.category
          });
        });
      }
    });
    return allCategories;
  };

  const allCategories = getAllPersonCategories();

  // Filter categories
  const filteredCategories = allCategories.filter((category) => {
    const matchesSearch = 
      category.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.packageTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPackage = selectedPackageId === 'All' || category.packageId === selectedPackageId;
    return matchesSearch && matchesPackage;
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(filteredCategories.length / pageSize) || 1;
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Count categories per package
  const getCategoryCount = (packageId: string) => {
    return allCategories.filter(p => p.packageId === packageId).length;
  };

  const getPackagesWithPersons = () => {
    return packages.filter(pkg => pkg.persons && pkg.persons.length > 0 && pkg.priceType === 'perPerson');
  };

  if (packages.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center text-blue-800">
        <Users className="w-12 h-12 mx-auto text-blue-400 mb-3" />
        <p className="font-bold">No Person Categories Found</p>
        <p className="text-xs mt-1">
          Person categories are used for <strong>Per-Person Pricing</strong> packages. 
          Create a package with "Per Person" price type to add categories.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
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
              placeholder="Search by category label or package name..."
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
              <option value="All">All Packages ({allCategories.length} categories)</option>
              {getPackagesWithPersons().map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.titleEn} ({getCategoryCount(pkg.id)} categories)
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-[#718096]">
            Total: <span className="font-bold text-[#111827]">{allCategories.length}</span> person categories
          </span>
        </div>

        <button
          onClick={() => navigate('/packages')}
          className="px-4 py-2 rounded-lg bg-[#2D7D6B] hover:bg-[#236355] text-white font-bold text-xs transition-colors flex items-center gap-1.5"
        >
          <Edit className="w-4 h-4" /> Manage Packages
        </button>
      </div>

      {/* Table */}
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
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Package</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 text-right pr-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] font-medium text-[#2D3748]">
              {paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[#718096]">
                    {allCategories.length === 0 
                      ? 'No person categories found. Edit a package with Per-Person pricing to add categories.' 
                      : 'No categories match the current search or filter criteria.'}
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((category, index) => (
                  <tr key={category.id || index} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="p-3.5 pl-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#2D7D6B]/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-[#2D7D6B]" />
                        </div>
                        <div>
                          <span className="font-bold text-[#111827]">{category.label || 'Unnamed'}</span>
                          {category.isDefault && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold">Default</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-[#111827]">${category.priceUsd?.toFixed(2) || '0'}</td>
                    <td className="p-3.5 font-bold text-[#2D7D6B]">{category.priceEtb?.toLocaleString() || '0'} ETB</td>
                    <td className="p-3.5 font-bold text-[#C9A84C]">{category.priceSar?.toLocaleString() || '0'} SAR</td>
                    <td className="p-3.5 text-[#718096]">
                      {category.minAge !== undefined && category.maxAge !== undefined 
                        ? `${category.minAge} - ${category.maxAge} yrs`
                        : category.minAge !== undefined 
                          ? `${category.minAge}+ yrs`
                          : 'All ages'}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        category.isActive !== false 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {category.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => navigate(`/packages/${category.packageId}/edit`)}
                        className="text-[#2D7D6B] hover:underline font-semibold"
                      >
                        {category.packageTitle || 'Unknown'}
                      </button>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${
                        category.packageCategory === 'VIP' ? 'bg-yellow-600' :
                        category.packageCategory === 'Premium' ? 'bg-purple-600' :
                        category.packageCategory === 'Standard' ? 'bg-blue-600' :
                        'bg-green-600'
                      }`}>
                        {category.packageCategory || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <button
                        onClick={() => navigate(`/packages/${category.packageId}/edit`)}
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

        {/* Pagination */}
        {filteredCategories.length > 0 && (
          <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#718096]">
            <span>
              Showing {((currentPage - 1) * pageSize) + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredCategories.length)} of {filteredCategories.length} categories
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

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <p className="font-bold">💡 About Person Categories:</p>
        <ul className="list-disc list-inside space-y-1 text-xs mt-1">
          <li>Person categories are used for <strong>Per-Person Pricing</strong> packages</li>
          <li>Each category can have its own price (USD, ETB, SAR)</li>
          <li>Age ranges help categorize children, adults, and seniors</li>
          <li>Set one category as "Default" for the standard price</li>
          <li>Edit a package's per-person pricing to manage categories</li>
        </ul>
      </div>
    </div>
  );
};