import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStatsApi } from '../api/dashboard';
import { DashboardStats } from '../types';
import { StatsCard } from '../components/common/StatsCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useExchangeRateStore } from '../store/useExchangeRateStore';
import { useAuth } from '../context/AuthContext';
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
  DollarSign,
  Video
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

// Helper function to get full image URL
const getFullImageUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (path.startsWith('data:')) {
    return path;
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const baseWithoutApi = baseUrl.replace(/\/api$/, '');
  if (path.startsWith('/uploads')) {
    return `${baseWithoutApi}${path}`;
  }
  return `${baseWithoutApi}${path}`;
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const isVideo = (item: any): boolean => {
    return item.type === 'Video' || item.type === 'video';
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Header with User Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#111827]">Travel Agency Dashboard</h2>
          <p className="text-xs text-[#718096] mt-0.5">Overview of website packages, WhatsApp leads, exchange rates, and gallery media.</p>
        </div>
        <div className="flex items-center gap-3 bg-white rounded-lg border border-[#E2E8F0] px-4 py-2 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-[#C8102E] flex items-center justify-center text-white font-bold text-xs">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <p className="text-xs font-bold text-[#111827]">{user?.username || 'Admin'}</p>
            <p className="text-[10px] text-[#C8102E] font-bold">Admin</p>
          </div>
        </div>
      </div>

      {/* Row 1: Top Metrics Grid (6 columns) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
      </div>
     

      {/* Row 3: Recent Gallery Uploads & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            {(stats?.recentGalleryUploads || []).slice(0, 4).map((g) => {
              const isVideoItem = isVideo(g);
              
              return (
                <div key={g.id} className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F9FAFB] flex items-center gap-3">
                  {g.imageUrl ? (
                    <img 
                      src={getFullImageUrl(g.imageUrl)} 
                      alt={g.titleEn} 
                      className="w-16 h-12 object-cover rounded-lg border shrink-0"
                    />
                  ) : isVideoItem ? (
                    <div className="w-16 h-12 bg-[#111827] rounded-lg border shrink-0 flex items-center justify-center">
                      <Video className="w-6 h-6 text-[#C8102E]" />
                    </div>
                  ) : (
                    <div className="w-16 h-12 bg-[#F9FAFB] rounded-lg border shrink-0 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-[#718096]" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#111827] truncate">{g.titleEn}</p>
                    <p className="text-[11px] text-[#718096] truncate mt-0.5">{g.description || g.location || 'Website Media'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-[#C8102E] bg-[#C8102E]/10 px-2 py-0.5 rounded">
                        {g.type || 'Photo'}
                      </span>
                      <span className="text-[10px] text-[#718096]">{g.uploadDate || g.createdAt?.substring(0, 10) || ''}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

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
                onClick={() => navigate('/gallery/bulk-upload')}
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