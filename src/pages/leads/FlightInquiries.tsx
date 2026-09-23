import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  getFlightInquiriesApi,
  createFlightInquiryApi,
  updateFlightInquiryApi,
  deleteFlightInquiryApi,
} from '../../api/flightInquiries';
import { FlightInquiry } from '../../types';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Plane,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  X,
  Save,
  Loader2,
  Phone,
  Mail,
} from 'lucide-react';

// ============================================================
// Dropdown option constants (match the public website)
// ============================================================

const FROM_OPTIONS = [
  'Addis Ababa (ADD)',
  'Other City',
];

const DESTINATION_OPTIONS = [
  'Jeddah (JED)',
  'Madinah (MED)',
  'Dubai (DXB)',
  'Istanbul (IST)',
];

const CABIN_CLASS_OPTIONS = [
  'Economy Class',
  'Business Class',
  'First Class',
];

// Airline partners — same list as the public website
// (id, name, code only — no flags, no logo images)
const AIRLINE_OPTIONS: Array<{ id: string; name: string; code: string }> = [
  { id: 'ethiopian', name: 'Ethiopian Airlines', code: 'ET' },
  { id: 'turkish', name: 'Turkish Airlines', code: 'TK' },
  { id: 'flynas', name: 'Flynas', code: 'XY' },
  { id: 'emirates', name: 'Emirates', code: 'EK' },
  { id: 'etihad', name: 'Etihad Airways', code: 'EY' },
  { id: 'flydubai', name: 'Flydubai', code: 'FZ' },
  { id: 'qatar', name: 'Qatar Airways', code: 'QR' },
];

// ============================================================

type TripTypeFilter = 'All' | 'One Way' | 'Round Trip';
type StatusFilter = 'All' | 'New' | 'Booked' | 'Cancelled';

const STATUS_OPTIONS: Array<FlightInquiry['status']> = ['New', 'Booked', 'Cancelled'];

const blankForm = {
  fullName: '',
  phone: '',
  email: '',
  fromCity: FROM_OPTIONS[0],
  destination: '',
  departureDate: '',
  returnDate: '',
  passengers: 1,
  cabinClass: CABIN_CLASS_OPTIONS[0],
  preferredAirline: '',
  notes: '',
  status: 'New',
};

export const FlightInquiries: React.FC = () => {
  const { showToast } = useToast();

  const [inquiries, setInquiries] = useState<FlightInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [tripTypeFilter, setTripTypeFilter] = useState<TripTypeFilter>('All');

  // Add/Edit modal state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ ...blankForm });

  // Delete state
  const [inquiryToDelete, setInquiryToDelete] = useState<FlightInquiry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    setIsLoading(true);
    try {
      const data = await getFlightInquiriesApi();
      setInquiries(data);
    } catch {
      showToast('error', 'Failed to load flight inquiries');
      setInquiries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        inq.fullName?.toLowerCase().includes(term) ||
        inq.phone?.toLowerCase().includes(term) ||
        inq.email?.toLowerCase().includes(term) ||
        inq.destination?.toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'All' || inq.status === statusFilter;

      const matchesTripType =
        tripTypeFilter === 'All' ||
        (tripTypeFilter === 'One Way' && !inq.returnDate) ||
        (tripTypeFilter === 'Round Trip' && !!inq.returnDate);

      return matchesSearch && matchesStatus && matchesTripType;
    });
  }, [inquiries, searchTerm, statusFilter, tripTypeFilter]);

  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...blankForm });
    setShowForm(true);
  };

  const openEditForm = (inq: FlightInquiry) => {
    setEditingId(inq.id);
    setForm({
      fullName: inq.fullName || '',
      phone: inq.phone || '',
      email: inq.email || '',
      fromCity: inq.fromCity || FROM_OPTIONS[0],
      destination: inq.destination || '',
      departureDate: inq.departureDate || '',
      returnDate: inq.returnDate || '',
      passengers: inq.passengers || 1,
      cabinClass: inq.cabinClass || CABIN_CLASS_OPTIONS[0],
      preferredAirline: inq.preferredAirline || '',
      notes: inq.notes || '',
      status: inq.status || 'New',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...blankForm });
  };

  const handleSubmit = async () => {
    if (!form.fullName.trim() || !form.phone.trim()) {
      showToast('error', 'Name and phone are required');
      return;
    }
    if (!form.destination) {
      showToast('error', 'Please select a destination');
      return;
    }
    if (!form.preferredAirline) {
      showToast('error', 'Please select an airline');
      return;
    }

    const computedTripType = form.returnDate ? 'Round Trip' : 'One Way';

    setIsSubmitting(true);
    try {
      const payload: Partial<FlightInquiry> = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        fromCity: form.fromCity,
        destination: form.destination,
        departureDate: form.departureDate,
        returnDate: form.returnDate,
        tripType: computedTripType,
        passengers: Number(form.passengers) || 1,
        cabinClass: form.cabinClass,
        preferredAirline: form.preferredAirline,
        notes: form.notes,
        status: form.status as FlightInquiry['status'],
      };

      if (editingId) {
        const updated = await updateFlightInquiryApi(editingId, payload);
        setInquiries((prev) => prev.map((i) => (i.id === editingId ? updated : i)));
        showToast('success', 'Flight inquiry updated');
      } else {
        const created = await createFlightInquiryApi(payload);
        setInquiries((prev) => [created, ...prev]);
        showToast('success', 'Flight inquiry added');
      }
      closeForm();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save flight inquiry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatus = async (inq: FlightInquiry, status: string) => {
    try {
      const updated = await updateFlightInquiryApi(inq.id, { status });
      setInquiries((prev) => prev.map((i) => (i.id === inq.id ? updated : i)));
      showToast('success', `Marked as ${status}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!inquiryToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFlightInquiryApi(inquiryToDelete.id);
      setInquiries((prev) => prev.filter((i) => i.id !== inquiryToDelete.id));
      showToast('success', 'Flight inquiry deleted');
      setInquiryToDelete(null);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete flight inquiry');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading Flight Inquiries..." />;
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Flight Quote Inquiries</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track WhatsApp flight quote requests from the website and add entries manually.
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-xs shadow-md flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Flight Inquiry
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone, email, destination..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1A5B4B]"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          {(['All', 'New', 'Booked', 'Cancelled'] as const).map((st) => (
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

        {/* Trip Type filter */}
        <div className="flex items-center gap-2">
          <Plane className="w-4 h-4 text-slate-500" />
          {(['All', 'One Way', 'Round Trip'] as const).map((tt) => (
            <button
              key={tt}
              onClick={() => setTripTypeFilter(tt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tripTypeFilter === tt
                  ? 'bg-[#1A5B4B] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tt}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5 pl-5">Customer</th>
                <th className="p-3.5">Contact</th>
                <th className="p-3.5">Route</th>
                <th className="p-3.5">Departure</th>
                <th className="p-3.5">Return</th>
                <th className="p-3.5">Trip</th>
                <th className="p-3.5">Pax</th>
                <th className="p-3.5">Cabin</th>
                <th className="p-3.5">Airline</th>
                <th className="p-3.5">Notes</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right pr-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-500">
                    <Plane className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    No flight inquiries found.
                  </td>
                </tr>
              ) : (
                filteredInquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 pl-5 font-bold text-slate-900 text-sm">
                      {inq.fullName}
                    </td>
                    <td className="p-3.5 space-y-0.5">
                      <div className="text-slate-700 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-600" /> {inq.phone}
                      </div>
                      {inq.email && (
                        <div className="text-slate-500 text-[11px] flex items-center gap-1">
                          <Mail className="w-3 h-3 text-sky-600" /> {inq.email}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-700">
                      {inq.fromCity || '—'} → {inq.destination || '—'}
                    </td>
                    <td className="p-3.5 text-slate-600">{inq.departureDate || '—'}</td>
                    <td className="p-3.5 text-slate-600">{inq.returnDate || '—'}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inq.returnDate
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {inq.returnDate ? 'Round Trip' : 'One Way'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700">{inq.passengers}</td>
                    <td className="p-3.5 text-slate-700">{inq.cabinClass}</td>
                    <td className="p-3.5 text-slate-600 truncate max-w-[140px]">
                      {inq.preferredAirline || '—'}
                    </td>
                    <td
                      className="p-3.5 text-slate-500 max-w-[180px] truncate"
                      title={inq.notes}
                    >
                      {inq.notes || '—'}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inq.status === 'New'
                            ? 'bg-yellow-100 text-yellow-800'
                            : inq.status === 'Booked'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inq.status}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inq.status !== 'Booked' && (
                          <button
                            onClick={() => handleQuickStatus(inq, 'Booked')}
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold"
                            title="Mark Booked"
                          >
                            Book
                          </button>
                        )}
                        {inq.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleQuickStatus(inq, 'Cancelled')}
                            className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold"
                            title="Mark Cancelled"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => openEditForm(inq)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setInquiryToDelete(inq)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
          Showing {filteredInquiries.length} of {inquiries.length} flight inquiries
        </div>
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Flight Inquiry' : 'Add Flight Inquiry'}
              </h3>
              <button
                onClick={closeForm}
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#C8102E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#C8102E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    From *
                  </label>
                  <select
                    value={form.fromCity}
                    onChange={(e) => setForm({ ...form, fromCity: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#C8102E] bg-white"
                  >
                    {FROM_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Destination *
                  </label>
                  <select
                    value={form.destination}
                    onChange={(e) => setForm({ ...form, destination: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#C8102E] bg-white"
                  >
                    <option value="">Choose a destination...</option>
                    {DESTINATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={form.departureDate}
                    onChange={(e) => setForm({ ...form, departureDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#C8102E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Return Date <span className="text-slate-400">(empty = One Way)</span>
                  </label>
                  <input
                    type="date"
                    value={form.returnDate}
                    onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                    min={form.departureDate || undefined}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#C8102E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Passengers
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.passengers}
                    onChange={(e) =>
                      setForm({ ...form, passengers: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#C8102E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cabin Class
                  </label>
                  <select
                    value={form.cabinClass}
                    onChange={(e) => setForm({ ...form, cabinClass: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#C8102E] bg-white"
                  >
                    {CABIN_CLASS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#C8102E] bg-white"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preferred Airline *
                </label>
                <select
                  value={form.preferredAirline}
                  onChange={(e) =>
                    setForm({ ...form, preferredAirline: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#C8102E] bg-white"
                >
                  <option value="">Choose an airline...</option>
                  {AIRLINE_OPTIONS.map((a) => (
                    <option key={a.id} value={`${a.name} (${a.code})`}>
                      {a.name} ({a.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes / Special Requests
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#C8102E] resize-none"
                />
              </div>
            </div>

            <div className="p-5 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={closeForm}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!inquiryToDelete}
        title="Delete Flight Inquiry?"
        message={`Are you sure you want to delete the inquiry from "${inquiryToDelete?.fullName}"?`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setInquiryToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};