import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStatsApi } from '../api/dashboard';
import { DashboardStats } from '../types';
import { StatsCard } from '../components/common/StatsCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useExchangeRateStore } from '../store/useExchangeRateStore';
import {
  Package,
  Image as ImageIcon,
  Mail,
  Users,
  ArrowRight,
  MessageSquare,
  RefreshCw,
  Plus,
  Upload,
  Send,
  DollarSign
} from 'lucide-react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { rate, lastUpdated, fetchRate, isLoading: isRateLoading } = useExchangeRateStore();
  const [usdCalcInput, setUsdCalcInput] = useState<number>(1000);

  useEffect(() => {
    loadStats();
    fetchRate();
  }, [fetchRate]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await getDashboardStatsApi();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return <LoadingSpinner text="Loading Dashboard Analytics..." />;
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#111827]">Travel Agency Dashboard</h2>
          <p className="text-xs text-[#718096] mt-0.5">Overview of website packages, WhatsApp leads, exchange rates, and gallery media.</p>
        </div>
      </div>

      {/* Row 1: Top Metrics Grid (6 columns) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard
          title="Total Packages"
          value={(stats?.totalPackages ?? 0).toString()}
          icon={Package}
          trend={{ value: `${stats?.activePackages ?? stats?.totalPackages ?? 0} active`, isPositive: true }}
          accentColor="green"
        />
        <StatsCard
          title="Gallery Media"
          value={(stats?.totalGalleryItems ?? 0).toString()}
          icon={ImageIcon}
          trend={{ value: 'Photos & Videos', isPositive: true }}
          accentColor="gold"
        />
        <StatsCard
          title="WhatsApp Clicks"
          value={(stats?.totalWhatsappClicks ?? stats?.totalPackageClicks ?? 0).toString()}
          icon={MessageSquare}
          trend={{ value: 'Customer leads', isPositive: true }}
          accentColor="green"
        />
        <StatsCard
          title="Subscribers"
          value={(stats?.totalSubscribers ?? 0).toLocaleString()}
          icon={Users}
          trend={{ value: 'Opted-in contacts', isPositive: true }}
          accentColor="green"
        />
        <StatsCard
          title="Web Inquiries"
          value={(stats?.totalInquiries ?? 0).toString()}
          icon={Mail}
          trend={{ value: 'Customer forms', isPositive: true }}
          accentColor="gold"
        />
        <StatsCard
          title="Exchange Rate"
          value={`${(rate || 112.11).toFixed(1)} ETB`}
          icon={DollarSign}
          trend={{ value: 'Real-time USD/ETB', isPositive: true }}
          accentColor="green"
        />
      </div>

      {/* Row 2: Exchange Rate Widget & Package Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Exchange Rate Service Widget (1 col) */}
        <section className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
              <h3 className="font-bold text-base text-[#111827] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                Live USD/ETB Rate
              </h3>
              <button
                type="button"
                onClick={() => fetchRate()}
                disabled={isRateLoading}
                className="p-1.5 rounded-lg border border-[#E2E8F0] text-[#C8102E] hover:bg-rose-50 transition-colors cursor-pointer"
                title="Refresh Live Exchange Rate"
              >
                <RefreshCw className={`w-4 h-4 ${isRateLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E2E8F0] text-center space-y-1">
              <span className="text-xs font-semibold text-[#718096]">Current Commercial Bank Rate</span>
              <div className="text-3xl font-black text-[#111827]">
                1 USD = <span className="text-[#C8102E]">{rate.toFixed(2)}</span> ETB
              </div>
              {lastUpdated && (
                <p className="text-[10px] text-[#718096]">
                  Last synced: {new Date(lastUpdated).toLocaleTimeString()}
                </p>
              )}
            </div>

            {/* Quick Currency Converter */}
            <div className="mt-4 space-y-2">
              <label className="block text-xs font-bold text-[#111827]">Quick Price Converter</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-2 text-xs font-bold text-[#718096]">$</span>
                  <input
                    type="number"
                    value={usdCalcInput}
                    onChange={(e) => setUsdCalcInput(Number(e.target.value))}
                    className="w-full pl-6 pr-2 py-1.5 rounded border border-[#E2E8F0] text-xs font-bold"
                  />
                </div>
                <div className="flex-1 px-3 py-1.5 rounded bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
                  <span>ETB:</span>
                  <span>{(usdCalcInput * rate).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] text-[11px] text-[#718096] flex items-center justify-between">
            <span>Source: National Bank / Live API</span>
            <span className="text-emerald-700 font-bold">● Active Service</span>
          </div>
        </section>

        {/* WhatsApp Clicks Performance Chart (2 cols) */}
        <section className="lg:col-span-2 bg-white rounded-lg border border-[#E2E8F0] shadow-xs p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-[#111827]">Package Performance (WhatsApp Clicks)</h3>
              <p className="text-xs text-[#718096]">Lead generation volume by category</p>
            </div>
            <button
              onClick={() => navigate('/leads')}
              className="text-xs font-bold text-[#C8102E] hover:underline flex items-center gap-1"
            >
              Leads Analytics <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.clicksByCategory || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="category" stroke="#718096" fontSize={11} tickLine={false} />
                <YAxis stroke="#718096" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="clicks" fill="#2D7D6B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Row 3: Recent Gallery Uploads & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Gallery Uploads (2 cols) */}
        <section className="lg:col-span-2 bg-white rounded-lg border border-[#E2E8F0] shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <h3 className="font-bold text-base text-[#111827]">Recent Gallery Uploads</h3>
              <p className="text-xs text-[#718096]">Latest customer travel photos and videos published to the gallery manager</p>
            </div>
            <button
              onClick={() => navigate('/gallery')}
              className="text-xs font-bold text-[#C8102E] hover:underline flex items-center gap-1"
            >
              Gallery Manager <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(stats?.recentGalleryUploads || []).slice(0, 4).map((g) => (
              <div key={g.id} className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F9FAFB] flex items-center gap-3">
                <img src={g.imageUrl} alt={g.titleEn} className="w-16 h-12 object-cover rounded-lg border shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#111827] truncate">{g.titleEn}</p>
                  <p className="text-[11px] text-[#718096] truncate mt-0.5">{g.description || g.location || 'Website Media'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-[#C8102E] bg-[#C8102E]/10 px-2 py-0.5 rounded">
                      {g.type}
                    </span>
                    <span className="text-[10px] text-[#718096]">{g.uploadDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions Panel (1 col) */}
        <section className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-[#111827] border-b border-[#E2E8F0] pb-3 mb-4">
              Quick Admin Actions
            </h3>

            <div className="space-y-2.5">
              <button
                onClick={() => navigate('/packages/new')}
                className="w-full p-3 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-xs transition-colors flex items-center justify-between shadow-xs"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Create New Travel Package
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('/gallery')}
                className="w-full p-3 rounded-lg bg-[#111827] hover:bg-black text-white font-bold text-xs transition-colors flex items-center justify-between shadow-xs"
              >
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload Gallery Media
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('/sms')}
                className="w-full p-3 rounded-lg border border-[#E2E8F0] hover:bg-[#F9FAFB] text-[#111827] font-bold text-xs transition-colors flex items-center justify-between shadow-xs"
              >
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#C8102E]" /> Send SMS Broadcast
                </span>
                <ArrowRight className="w-4 h-4 text-[#718096]" />
              </button>

              <button
                onClick={() => navigate('/inquiries')}
                className="w-full p-3 rounded-lg border border-[#E2E8F0] hover:bg-[#F9FAFB] text-[#111827] font-bold text-xs transition-colors flex items-center justify-between shadow-xs"
              >
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#C8102E]" /> Review Web Inquiries
                </span>
                <ArrowRight className="w-4 h-4 text-[#718096]" />
              </button>
            </div>
          </div>

          <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-center">
            <p className="text-[11px] font-bold text-[#C8102E]">Admin Portal Online</p>
            <p className="text-[10px] text-[#718096]">Connected to backend REST API</p>
          </div>
        </section>
      </div>
    </div>
  );
};
