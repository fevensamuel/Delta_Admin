// src/config/permissions.ts
//
// Single source of truth for Role-Based Access Control (RBAC).
//
// Every controllable admin page/module gets a permission "key" here.
// - The Sidebar uses this list to decide which nav links a given admin can see.
// - The route guard (routes.tsx) uses it to block direct URL access to a page
//   the logged-in admin hasn't been granted.
// - The "Admin Users" screen (SuperAdmin only) uses it to render the
//   grant/revoke checkboxes when creating or editing an admin account.
//
// The SuperAdmin role always has access to everything and is never limited
// by this list — see hasPermission() in AuthContext.tsx.

export interface PermissionDef {
  key: string;
  label: string;
  group: string;
}

export const PERMISSIONS: PermissionDef[] = [
  { key: 'dashboard', label: 'Dashboard', group: 'Main Management' },
  { key: 'packages', label: 'Package Manager', group: 'Main Management' },
  { key: 'gallery', label: 'Gallery Manager', group: 'Main Management' },

  { key: 'inquiries', label: 'Inquiries', group: 'Communications & Leads' },
  { key: 'flight-inquiries', label: 'Flight Inquiries', group: 'Communications & Leads' },
  { key: 'subscribers', label: 'Subscribers', group: 'Communications & Leads' },
  { key: 'sms', label: 'SMS Campaigns', group: 'Communications & Leads' },
  { key: 'leads', label: 'Booking Leads', group: 'Communications & Leads' },

  { key: 'settings.contact', label: 'Contact Settings', group: 'Settings' },
  { key: 'settings.social', label: 'Social Media', group: 'Settings' },
  { key: 'settings.audio', label: 'Audio / Nasheed', group: 'Settings' },
  { key: 'settings.team-members', label: 'Team Members', group: 'Settings' },
  { key: 'settings.office-images', label: 'Office Images', group: 'Settings' },
  { key: 'settings.testimonials', label: 'Testimonials', group: 'Settings' },
  { key: 'settings.faqs', label: 'FAQs', group: 'Settings' },
  { key: 'settings.price-logs', label: 'Price Logs', group: 'Settings' },
  // Not assignable to other admins — SuperAdmin-only, kept out of PERMISSIONS
  // on purpose so it never appears as a grantable checkbox. Guarded directly
  // via isSuperAdmin in routes.tsx / Sidebar.tsx instead.
];

export const PERMISSION_GROUPS: string[] = Array.from(
  new Set(PERMISSIONS.map((p) => p.group))
);

export const ALL_PERMISSION_KEYS: string[] = PERMISSIONS.map((p) => p.key);

export const getPermissionsByGroup = (group: string): PermissionDef[] =>
  PERMISSIONS.filter((p) => p.group === group);
