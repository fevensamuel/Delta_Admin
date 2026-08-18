import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Image as ImageIcon,
  Users,
  MessageSquare,
  Mail,
  BarChart3,
  LogOut,
  X,
  Compass,
  Send,
  Share2, 
  HelpCircle, 
  History 
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const mainManagementNav = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Package Manager', path: '/packages', icon: Package },
    { label: 'Gallery Manager', path: '/gallery', icon: ImageIcon },
  ];

  const communicationsNav = [
    { label: 'Inquiries', path: '/inquiries', icon: Mail },
    { label: 'Subscribers', path: '/subscribers', icon: Users },
    { label: 'SMS Campaigns', path: '/sms', icon: Send },
    { label: 'Booking Leads', path: '/leads', icon: BarChart3 },
  ];

  const settingsNav = [
    { label: 'Social Media', path: '/settings/social', icon: Share2 },
    { label: 'Team Members', path: '/settings/team-members', icon: Users },
    { label: 'FAQs', path: '/settings/faqs', icon: HelpCircle },
    { label: 'Price Logs', path: '/settings/price-logs', icon: History },
  ];

  const renderNavGroup = (title: string, items: Array<{ label: string; path: string; icon: any }>) => (
    <div className="mb-4">
      <div className="px-4 mb-2 text-[10px] uppercase tracking-wider text-[#9CA3AF] font-bold">
        {title}
      </div>
      <div className="space-[#1F2937] space-y-0.5">
        {items.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center px-6 py-3 transition-colors gap-3 ${
                isActive
                  ? 'bg-[#C8102E] text-white font-bold shadow-xs'
                  : 'text-gray-300 hover:bg-[#1F2937] hover:text-white'
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#9CA3AF]'}`} />
              <span className="text-sm truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-[#111827]/80 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#111827] text-white flex flex-col shrink-0 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-[#ffffff15] flex items-center justify-between bg-[#111827]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C8102E] rounded-lg flex items-center justify-center shadow-lg text-white">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-extrabold leading-tight tracking-wide text-base">DELTA TRAVEL</h1>
              <p className="text-[#FC8181] text-[10px] tracking-widest uppercase font-bold">& TOUR • ADMIN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Area */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {renderNavGroup('Main Management', mainManagementNav)}
          {renderNavGroup('Communications & Leads', communicationsNav)}
          {renderNavGroup('Settings', settingsNav)}
        </nav>

        {/* User Card Footer */}
        <div className="p-4 bg-[#0F172A] border-t border-[#ffffff15]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C8102E] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
              {user?.username ? user.username.substring(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.username || 'Admin'}</p>
              <p className="text-[10px] text-[#FC8181] uppercase font-bold">Admin</p>
            </div>
            <button
              onClick={() => logout('Logged out successfully')}
              title="Sign Out"
              className="ml-auto text-white/60 hover:text-[#C8102E] p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};