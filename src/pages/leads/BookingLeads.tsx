import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from '../../types';
import { getPackagesApi } from '../../api/packages';
import { StatsCard } from '../../components/common/StatsCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { RoleGuard } from '../../components/common/RoleGuard';
import { useToast } from '../../context/ToastContext';
import {
  MousePointerClick,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Award,
  MessageCircle,
  ExternalLink,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const BookingLeads: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('This Month');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getPackagesApi();
      setPackages(data);
    } catch {
      showToast('error', 'Failed to load booking lead analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const totalClicks = packages.reduce((acc, p) => acc + (p.whatsappClicks || 0), 0);
  const topPackage = [...packages].sort((a, b) => (b.whatsappClicks || 0) - (a.whatsappClicks || 0))[0];

  // Category chart data
  const categoriesMap: Record<string, number> = {};
  packages.forEach((p) => {
    categoriesMap[p.category] = (categoriesMap[p.category] || 0) + (p.whatsappClicks || 0);
  });
  const categoryPieData = Object.keys(categoriesMap).map((cat) => ({
    name: cat,
    value: categoriesMap[cat]
  }));

  const COLORS = ['#1A5B4B', '#C9A84C', '#3b82f6', '#8b5cf6', '#ec4899'];

  const handleExportCsvReport = () => {
    const headers = ['Package Name', 'Category', 'Price USD', 'Duration Days', 'WhatsApp Clicks'];
    const rows = packages.map((p) => [`"${p.titleEn}"`, p.category, p.price, p.durationDays, p.whatsappClicks || 0]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `delta_whatsapp_booking_leads_${new Date().toISOString().substring(0, 10)}.csv`;
    link.click();
    showToast('success', 'Exported WhatsApp booking click report CSV');
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading Lead Conversion Analytics..." />;
  }

  return (
    <RoleGuard module="leads" action="view">
      <div className="space-y-8 pb-12 animate-in fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">WhatsApp Booking Leads Analytics</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracks high-intent customer clicks on "Book on WhatsApp" buttons across all packages.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
            >
              <option value="This Month">This Month</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last Quarter">Last Quarter</option>
              <option value="All Time">All Time</option>
            </select>

            <button
              onClick={handleExportCsvReport}
              className="px-4 py-2 rounded-xl bg-[#1A5B4B] hover:bg-[#14483B] text-white font-bold text-xs shadow-md flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-[#C9A84C]" /> Export Lead Report
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-[#C9A84C] shrink-0" />
          <p className="font-medium">
            <strong>System Scope Note:</strong> Delta Travel operates via direct WhatsApp messaging. Clicks measured below reflect prospective pilgrims who initiated a booking request to your agency phone on WhatsApp.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard
            title="Total WhatsApp Clicks"
            value={totalClicks}
            icon={MousePointerClick}
            subtitle="Overall booking leads"
            trend={{ value: '+18% vs last month', isPositive: true }}
            accentColor="emerald"
          />
          <StatsCard
            title="Top Package Lead"
            value={topPackage ? topPackage.titleEn.substring(0, 16) + '...' : '—'}
            icon={Award}
            subtitle={`${topPackage?.whatsappClicks || 0} direct inquiries`}
            accentColor="amber"
          />
          <StatsCard
            title="Top Category"
            value="Economy Umrah"
            icon={TrendingUp}
            subtitle="42% of total intent"
            accentColor="sky"
          />
          <StatsCard
            title="Avg Lead Value"
            value="$1,850"
            icon={ArrowUpRight}
            subtitle="Estimated package value"
            accentColor="purple"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Packages Bar Chart (2 cols) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Top Packages by WhatsApp Booking Clicks</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={packages.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis dataKey="titleEn" type="category" width={150} stroke="#475569" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A2E', borderRadius: '12px', color: '#fff' }} />
                  <Bar dataKey="whatsappClicks" fill="#1A5B4B" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Pie Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Intent by Travel Tier</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {categoryPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A2E', borderRadius: '12px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Package Clicks Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Package Conversion Performance Breakdown</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-5">Package Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Price</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">WhatsApp Clicks</th>
                  <th className="p-3.5 text-right pr-5">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 pl-5 font-bold text-slate-900 text-sm">
                      {pkg.titleEn}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 text-[11px]">
                        {pkg.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">${pkg.price}</td>
                    <td className="p-3.5 text-slate-600">{pkg.durationDays} Days</td>
                    <td className="p-3.5">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {pkg.whatsappClicks || 0} clicks
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <button
                        onClick={() => navigate(`/packages/${pkg.id}/edit`)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold inline-flex items-center gap-1 text-[#1A5B4B]"
                      >
                        Edit Package <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
};
