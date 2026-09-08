import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { getPriceLogsApi } from '../../api/priceLogs';
import { PriceLog } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Loader2, History, TrendingUp, TrendingDown, Minus, Calendar, Package as PackageIcon, User, RefreshCw } from 'lucide-react';

export const PriceLogs: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<PriceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'increase' | 'decrease'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPriceLogs();
  }, []);

  const loadPriceLogs = async () => {
    setLoading(true);
    try {
      const data = await getPriceLogsApi();
      setLogs(Array.isArray(data) ? data : []);
      console.log('✅ Price logs loaded:', data.length);
    } catch (error) {
      console.error('❌ Error loading price logs:', error);
      showToast('error', 'Failed to load price logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.packageTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.packageId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    
    const prevPrice = log.previousPriceEtb || 0;
    const currentPrice = log.priceEtb || 0;
    
    if (filter === 'increase') return matchesSearch && currentPrice > prevPrice;
    if (filter === 'decrease') return matchesSearch && currentPrice < prevPrice;
    
    return matchesSearch;
  });

  const getPriceChange = (log: PriceLog) => {
    const prev = log.previousPriceEtb || 0;
    const current = log.priceEtb || 0;
    if (prev === 0 && current === 0) return { change: 0, percentage: 0, direction: 'none' };
    if (prev === 0) return { change: current, percentage: 100, direction: 'increase' };
    
    const change = current - prev;
    const percentage = (change / prev) * 100;
    const direction = change > 0 ? 'increase' : change < 0 ? 'decrease' : 'none';
    
    return { change, percentage, direction };
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

   if (loading) {
      return (
        <LoadingSpinner text="Loading Price Logs..." />
      );
    }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#111827] flex items-center gap-2">
            <History className="w-6 h-6 text-[#C8102E]" /> Price Change Logs
          </h2>
          <p className="text-sm text-[#718096]">Track all price changes across packages (in ETB)</p>
        </div>
        <button
          onClick={loadPriceLogs}
          className="px-4 py-2 rounded-lg bg-[#2D7D6B] hover:bg-[#236355] text-white text-xs font-bold transition-colors flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0]">
          <p className="text-xs text-[#718096] font-medium">Total Changes</p>
          <p className="text-xl font-bold text-[#111827]">{logs.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0]">
          <p className="text-xs text-[#718096] font-medium">Price Increases</p>
          <p className="text-xl font-bold text-emerald-600">
            {logs.filter(l => {
              const prev = l.previousPriceEtb || 0;
              const curr = l.priceEtb || 0;
              return curr > prev;
            }).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0]">
          <p className="text-xs text-[#718096] font-medium">Price Decreases</p>
          <p className="text-xl font-bold text-[#C8102E]">
            {logs.filter(l => {
              const prev = l.previousPriceEtb || 0;
              const curr = l.priceEtb || 0;
              return curr < prev;
            }).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0]">
          <p className="text-xs text-[#718096] font-medium">Unique Packages</p>
          <p className="text-xl font-bold text-[#2D7D6B]">
            {new Set(logs.map(l => l.packageId)).size}
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#111827]">Filter:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === 'all' 
                ? 'bg-[#111827] text-white' 
                : 'bg-[#F9FAFB] text-[#718096] border border-[#E2E8F0] hover:bg-[#E2E8F0]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('increase')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
              filter === 'increase' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-[#F9FAFB] text-[#718096] border border-[#E2E8F0] hover:bg-[#E2E8F0]'
            }`}
          >
            <TrendingUp className="w-3 h-3" /> Increases
          </button>
          <button
            onClick={() => setFilter('decrease')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
              filter === 'decrease' 
                ? 'bg-[#C8102E] text-white' 
                : 'bg-[#F9FAFB] text-[#718096] border border-[#E2E8F0] hover:bg-[#E2E8F0]'
            }`}
          >
            <TrendingDown className="w-3 h-3" /> Decreases
          </button>
        </div>

        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by package name or reason..."
            className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] text-[#111827] font-bold border-b border-[#E2E8F0]">
              <tr>
                <th className="p-3.5 pl-5">Package</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Old Price (ETB)</th>
                <th className="p-3.5">New Price (ETB)</th>
                <th className="p-3.5">Change</th>
                <th className="p-3.5">Reason</th>
                <th className="p-3.5">Updated By</th>
                <th className="p-3.5 text-right pr-5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] font-medium text-[#2D3748]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#718096]">
                    {logs.length === 0 
                      ? 'No price changes recorded yet. Price logs will appear when package prices are updated.' 
                      : 'No price logs match the current filter criteria.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const { change, percentage, direction } = getPriceChange(log);
                  const isIncrease = direction === 'increase';
                  const isDecrease = direction === 'decrease';
                  const isNewPackage = log.previousPriceEtb === 0 || log.previousPriceEtb === null;

                  return (
                    <tr key={log.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-2">
                          <PackageIcon className="w-4 h-4 text-[#2D7D6B]" />
                          <span className="font-bold text-[#111827]">{log.packageTitle || log.packageId || 'Unknown Package'}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        {log.packageCategory && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${
                            log.packageCategory === 'VIP' ? 'bg-yellow-600' :
                            log.packageCategory === 'Premium' ? 'bg-purple-600' :
                            log.packageCategory === 'Standard' ? 'bg-blue-600' :
                            'bg-green-600'
                          }`}>
                            {log.packageCategory}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="text-[#718096]">
                          {log.previousPriceEtb !== null && log.previousPriceEtb !== undefined
                            ? `${log.previousPriceEtb.toLocaleString()} ETB`
                            : '—'}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-[#2D7D6B]">
                        {log.priceEtb?.toLocaleString() || '0'} ETB
                      </td>
                      <td className="p-3.5">
                        {isNewPackage ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                            New Package
                          </span>
                        ) : isIncrease ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                            <TrendingUp className="w-3 h-3" /> +{change.toLocaleString()} ETB ({percentage.toFixed(1)}%)
                          </span>
                        ) : isDecrease ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                            <TrendingDown className="w-3 h-3" /> -{Math.abs(change).toLocaleString()} ETB ({Math.abs(percentage).toFixed(1)}%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold">
                            <Minus className="w-3 h-3" /> No change
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-[#718096] max-w-xs truncate">
                        {log.reason || 'No reason provided'}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-[#718096]" />
                          <span className="text-[#718096]">{log.updatedBy || 'System'}</span>
                        </div>
                      </td>
                      <td className="p-3.5 pr-5 text-right text-[#718096]">
                        <div className="flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(log.updatedAt)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};