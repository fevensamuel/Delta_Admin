import React, { useEffect, useState } from 'react';
import { Inquiry, InquiryStatus } from '../../types';
import {
  getInquiriesApi,
  updateInquiryStatusApi,
  deleteInquiryApi,
  bulkUpdateInquiriesApi
} from '../../api/inquiries';
import { InquiryDetailModal } from '../../components/modals/InquiryDetailModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { RoleGuard } from '../../components/common/RoleGuard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Mail,
  Search,
  Filter,
  Eye,
  Trash2,
  Phone,
  CheckCircle,
  Clock,
  CheckCheck
} from 'lucide-react';

export const InquiryManager: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modals
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Multi select for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Confirm Delete
  const [inquiryToDelete, setInquiryToDelete] = useState<Inquiry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    setIsLoading(true);
    try {
      const data = await getInquiriesApi();
      setInquiries(data);
    } catch {
      showToast('error', 'Failed to load website inquiries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: InquiryStatus, notes?: string) => {
    try {
      await updateInquiryStatusApi(id, status, notes);
      loadInquiries();
    } catch {
      showToast('error', 'Failed to update status');
    }
  };

  const handleDeleteSingle = async () => {
    if (!inquiryToDelete) return;
    setIsDeleting(true);
    try {
      await deleteInquiryApi(inquiryToDelete.id);
      showToast('success', 'Inquiry deleted');
      setInquiryToDelete(null);
      loadInquiries();
    } catch {
      showToast('error', 'Failed to delete inquiry');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkStatusChange = async (status: InquiryStatus) => {
    if (selectedIds.length === 0) return;
    try {
      await bulkUpdateInquiriesApi(selectedIds, status);
      showToast('success', `Updated ${selectedIds.length} inquiries to ${status}`);
      setSelectedIds([]);
      loadInquiries();
    } catch {
      showToast('error', 'Failed to perform bulk update');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedInquiries.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const matchesSearch =
      inq.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.phone.includes(searchTerm) ||
      inq.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || inq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredInquiries.length / pageSize) || 1;
  const paginatedInquiries = filteredInquiries.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isLoading) {
    return <LoadingSpinner text="Loading Customer Inquiries..." />;
  }

  return (
    <RoleGuard module="inquiries" action="view">
      <div className="space-y-6 pb-12 animate-in fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Website Customer Inquiries</h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage web form messages, custom package requests, and follow-ups.</p>
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
                placeholder="Search by name, email, phone or subject..."
                className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1A5B4B]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              {(['All', 'New', 'Contacted', 'Resolved'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === st
                      ? 'bg-[#C8102E] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Action Controls */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <span className="text-xs font-bold text-emerald-900">{selectedIds.length} Selected</span>
              <button
                onClick={() => handleBulkStatusChange('Contacted')}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
              >
                Mark Contacted
              </button>
              <button
                onClick={() => handleBulkStatusChange('Resolved')}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Mark Resolved
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
                      checked={selectedIds.length > 0 && selectedIds.length === paginatedInquiries.length}
                      className="w-4 h-4 rounded text-[#1A5B4B]"
                    />
                  </th>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Contact Details</th>
                  <th className="p-3.5">Subject</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Date Received</th>
                  <th className="p-3.5 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {paginatedInquiries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No customer inquiries found.
                    </td>
                  </tr>
                ) : (
                  paginatedInquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 pl-5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(inq.id)}
                          onChange={() =>
                            setSelectedIds((prev) =>
                              prev.includes(inq.id) ? prev.filter((i) => i !== inq.id) : [...prev, inq.id]
                            )
                          }
                          className="w-4 h-4 rounded text-[#1A5B4B]"
                        />
                      </td>

                      <td className="p-3.5 font-bold text-slate-900 text-sm">
                        {inq.fullName}
                      </td>

                      <td className="p-3.5 space-y-0.5">
                        <div className="text-slate-700 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-600" /> {inq.phone}
                        </div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1">
                          <Mail className="w-3 h-3 text-sky-600" /> {inq.email}
                        </div>
                      </td>

                      <td className="p-3.5 max-w-xs truncate font-semibold text-slate-800">
                        {inq.subject}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            inq.status === 'New'
                              ? 'bg-yellow-100 text-yellow-800'
                              : inq.status === 'Contacted'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {inq.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-500">
                        {inq.dateReceived}
                      </td>

                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedInquiry(inq);
                              setIsDetailOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                            title="View Full Inquiry"
                          >
                            <Eye className="w-4 h-4 text-[#1A5B4B]" />
                          </button>

                          {hasPermission('inquiries', 'delete') && (
                            <button
                              onClick={() => setInquiryToDelete(inq)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 transition-colors"
                              title="Delete Inquiry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing {filteredInquiries.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
              {Math.min(currentPage * pageSize, filteredInquiries.length)} of {filteredInquiries.length} inquiries
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

        {/* Detail Modal */}
        <InquiryDetailModal
          inquiry={selectedInquiry}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedInquiry(null);
          }}
          onUpdateStatus={handleUpdateStatus}
        />

        {/* Confirm Delete */}
        <ConfirmModal
          isOpen={!!inquiryToDelete}
          title="Delete Customer Inquiry?"
          message={`Are you sure you want to delete inquiry from "${inquiryToDelete?.fullName}"?`}
          confirmLabel="Delete Inquiry"
          onConfirm={handleDeleteSingle}
          onCancel={() => setInquiryToDelete(null)}
          isLoading={isDeleting}
        />
      </div>
    </RoleGuard>
  );
};
