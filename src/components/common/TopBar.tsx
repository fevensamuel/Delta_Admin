import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, Shield, ChevronRight, Search, Bell } from 'lucide-react';
import { UserRole } from '../../types';

interface TopBarProps {
  onToggleSidebar?: () => void;
  onMenuClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar, onMenuClick }) => {
  const { user, switchRoleForDemo } = useAuth();
  const location = useLocation();

  const handleToggle = onMenuClick || onToggleSidebar;

  const getPageTitle = (path: string) => {
    if (path === '/dashboard' || path === '/') return 'Dashboard Overview';
    if (path.startsWith('/packages/new')) return 'Create New Package';
    if (path.startsWith('/packages/') && path.endsWith('/edit')) return 'Edit Package';
    if (path.startsWith('/packages')) return 'Package Manager';
    if (path === '/gallery/bulk-upload') return 'Bulk Upload Gallery';
    if (path === '/gallery/create') return 'Create Gallery Item';
    if (path.startsWith('/gallery/edit/')) return 'Edit Gallery Item';
    if (path.startsWith('/gallery')) return 'Gallery Grid';
    if (path.startsWith('/subscribers')) return 'Subscriber Database';
    if (path.startsWith('/sms')) return 'SMS Campaigns';
    if (path.startsWith('/inquiries')) return 'Customer Inquiries';
    if (path.startsWith('/leads')) return 'Booking Lead Analytics';
    if (path.startsWith('/users')) return 'User & Role Management';
    return 'Admin Dashboard';
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="h-16 bg-[#111827] border-b border-[#1F2937] px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs text-white">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          className="lg:hidden text-white/80 hover:text-white p-2 rounded-lg bg-[#1F2937] hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-[#C8102E] font-extrabold hidden sm:inline">Delta Admin</span>
          <ChevronRight className="w-4 h-4 text-white/40 hidden sm:inline" />
          <span className="text-white font-bold tracking-tight">{pageTitle}</span>
        </div>
      </div>

      {/* Right: Search, Role Switcher, Notifications */}
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search packages, gallery..."
            className="pl-9 pr-4 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs w-56 focus:ring-2 focus:ring-[#C8102E] focus:outline-none font-medium text-white placeholder-white/60"
          />
          <Search className="absolute left-3 top-2 text-white/60 w-3.5 h-3.5" />
        </div>

        {/* Role Quick Switcher */}
        <div className="hidden sm:flex items-center gap-1.5 p-1 bg-[#1F2937] rounded-lg border border-white/10 text-xs">
          <span className="text-gray-300 font-semibold px-1.5 flex items-center gap-1 text-[11px]">
            <Shield className="w-3.5 h-3.5 text-[#C8102E]" /> Role:
          </span>
          {(['SuperAdmin', 'Admin', 'Editor'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => switchRoleForDemo(r)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                user?.role === r
                  ? 'bg-[#C8102E] text-white shadow-xs'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Notification Bell */}
        <button className="p-2 text-white/70 hover:text-[#C8102E] relative transition-colors cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C8102E] rounded-full border-2 border-[#111827]"></span>
        </button>
      </div>
    </header>
  );
};
