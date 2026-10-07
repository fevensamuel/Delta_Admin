// src/components/modals/BulkImportModal.tsx
import React, { useState } from 'react';
import { FileSpreadsheet, Upload, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Subscriber } from '../../types';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    subscribers: Omit<Subscriber, 'id' | 'dateSubscribed'>[]
  ) => Promise<{ added: number; updated: number }>;
  isLoading?: boolean;
}

interface ParsedRow {
  phone: string;
  name: string;
  email: string;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  isLoading,
}) => {
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      parseCsv(selectedFile);
    }
  };

  /**
   * ✅ Smart CSV parser:
   *   - Detects columns by header name: phone, name, email (order-agnostic)
   *   - Falls back to defaults: col 1 = phone, col 2 = name, col 3 = email
   *   - Handles quoted values with commas inside
   *   - Handles scientific notation like 9.74E+08 by restoring as a plain string
   *   - Skips blank rows and row 1 if it's a header
   */
  const parseCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = (evt.target?.result as string) || '';
      if (!content) return;

      // Split lines (handle \r\n and \n)
      const rawLines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (rawLines.length === 0) {
        showToast('error', 'CSV file is empty');
        return;
      }

      // --- Parse header (if present) ---
      const firstLineCells = splitCsvLine(rawLines[0]);
      const headerLower = firstLineCells.map((c) => c.trim().toLowerCase());

      const looksLikeHeader = headerLower.some((h) =>
        ['phone', 'name', 'email', 'fullname', 'full_name', 'mobile', 'telephone'].includes(h)
      );

      let phoneIdx = 0;
      let nameIdx = 1;
      let emailIdx = 2;

      if (looksLikeHeader) {
        headerLower.forEach((h, i) => {
          if (['phone', 'mobile', 'telephone', 'phone_number', 'phone number'].includes(h)) phoneIdx = i;
          else if (['name', 'fullname', 'full_name', 'full name'].includes(h)) nameIdx = i;
          else if (['email', 'e-mail', 'email_address'].includes(h)) emailIdx = i;
        });
      }

      const startRow = looksLikeHeader ? 1 : 0;
      const rows: ParsedRow[] = [];
      const seenPhones = new Set<string>();

      for (let i = startRow; i < rawLines.length; i++) {
        const cells = splitCsvLine(rawLines[i]);
        const rawPhone = (cells[phoneIdx] || '').trim();
        if (!rawPhone) continue;

        const phone = normalizePhone(rawPhone);
        if (!phone) continue;

        // Skip duplicates within the same file
        if (seenPhones.has(phone)) continue;
        seenPhones.add(phone);

        rows.push({
          phone,
          name: (cells[nameIdx] || '').trim(),
          email: (cells[emailIdx] || '').trim(),
        });
      }

      if (rows.length === 0) {
        setParsedRows([]);
        showToast('error', 'No valid subscribers found in the uploaded CSV file');
      } else {
        setParsedRows(rows);
        showToast('success', `Parsed ${rows.length} subscribers from CSV`);
      }
    };
    reader.readAsText(file);
  };

  /**
   * Split a CSV line into cells, respecting quotes.
   * Handles: a,b,c → [a,b,c]  and  "a,b",c → ["a,b",c]
   */
  const splitCsvLine = (line: string): string[] => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cells.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current);
    return cells.map((c) => c.replace(/^["']|["']$/g, '').trim());
  };

  /**
   * ✅ Recover scientific notation and normalize phone format.
   *   - "9.74E+08"      → attempts numeric expansion → "974000000"
   *   - "+251974123456" → "+251974123456"
   *   - "0974..."       → "+251974..."
   *   - "974123456"     → "+251974123456"
   */
  const normalizePhone = (raw: string): string => {
    let value = raw.trim();

    // Handle scientific notation (Excel corruption)
    if (/^\d+(\.\d+)?[eE]\+?\d+$/.test(value) || /^\d+(\.\d+)?[eE]-?\d+$/.test(value)) {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        // Best-effort expansion (may still be lossy if Excel truncated digits)
        value = numeric.toFixed(0);
      }
    }

    // Strip non-digit chars except leading +
    let digits = value.replace(/[^\d]/g, '');

    // Normalize to international format with +251 prefix
    if (digits.startsWith('251')) {
      return '+' + digits;
    }
    if (digits.startsWith('0')) {
      return '+251' + digits.slice(1);
    }
    if (digits.length >= 9) {
      return '+251' + digits;
    }
    return digits ? '+251' + digits : '';
  };

  const handleRunImport = async () => {
    if (parsedRows.length === 0) {
      showToast('error', 'No valid subscribers to import');
      return;
    }

    try {
      // ✅ Set channel to 'Bulk Import' on every row + include name
      const subscribersData = parsedRows.map((r) => ({
        phone: r.phone,
        name: r.name || '',
        email: r.email || '',
        channel: 'Bulk Import',
        packageInterest: '',
        optInStatus: 'Active' as const,
      }));

      const res = await onImport(subscribersData);
      showToast('success', `Import complete! Added: ${res.added}, Updated: ${res.updated}`);
      onClose();
    } catch (err: any) {
      console.error('Bulk import error:', err);
      showToast('error', err?.message || 'Failed to import subscribers');
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
          <div className="border-2 border-dashed border-slate-300 hover:border-[#1A5B4B] rounded-2xl p-6 text-center bg-slate-50/50 transition-colors">
            <Upload className="w-8 h-8 text-[#1A5B4B] mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">Upload CSV File</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Expected columns: <span className="font-mono">phone, name, email</span> (any order)
            </p>

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
            {file && (
              <p className="mt-2 text-[11px] text-slate-500 font-mono truncate">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
            <p className="font-bold mb-1">💡 How it works</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li>Duplicate phones within the file are skipped</li>
              <li>Duplicate phones against the database are <strong>updated</strong> (not duplicated)</li>
            </ul>
          </div>

          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Parsed Data Preview ({parsedRows.length} contacts)
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Ready to Import
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b sticky top-0">
                    <tr>
                      <th className="p-2.5">Phone</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono">{row.phone}</td>
                        <td className="p-2.5">{row.name || '—'}</td>
                        <td className="p-2.5">{row.email || '—'}</td>
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