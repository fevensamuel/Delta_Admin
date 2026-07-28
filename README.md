# Delta Travel & Tour - Admin Dashboard Panel

A modern, standalone Admin Dashboard UI built for **Delta Travel & Tour**, specializing in Umrah, Hajj, and travel package management.

---

## 🎨 New Brand Identity & Color Palette

The Admin Panel styling aligns with the main website brand identity:

| Color Role | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Primary Green** | `#1A5B4B` | Header background, primary buttons, active nav items |
| **Secondary Green** | `#2D7D6B` | Hover states, secondary buttons, sub-headers |
| **Gold / Amber Accent** | `#C9A84C` | Highlights, badges, call-to-actions, active indicators |
| **Light Gold** | `#E8D5A3` | Subtle highlights and section text |
| **Dark Theme Base** | `#1A1A2E` | Key headings and modal titles |
| **Body Text Dark** | `#2D3748` | Primary text and content |
| **Text Gray** | `#718096` | Secondary labels and placeholders |
| **Border Divider** | `#E2E8F0` | Cards, tables, and modal borders |
| **Background Light** | `#F7FAFC` | Page background canvas |
| **Success / Active** | `#48BB78` | Active status badges |
| **Warning / Pending** | `#ED8936` | Pending inquiry status |
| **Error / Inactive** | `#FC8181` | Inactive status & delete actions |

---

## 🔐 User Roles & Permissions Matrix

The admin system enforces Role-Based Access Control (RBAC) across 3 tier levels:

### 1. **SuperAdmin**
- **Full System Access**: Complete read, create, edit, and delete permissions across all modules.
- **User Management**: Exclusive access to create, edit, deactivate, or delete admin user accounts (`/users`).
- **RBAC Overrides**: Can manage role permissions and view security audit logs.

### 2. **Admin**
- **Full Operational Access**: Manage Packages, Gallery Items, Inquiries, Subscribers, SMS Campaigns, and Booking Leads.
- **Content Creation & Editing**: Create and modify packages, upload gallery items, send SMS broadcasts, and update lead statuses.
- **Deletion Rights**: Can delete packages, gallery items, and subscribers.
- **Restricted**: Cannot access User Management (`/users`) or assign roles.

### 3. **Editor**
- **Content Management & Operations**: View, create, and update packages, gallery items, and customer inquiries.
- **Restricted Actions**: Cannot delete packages, gallery items, or subscribers. Cannot send bulk SMS campaigns or access User Management.

---

## 🚀 Module Overview

### 📦 Package Manager (`/packages`)
- Manage Umrah, Hajj, Economy, Standard, Premium, and VIP travel packages.
- Features multi-language title support (English, Arabic, Amharic).
- **WhatsApp Click Counter**: Tracks real-time customer WhatsApp inquiries per package to analyze popularity and lead conversion.
- Status management (`Active`, `Archived`).

### 🖼️ Website Gallery Manager (`/gallery`)
- Manage photos and videos displayed on the public Delta Travel website.
- Supports single media addition (`/gallery/create`) and **Bulk Image Upload** (`/gallery/bulk-upload`) with drag-and-drop.
- Supports media types (`Photo`, `Video`), custom video URLs, duration badges, sort ordering, and active/inactive visibility toggling.

### 📬 Inquiries & Leads (`/inquiries`, `/leads`)
- View and manage incoming website form inquiries and WhatsApp booking leads.
- Status tracking (`New`, `Contacted`, `Converted`, `Archived`).

### 📱 Subscribers & SMS Campaigns (`/subscribers`, `/sms`)
- Manage SMS subscriber opt-in contacts.
- Compose and broadcast instant SMS campaigns with template placeholders.

---

## 🛠️ Technology Stack

- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v7
- **Icons**: Lucide React
- **Charts**: Recharts
