import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export const AccessDenied: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 text-[#C8102E] flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-extrabold text-[#111827]">Access Restricted</h2>
      <p className="text-sm text-[#718096] mt-2 max-w-sm">
        You don't have permission to view this page. Ask a Super Admin to grant you access if you
        believe this is a mistake.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 px-4 py-2 bg-[#C8102E] hover:bg-[#A00D24] text-white text-sm font-bold rounded-lg transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
};
