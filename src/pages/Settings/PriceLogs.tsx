import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { getPriceLogsApi } from '../../api/priceLogs';
import { PriceLog } from '../../types';
import { Clock, History } from 'lucide-react';

export const PriceLogs: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<PriceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getPriceLogsApi();
      setLogs(data);
    } catch (error) {
      showToast('error', 'Failed to load price logs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C8102E]"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">Price Change Log</h2>
          <p className="text-sm text-[#718096]">Track all price changes made to packages</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-[#F9FAFB] px-3 py-1.5 rounded-lg border border-[#E2E8F0]">
          <History className="w-4 h-4 text-[#C8102E]" />
          <span className="font-bold">{logs.length} changes</span>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-12 text-center text-[#718096]">
          <Clock className="w-12 h-12 mx-auto text-[#E2E8F0] mb-3" />
          <p className="font-semibold">No price changes recorded yet</p>
          <p className="text-sm">Prices will appear here when you update package pricing</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F9FAFB] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3 font-bold text-[#111827]">Package</th>
                  <th className="px-4 py-3 font-bold text-[#111827]">Previous Price</th>
                  <th className="px-4 py-3 font-bold text-[#111827]">New Price</th>
                  <th className="px-4 py-3 font-bold text-[#111827]">Reason</th>
                  <th className="px-4 py-3 font-bold text-[#111827]">Updated By</th>
                  <th className="px-4 py-3 font-bold text-[#111827]">Date/Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {logs.map((log) => {
                  const pkg = log.packageId ? log.packageId.substring(0, 20) : 'Package';
                  return (
                    <tr key={log.id} className="hover:bg-[#F9FAFB]">
                      <td className="px-4 py-3 font-semibold text-[#111827]">
                        {pkg}
                      </td>
                      <td className="px-4 py-3 text-[#718096]">
                        {log.previousPriceUsd ? (
                          <span className="text-xs">
                            <div>${log.previousPriceUsd}</div>
                            <div className="text-[10px]">{log.previousPriceEtb} ETB</div>
                            <div className="text-[10px]">{log.previousPriceSar} SAR</div>
                          </span>
                        ) : (
                          <span className="text-[#A0AEC0]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#C8102E]">
                        <span className="text-xs">
                          <div>${log.priceUsd}</div>
                          <div className="text-[10px] text-[#111827]">{log.priceEtb} ETB</div>
                          <div className="text-[10px] text-[#111827]">{log.priceSar} SAR</div>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#718096] max-w-xs">
                        {log.reason}
                      </td>
                      <td className="px-4 py-3 text-[#718096]">
                        {log.updatedBy}
                      </td>
                      <td className="px-4 py-3 text-[#718096] text-xs whitespace-nowrap">
                        {new Date(log.updatedAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};