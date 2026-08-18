import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/common/Sidebar';
import { TopBar } from './components/common/TopBar';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Lazy load page components
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const PackageList = lazy(() => import('./pages/packages/PackageList').then((m) => ({ default: m.PackageList })));
const PackageFormPage = lazy(() => import('./pages/packages/PackageFormPage').then((m) => ({ default: m.PackageFormPage })));
const GalleryGrid = lazy(() => import('./pages/gallery/GalleryGrid').then((m) => ({ default: m.GalleryGrid })));
const GalleryFormPage = lazy(() => import('./pages/gallery/GalleryFormPage').then((m) => ({ default: m.GalleryFormPage })));
const BulkUploadPage = lazy(() => import('./pages/gallery/BulkUploadPage').then((m) => ({ default: m.BulkUploadPage })));
const SubscriberManager = lazy(() => import('./pages/subscribers/SubscriberManager').then((m) => ({ default: m.SubscriberManager })));
const SmsCampaignPage = lazy(() => import('./pages/sms/SmsCampaignPage').then((m) => ({ default: m.SmsCampaignPage })));
const InquiryManager = lazy(() => import('./pages/inquiries/InquiryManager').then((m) => ({ default: m.InquiryManager })));
const BookingLeads = lazy(() => import('./pages/leads/BookingLeads').then((m) => ({ default: m.BookingLeads })));

// Settings Pages
const SocialLinks = lazy(() => import('./pages/Settings/SocialLinks').then((m) => ({ default: m.SocialLinks })));
const Faqs = lazy(() => import('./pages/Settings/Faqs').then((m) => ({ default: m.Faqs })));
const TeamMembers = lazy(() => import('./pages/Settings/TeamMembers').then((m) => ({ default: m.TeamMembers }))); // ADD THIS LINE
const PriceLogs = lazy(() => import('./pages/Settings/PriceLogs').then((m) => ({ default: m.PriceLogs })));

// Protected App Layout Wrapper
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  if (isLoading) {
    return <LoadingSpinner text="Authenticating Delta Travel Admin..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC] text-[#1A1A2E] flex overflow-x-hidden font-sans antialiased">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all">
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
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
        {/* Public Login */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        {/* Protected Admin Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />

        {/* Package Management */}
        <Route
          path="/packages"
          element={
            <ProtectedLayout>
              <PackageList />
            </ProtectedLayout>
          }
        />
        <Route
          path="/packages/new"
          element={
            <ProtectedLayout>
              <PackageFormPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/packages/:id/edit"
          element={
            <ProtectedLayout>
              <PackageFormPage />
            </ProtectedLayout>
          }
        />

        {/* Gallery Management */}
        <Route
          path="/gallery"
          element={
            <ProtectedLayout>
              <GalleryGrid />
            </ProtectedLayout>
          }
        />
        <Route
          path="/gallery/create"
          element={
            <ProtectedLayout>
              <GalleryFormPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/gallery/edit/:id"
          element={
            <ProtectedLayout>
              <GalleryFormPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/gallery/bulk-upload"
          element={
            <ProtectedLayout>
              <BulkUploadPage />
            </ProtectedLayout>
          }
        />

        {/* Lead & Marketing Modules */}
        <Route
          path="/subscribers"
          element={
            <ProtectedLayout>
              <SubscriberManager />
            </ProtectedLayout>
          }
        />
        <Route
          path="/sms"
          element={
            <ProtectedLayout>
              <SmsCampaignPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/inquiries"
          element={
            <ProtectedLayout>
              <InquiryManager />
            </ProtectedLayout>
          }
        />
        <Route
          path="/leads"
          element={
            <ProtectedLayout>
              <BookingLeads />
            </ProtectedLayout>
          }
        />

        {/* Settings Routes */}
        <Route
          path="/settings/social"
          element={
            <ProtectedLayout>
              <SocialLinks />
            </ProtectedLayout>
          }
        />
        <Route
          path="/settings/faqs"
          element={
            <ProtectedLayout>
              <Faqs />
            </ProtectedLayout>
          }
        />
        <Route
          path="/settings/team-members"
          element={
            <ProtectedLayout>
              <TeamMembers />
            </ProtectedLayout>
          }
        />
        <Route
          path="/settings/price-logs"
          element={
            <ProtectedLayout>
              <PriceLogs />
            </ProtectedLayout>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};