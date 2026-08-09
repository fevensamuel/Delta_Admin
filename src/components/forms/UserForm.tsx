import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface UserFormProps {
  initialData?: User;
  onSubmit: (data: { username: string; email: string; password?: string; role: UserRole; status: 'Active' | 'Inactive' }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const { showToast } = useToast();

  const [username, setUsername] = useState(initialData?.username || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(initialData?.role || 'Admin');
  const [status, setStatus] = useState<'Active' | 'Inactive'>(initialData?.status || 'Active');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    // Validation
    if (!username.trim()) {
      showToast('error', 'Username is required');
      return;
    }
    if (!email.trim()) {
      showToast('error', 'Email is required');
      return;
    }

    // Password is required for new users
    if (!initialData && (!password || password.length < 6)) {
      setPasswordError('Password must be at least 6 characters for new users');
      showToast('error', 'Password must be at least 6 characters for new users');
      return;
    }

    // Log what we're submitting for debugging
    console.log('📤 UserForm submitting:', {
      username: username.trim(),
      email: email.trim(),
      password: password ? '***' : '(empty)',
      role,
      status,
      isEdit: !!initialData
    });

    onSubmit({
      username: username.trim(),
      email: email.trim(),
      password: password || undefined,
      role,
      status
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-lg font-bold text-slate-900">{initialData ? 'Edit User Credentials' : 'Create Admin User'}</h3>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Username *</label>
        <input
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. delta_admin"
          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1A5B4B]"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. user@deltatravel.com"
          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1A5B4B]"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          {initialData ? 'New Password (leave blank to keep current)' : 'Password *'}
        </label>
        <input
          type="password"
          required={!initialData}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError('');
          }}
          placeholder={initialData ? '•••••••• (optional)' : '•••••••• (min 6 chars)'}
          className={`w-full px-3.5 py-2 rounded-xl border ${
            passwordError ? 'border-red-500' : 'border-slate-300'
          } text-sm focus:ring-2 focus:ring-[#1A5B4B]`}
        />
        {passwordError && (
          <p className="text-red-500 text-[10px] mt-1">{passwordError}</p>
        )}
        {!initialData && (
          <p className="text-[10px] text-slate-400 mt-1">Password must be at least 6 characters</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Role *</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
          >
            <option value="SuperAdmin">SuperAdmin</option>
            <option value="Admin">Admin</option>
            <option value="Editor">Editor</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2 rounded-xl bg-[#1A5B4B] text-white text-sm font-semibold hover:bg-[#14483B] shadow-sm disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {initialData ? 'Update Account' : 'Create User'}
        </button>
      </div>
    </form>
  );
};