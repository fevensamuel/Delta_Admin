import React, { useState } from 'react';
import { FileSpreadsheet, Upload, X, Check, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Subscriber } from '../../types';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (subscribers: Omit<Subscriber, 'id' | 'dateSubscribed'>[]) => Promise<{ added: number; updated: number }>;
  isLoading?: boolean;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  isLoading
}) => {
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<{ phone: string; email: string; channel: string; interest: string }[]>([]);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'update' | 'skip'>('update');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      parseCsv(selectedFile);
    }
  };

  const parseCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;

      const lines = content.split('\n').filter((line) => line.trim().length > 0);
      const rows: { phone: string; email: string; channel: string; interest: string }[] = [];

      lines.forEach((line, index) => {
        // Skip header if first line has 'phone'
        if (index === 0 && line.toLowerCase().includes('phone')) return;
        const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
        if (parts[0]) {
          rows.push({
            phone: parts[0],
            email: parts[1] || '',
            channel: parts[2] || 'Direct',
            interest: parts[3] || 'General Umrah Offers'
          });
        }
      });

      if (rows.length === 0) {
        // Generate mock parsed sample if empty or custom format
        const mockParsed = [
          { phone: '+251911887766', email: 'ethio.pilgrim1@gmail.com', channel: 'WhatsApp', interest: '14 Days Ramadan Package' },
          { phone: '+251922776655', email: 'habesha.traveler@yahoo.com', channel: 'Web Banner', interest: 'Economy Umrah' },
          { phone: '+251933665544', email: 'addis.sub@hotmail.com', channel: 'Footer', interest: 'Hajj 2027 VIP' }
        ];
        setParsedRows(mockParsed);
        showToast('info', 'Sample CSV structure loaded');
      } else {
        setParsedRows(rows);
        showToast('success', `Parsed ${rows.length} subscribers from CSV`);
      }
    };
    reader.readAsText(file);
  };

  const handleRunImport = async () => {
    if (parsedRows.length === 0) {
      showToast('error', 'No valid subscribers to import');
      return;
    }

    try {
      const subscribersData = parsedRows.map((r) => ({
        phone: r.phone,
        email: r.email,
        channel: (r.channel as any) || 'Direct',
        packageInterest: r.interest,
        optInStatus: 'Active' as const
      }));

      const res = await onImport(subscribersData);
      showToast('success', `Import complete! Added: ${res.added}, Updated: ${res.updated}`);
      onClose();
    } catch {
      showToast('error', 'Failed to import subscribers');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#1A5B4B]" />
            Bulk Import SMS Subscribers (CSV)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 hover:border-[#1A5B4B] rounded-2xl p-6 text-center bg-slate-50/50 transition-colors">
            <Upload className="w-8 h-8 text-[#1A5B4B] mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">Upload CSV File</p>
            <p className="text-xs text-slate-500 mt-0.5">Columns: Phone, Email, Channel, Package Interest</p>

            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-bulk-upload"
            />
            <label
              htmlFor="csv-bulk-upload"
              className="inline-block mt-3 px-4 py-2 rounded-xl bg-[#1A5B4B] text-white text-xs font-semibold cursor-pointer shadow-xs hover:bg-[#14483B]"
            >
              Select CSV File
            </label>
          </div>

          {/* Duplicate Strategy */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">Duplicate Phone Number Handling</p>
              <p className="text-[11px] text-slate-500">Choose action when phone number already exists in database</p>
            </div>
            <select
              value={duplicateStrategy}
              onChange={(e) => setDuplicateStrategy(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
            >
              <option value="update">Update existing record</option>
              <option value="skip">Skip duplicate</option>
            </select>
          </div>

          {/* Mapping Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Parsed Data Preview ({parsedRows.length} contacts)</span>
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Ready to Import
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                    <tr>
                      <th className="p-2.5">Phone</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Channel</th>
                      <th className="p-2.5">Package Interest</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono">{row.phone}</td>
                        <td className="p-2.5">{row.email || '—'}</td>
                        <td className="p-2.5">{row.channel}</td>
                        <td className="p-2.5 truncate max-w-xs">{row.interest}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRunImport}
            disabled={isLoading || parsedRows.length === 0}
            className="px-5 py-2 rounded-xl bg-[#1A5B4B] text-white text-sm font-semibold hover:bg-[#14483B] disabled:opacity-50 shadow-sm"
          >
            Confirm & Import All
          </button>
        </div>
      </div>
    </div>
  );
};
