import React, { useState } from 'react';
import { Inquiry, InquiryStatus } from '../../types';
import { Mail, Phone, User as UserIcon, Calendar, CheckCircle, Copy, X, Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface InquiryDetailModalProps {
  inquiry: Inquiry | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: InquiryStatus, notes?: string) => Promise<void>;
  isLoading?: boolean;
}

export const InquiryDetailModal: React.FC<InquiryDetailModalProps> = ({
  inquiry,
  isOpen,
  onClose,
  onUpdateStatus,
  isLoading
}) => {
  const { showToast } = useToast();
  if (!isOpen || !inquiry) return null;

  const [status, setStatus] = useState<InquiryStatus>(inquiry.status);
  const [adminNotes, setAdminNotes] = useState<string>(inquiry.adminNotes || '');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast('success', `${label} copied to clipboard!`);
  };

  const handleSave = async () => {
    try {
      await onUpdateStatus(inquiry.id, status, adminNotes);
      showToast('success', 'Inquiry status and notes updated');
      onClose();
    } catch {
      showToast('error', 'Failed to update inquiry');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  status === 'New'
                    ? 'bg-rose-100 text-rose-800'
                    : status === 'Contacted'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {status}
              </span>
              <span className="text-xs text-slate-500 font-medium">{inquiry.dateReceived}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">{inquiry.subject}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Contact Details Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-[#1A5B4B]" /> {inquiry.fullName}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                <span className="flex items-center gap-1.5 truncate">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" /> {inquiry.phone}
                </span>
                <button
                  onClick={() => copyToClipboard(inquiry.phone, 'Phone number')}
                  className="text-slate-400 hover:text-slate-700 p-1"
                  title="Copy Phone"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                <span className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-sky-600" /> {inquiry.email}
                </span>
                <button
                  onClick={() => copyToClipboard(inquiry.email, 'Email address')}
                  className="text-slate-400 hover:text-slate-700 p-1"
                  title="Copy Email"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Full Customer Message */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Message Body</h4>
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 text-sm text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
              {inquiry.message}
            </div>
          </div>

          {/* Admin Management Section */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Update Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InquiryStatus)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
              >
                <option value="New">New (Unresolved)</option>
                <option value="Contacted">Contacted (In Progress)</option>
                <option value="Resolved">Resolved (Completed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Internal Admin Notes</label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Write internal team notes (e.g. Sent PDF brochure via WhatsApp)..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-white"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="px-5 py-2 rounded-xl bg-[#1A5B4B] text-white text-sm font-semibold hover:bg-[#14483B] flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" /> Save Status & Notes
          </button>
        </div>
      </div>
    </div>
  );
};
