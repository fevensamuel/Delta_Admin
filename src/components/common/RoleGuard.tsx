import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RoleGuardProps {
  module: string;
  action?: 'view' | 'create' | 'edit' | 'delete' | 'send' | 'import';
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ module, action = 'view', children }) => {
  const { hasPermission, user, switchRoleForDemo } = useAuth();

  if (hasPermission(module, action)) {
    return <>{children}</>;
  }

  return (
    <div className="bg-white rounded-2xl border border-amber-200/80 p-8 text-center max-w-xl mx-auto my-12 shadow-sm">
      <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-slate-900">Access Restricted</h3>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
        Your current role (<span className="font-semibold text-amber-700">{user?.role}</span>) does not have permission to perform <span className="font-semibold">{action}</span> on the <span className="font-semibold">{module}</span> module.
      </p>

      <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
        <p className="font-semibold text-slate-800 mb-2">Evaluator Demo Switcher:</p>
        <div className="flex justify-center gap-2">
          <button
            onClick={() => switchRoleForDemo('SuperAdmin')}
            className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg font-medium hover:bg-emerald-800 transition-colors"
          >
            Switch to SuperAdmin
          </button>
          <button
            onClick={() => switchRoleForDemo('Admin')}
            className="px-3 py-1.5 bg-sky-700 text-white rounded-lg font-medium hover:bg-sky-800 transition-colors"
          >
            Switch to Admin
          </button>
        </div>
      </div>

      <div className="mt-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-emerald-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
};
