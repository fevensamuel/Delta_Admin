import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminUsersApi,
  createAdminUserApi,
  updateAdminUserApi,
  updateAdminPermissionsApi,
  setAdminStatusApi,
  deleteAdminUserApi,
} from '../../api/adminUsers';
import { User, UserRole } from '../../types';
import { PERMISSION_GROUPS, getPermissionsByGroup, ALL_PERMISSION_KEYS } from '../../config/permissions';
import {
  Plus,
  Trash2,
  Save,
  X,
  Edit,
  Loader2,
  ShieldCheck,
  KeyRound,
  UserCog,
} from 'lucide-react';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const emptyForm = {
  username: '',
  email: '',
  password: '',
  role: 'Admin' as UserRole,
  permissions: [] as string[],
};

export const AdminUsers: React.FC = () => {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();

  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Row-level: which admin's permission editor is expanded, and its draft state
  const [permEditingId, setPermEditingId] = useState<string | null>(null);
  const [permDraft, setPermDraft] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Row-level: profile editing (username/email/password)
  const [profileEditingId, setProfileEditingId] = useState<string | null>(null);
  const [profileDraft, setProfileDraft] = useState({ username: '', email: '', password: '' });

  const [adminToDelete, setAdminToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsersApi();
      setAdmins(data);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const togglePermInForm = (key: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const handleCreate = async () => {
    if (!form.username.trim() || !form.email.trim() || !form.password.trim()) {
      showToast('error', 'Username, email, and password are required');
      return;
    }
    if (form.password.length < 6) {
      showToast('error', 'Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createAdminUserApi({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        permissions: form.role === 'SuperAdmin' ? ALL_PERMISSION_KEYS : form.permissions,
      });
      setAdmins((prev) => [...prev, created]);
      setForm(emptyForm);
      setShowAddForm(false);
      showToast('success', `Admin "${created.username}" created successfully!`);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to create admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditPermissions = (admin: User) => {
    setPermEditingId(admin.id);
    setPermDraft(admin.permissions || []);
  };

  const togglePermInDraft = (key: string) => {
    setPermDraft((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  };

  const savePermissions = async (admin: User) => {
    setSavingPermissions(true);
    try {
      const updated = await updateAdminPermissionsApi(admin.id, permDraft);
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? updated : a)));
      showToast('success', `Access updated for "${admin.username}"`);
      setPermEditingId(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  const startEditProfile = (admin: User) => {
    setProfileEditingId(admin.id);
    setProfileDraft({ username: admin.username, email: admin.email, password: '' });
  };

  const saveProfile = async (admin: User) => {
    const payload: any = {};
    if (profileDraft.username.trim() && profileDraft.username.trim() !== admin.username) {
      payload.username = profileDraft.username.trim();
    }
    if (profileDraft.email.trim() && profileDraft.email.trim() !== admin.email) {
      payload.email = profileDraft.email.trim();
    }
    if (profileDraft.password.trim()) {
      if (profileDraft.password.trim().length < 6) {
        showToast('error', 'Password must be at least 6 characters');
        return;
      }
      payload.password = profileDraft.password.trim();
    }
    if (Object.keys(payload).length === 0) {
      setProfileEditingId(null);
      return;
    }
    try {
      const updated = await updateAdminUserApi(admin.id, payload);
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? updated : a)));
      showToast('success', `Profile updated for "${updated.username}"`);
      setProfileEditingId(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update profile');
    }
  };

  const toggleStatus = async (admin: User) => {
    if (admin.id === currentUser?.id) {
      showToast('error', "You can't deactivate your own account");
      return;
    }
    const nextActive = !(admin.isActive !== false);
    try {
      const updated = await setAdminStatusApi(admin.id, nextActive);
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? updated : a)));
      showToast('success', `${updated.username} ${nextActive ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!adminToDelete) return;
    if (adminToDelete.id === currentUser?.id) {
      showToast('error', "You can't delete your own account");
      setAdminToDelete(null);
      return;
    }
    setIsDeleting(true);
    try {
      await deleteAdminUserApi(adminToDelete.id);
      setAdmins((prev) => prev.filter((a) => a.id !== adminToDelete.id));
      showToast('success', 'Admin account deleted');
      setAdminToDelete(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete admin');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading admin users..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#C8102E]" />
            Admin Users & Access Control
          </h1>
          <p className="text-sm text-[#718096] mt-1">
            Create admin accounts and choose exactly which pages each one can access. Super Admins
            always have full access.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="px-4 py-2 bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Admin
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 space-y-4">
          <h3 className="font-bold text-[#111827] text-sm">New Admin Account</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
            />
            <input
              type="password"
              placeholder="Temporary password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#718096] uppercase tracking-wide">Role</label>
            <div className="flex items-center gap-4 mt-1.5">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  checked={form.role === 'Admin'}
                  onChange={() => setForm((p) => ({ ...p, role: 'Admin' }))}
                />
                Admin
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  checked={form.role === 'SuperAdmin'}
                  onChange={() => setForm((p) => ({ ...p, role: 'SuperAdmin' }))}
                />
                Super Admin
              </label>
            </div>
          </div>

          {form.role === 'Admin' ? (
            <div>
              <label className="text-xs font-bold text-[#718096] uppercase tracking-wide">
                Page Access
              </label>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group} className="border border-[#E2E8F0] rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase text-[#9CA3AF] mb-2">{group}</p>
                    <div className="space-y-1.5">
                      {getPermissionsByGroup(group).map((perm) => (
                        <label key={perm.key} className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.permissions.includes(perm.key)}
                            onChange={() => togglePermInForm(perm.key)}
                          />
                          {perm.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              Super Admins automatically get access to every page, including this one.
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Create Admin
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setForm(emptyForm);
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
        {admins.length === 0 ? (
          <div className="px-4 py-12 text-center text-[#718096]">
            <UserCog className="w-12 h-12 mx-auto text-[#E2E8F0] mb-3" />
            <p className="font-semibold">No admin accounts found</p>
            <p className="text-sm">Click "Add Admin" to create one</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {admins.map((admin) => {
              const isSuper = admin.role === 'SuperAdmin';
              const isActive = admin.isActive !== false;
              const isSelf = admin.id === currentUser?.id;
              const isEditingPerms = permEditingId === admin.id;
              const isEditingProfile = profileEditingId === admin.id;

              return (
                <div key={admin.id} className="p-4 hover:bg-[#F9FAFB] transition-colors">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#111827] flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {admin.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        {isEditingProfile ? (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={profileDraft.username}
                              onChange={(e) => setProfileDraft((p) => ({ ...p, username: e.target.value }))}
                              className="w-full px-2 py-1 rounded border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E]"
                              placeholder="Username"
                            />
                            <input
                              type="email"
                              value={profileDraft.email}
                              onChange={(e) => setProfileDraft((p) => ({ ...p, email: e.target.value }))}
                              className="w-full px-2 py-1 rounded border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E]"
                              placeholder="Email"
                            />
                            <input
                              type="password"
                              value={profileDraft.password}
                              onChange={(e) => setProfileDraft((p) => ({ ...p, password: e.target.value }))}
                              className="w-full px-2 py-1 rounded border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E]"
                              placeholder="New password (optional)"
                            />
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => saveProfile(admin)}
                                className="px-3 py-1 bg-[#C8102E] hover:bg-[#A00D24] text-white text-xs font-bold rounded"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setProfileEditingId(null)}
                                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-[#111827]">{admin.username}</h3>
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-bold">
                                  You
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isSuper ? 'bg-[#C8102E]/10 text-[#C8102E]' : 'bg-blue-50 text-blue-600'
                                }`}
                              >
                                {isSuper ? 'Super Admin' : 'Admin'}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-xs text-[#718096] mt-0.5">{admin.email}</p>
                            <p className="text-[10px] text-[#9CA3AF] mt-1">
                              {isSuper
                                ? 'Full access to every page'
                                : `${(admin.permissions || []).length} of ${ALL_PERMISSION_KEYS.length} pages granted`}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {!isEditingProfile && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => startEditProfile(admin)}
                          className="p-1.5 rounded hover:bg-[#E2E8F0] text-[#718096]"
                          title="Edit profile / reset password"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {!isSuper && (
                          <button
                            onClick={() => startEditPermissions(admin)}
                            className="p-1.5 rounded hover:bg-[#E2E8F0] text-[#718096]"
                            title="Edit page access"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleStatus(admin)}
                          disabled={isSelf}
                          className="p-1.5 rounded hover:bg-[#E2E8F0] text-[#718096] disabled:opacity-30 disabled:cursor-not-allowed"
                          title={isActive ? 'Deactivate' : 'Activate'}
                        >
                          {isActive ? <X className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => setAdminToDelete(admin)}
                          disabled={isSelf}
                          className="p-1.5 rounded hover:bg-rose-50 text-[#C8102E] disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditingPerms && (
                    <div className="mt-4 border-t border-[#E2E8F0] pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {PERMISSION_GROUPS.map((group) => (
                          <div key={group} className="border border-[#E2E8F0] rounded-lg p-3">
                            <p className="text-[10px] font-bold uppercase text-[#9CA3AF] mb-2">{group}</p>
                            <div className="space-y-1.5">
                              {getPermissionsByGroup(group).map((perm) => (
                                <label key={perm.key} className="flex items-center gap-2 text-xs cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={permDraft.includes(perm.key)}
                                    onChange={() => togglePermInDraft(perm.key)}
                                  />
                                  {perm.label}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => savePermissions(admin)}
                          disabled={savingPermissions}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
                        >
                          {savingPermissions ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" /> Save Access
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setPermEditingId(null)}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <X className="w-4 h-4" /> Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <p className="font-bold">💡 How it works:</p>
        <ul className="list-disc list-inside space-y-1 text-xs mt-1">
          <li>Super Admins always see every page and can manage other admin accounts here.</li>
          <li>Regular Admins only see the sidebar links you grant them — everything else redirects to an access-restricted screen.</li>
          <li>You can't deactivate or delete your own account.</li>
        </ul>
      </div>

      <ConfirmModal
        isOpen={!!adminToDelete}
        title="Delete Admin Account?"
        message={`Are you sure you want to permanently delete "${adminToDelete?.username}"? This cannot be undone.`}
        confirmLabel="Delete Admin"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setAdminToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
