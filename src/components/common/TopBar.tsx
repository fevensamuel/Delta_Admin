import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, ChevronRight, Search, Bell } from 'lucide-react';

interface TopBarProps {
  onToggleSidebar?: () => void;
  onMenuClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar, onMenuClick }) => {
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
          <div className="w-7 h-7 rounded-md overflow-hidden bg-white border border-[#C8102E]/30 shrink-0 hidden sm:flex items-center justify-center">
            <img
              src="/logo/logo.jpg"
              alt="Delta Travel & Tour"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"%3E%3Crect width="28" height="28" fill="%23C8102E" rx="6"/%3E%3Ctext x="14" y="19" text-anchor="middle" dy=".3em" fill="white" font-size="13" font-family="sans-serif" font-weight="bold"%3E%CE%94%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
          <span className="text-[#C8102E] font-extrabold hidden sm:inline">Delta Admin</span>
          <ChevronRight className="w-4 h-4 text-white/40 hidden sm:inline" />
          <span className="text-white font-bold tracking-tight">{pageTitle}</span>
        </div>
      </div>

      {/* Right: Search & Notifications */}
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

        {/* Notification Bell */}
        <button className="p-2 text-white/70 hover:text-[#C8102E] relative transition-colors cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C8102E] rounded-full border-2 border-[#111827]"></span>
        </button>
      </div>
    </header>
  );
};