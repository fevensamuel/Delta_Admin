import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/common/Sidebar';
import { TopBar } from './components/common/TopBar';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { AccessDenied } from './components/common/AccessDenied';

const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const PackageList = lazy(() => import('./pages/packages/PackageList').then((m) => ({ default: m.PackageList })));
const PackageFormPage = lazy(() => import('./pages/packages/PackageFormPage').then((m) => ({ default: m.PackageFormPage })));
const PackagePersons = lazy(() => import('./pages/packages/PackagePersons').then((m) => ({ default: m.PackagePersons })));
const GalleryGrid = lazy(() => import('./pages/gallery/GalleryGrid').then((m) => ({ default: m.GalleryGrid })));
const GalleryFormPage = lazy(() => import('./pages/gallery/GalleryFormPage').then((m) => ({ default: m.GalleryFormPage })));
const BulkUploadPage = lazy(() => import('./pages/gallery/BulkUploadPage').then((m) => ({ default: m.BulkUploadPage })));
const SubscriberManager = lazy(() => import('./pages/subscribers/SubscriberManager').then((m) => ({ default: m.SubscriberManager })));
const SmsCampaignPage = lazy(() => import('./pages/sms/SmsCampaignPage').then((m) => ({ default: m.SmsCampaignPage })));
const InquiryManager = lazy(() => import('./pages/inquiries/InquiryManager').then((m) => ({ default: m.InquiryManager })));
const BookingLeads = lazy(() => import('./pages/leads/BookingLeads').then((m) => ({ default: m.BookingLeads })));
const FlightInquiries = lazy(() => import('./pages/leads/FlightInquiries').then((m) => ({ default: m.FlightInquiries })));

// Settings Pages
const SocialLinks = lazy(() => import('./pages/Settings/SocialLinks').then((m) => ({ default: m.SocialLinks })));
const Faqs = lazy(() => import('./pages/Settings/Faqs').then((m) => ({ default: m.Faqs })));
const TeamMembers = lazy(() => import('./pages/Settings/TeamMembers').then((m) => ({ default: m.TeamMembers })));
const OfficeImages = lazy(() => import('./pages/Settings/OfficeImages').then((m) => ({ default: m.OfficeImages })));
const Testimonials = lazy(() => import('./pages/Settings/Testimonials').then((m) => ({ default: m.Testimonials })));
const PriceLogs = lazy(() => import('./pages/Settings/PriceLogs').then((m) => ({ default: m.PriceLogs })));
const ContactSettings = lazy(() => import('./pages/Settings/ContactSettings').then((m) => ({ default: m.ContactSettings })));
const AudioManagement = lazy(() => import('./pages/Settings/AudioManagement').then((m) => ({ default: m.AudioManagement })));
const AdminUsers = lazy(() => import('./pages/Settings/AdminUsers').then((m) => ({ default: m.AdminUsers })));

interface ProtectedLayoutProps {
  children: React.ReactNode;
  // Permission key required to view this page (see src/config/permissions.ts).
  // Omit for pages every authenticated admin may see.
  permission?: string;
  // When true, only the SuperAdmin role may view this page, regardless of
  // per-page permissions (used for the Admin Users management screen).
  superAdminOnly?: boolean;
}

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children, permission, superAdminOnly }) => {
  const { user, isAuthenticated, isLoading, hasPermission, isSuperAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  if (isLoading) {
    return <LoadingSpinner text="Authenticating Delta Travel Admin..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const isAllowed = superAdminOnly
    ? isSuperAdmin
    : !permission || hasPermission(permission);

  return (
    <div className="min-h-screen bg-[#F7FAFC] text-[#1A1A2E] flex overflow-x-hidden font-sans antialiased">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all">
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isAllowed ? children : <AccessDenied />}
        </main>
      </div>
    </div>
  );
};

export const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<LoadingSpinner text="Loading Module..." />}>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        <Route path="/dashboard" element={<ProtectedLayout permission="dashboard"><Dashboard /></ProtectedLayout>} />

        {/* Package Management */}
        <Route path="/packages" element={<ProtectedLayout permission="packages"><PackageList /></ProtectedLayout>} />
        <Route path="/packages/new" element={<ProtectedLayout permission="packages"><PackageFormPage /></ProtectedLayout>} />
        <Route path="/packages/:id/edit" element={<ProtectedLayout permission="packages"><PackageFormPage /></ProtectedLayout>} />
        <Route path="/packages/:id/persons" element={<ProtectedLayout permission="packages"><PackagePersons /></ProtectedLayout>} />

        {/* Gallery */}
        <Route path="/gallery" element={<ProtectedLayout permission="gallery"><GalleryGrid /></ProtectedLayout>} />
        <Route path="/gallery/create" element={<ProtectedLayout permission="gallery"><GalleryFormPage /></ProtectedLayout>} />
        <Route path="/gallery/edit/:id" element={<ProtectedLayout permission="gallery"><GalleryFormPage /></ProtectedLayout>} />
        <Route path="/gallery/bulk-upload" element={<ProtectedLayout permission="gallery"><BulkUploadPage /></ProtectedLayout>} />

        {/* Leads & Marketing */}
        <Route path="/subscribers" element={<ProtectedLayout permission="subscribers"><SubscriberManager /></ProtectedLayout>} />
        <Route path="/sms" element={<ProtectedLayout permission="sms"><SmsCampaignPage /></ProtectedLayout>} />
        <Route path="/inquiries" element={<ProtectedLayout permission="inquiries"><InquiryManager /></ProtectedLayout>} />
        <Route path="/leads" element={<ProtectedLayout permission="leads"><BookingLeads /></ProtectedLayout>} />
        <Route path="/flight-inquiries" element={<ProtectedLayout permission="flight-inquiries"><FlightInquiries /></ProtectedLayout>} />

        {/* Settings */}
        <Route path="/settings/contact" element={<ProtectedLayout permission="settings.contact"><ContactSettings /></ProtectedLayout>} />
        <Route path="/settings/social" element={<ProtectedLayout permission="settings.social"><SocialLinks /></ProtectedLayout>} />
        <Route path="/settings/audio" element={<ProtectedLayout permission="settings.audio"><AudioManagement /></ProtectedLayout>} />
        <Route path="/settings/faqs" element={<ProtectedLayout permission="settings.faqs"><Faqs /></ProtectedLayout>} />
        <Route path="/settings/team-members" element={<ProtectedLayout permission="settings.team-members"><TeamMembers /></ProtectedLayout>} />
        <Route path="/settings/office-images" element={<ProtectedLayout permission="settings.office-images"><OfficeImages /></ProtectedLayout>} />
        <Route path="/settings/testimonials" element={<ProtectedLayout permission="settings.testimonials"><Testimonials /></ProtectedLayout>} />
        <Route path="/settings/price-logs" element={<ProtectedLayout permission="settings.price-logs"><PriceLogs /></ProtectedLayout>} />

        {/* Admin Users & Access Control (Super Admin only) */}
        <Route path="/settings/admin-users" element={<ProtectedLayout superAdminOnly><AdminUsers /></ProtectedLayout>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};