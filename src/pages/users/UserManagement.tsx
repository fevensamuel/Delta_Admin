import React, { useEffect, useState } from 'react';
import { User, UserRole } from '../../types';
import { getUsersApi, createUserApi, updateUserApi, deleteUserApi } from '../../api/users';
import { UserForm } from '../../components/forms/UserForm';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { RoleGuard } from '../../components/common/RoleGuard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserPlus, Search, ShieldCheck, Lock, Edit, Trash2, KeyRound } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal state
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getUsersApi();
      setUsers(data);
    } catch {
      showToast('error', 'Failed to load user list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUser = async (data: { username: string; email: string; password?: string; role: UserRole; status: 'Active' | 'Inactive' }) => {
    setIsSaving(true);
    try {
      if (userToEdit) {
        await updateUserApi(userToEdit.id, data);
        showToast('success', `User "${data.username}" credentials updated`);
      } else {
        await createUserApi({
          username: data.username,
          email: data.email,
          role: data.role,
          status: data.status
        });
        showToast('success', `New user "${data.username}" created!`);
      }
      setIsFormOpen(false);
      setUserToEdit(null);
      loadUsers();
    } catch {
      showToast('error', 'Failed to save user account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteUserApi(userToDelete.id);
      showToast('success', 'User account removed');
      setUserToDelete(null);
      loadUsers();
    } catch {
      showToast('error', 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return <LoadingSpinner text="Loading Admin User Accounts..." />;
  }

  return (
    <RoleGuard module="users" action="view">
      <div className="space-y-6 pb-12 animate-in fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Admin Users & RBAC Management</h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage staff login accounts, access roles (SuperAdmin, Admin, Editor) and permissions.</p>
          </div>

          <button
            onClick={() => {
              setUserToEdit(null);
              setIsFormOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-[#1A5B4B] hover:bg-[#14483B] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4 text-[#C9A84C]" /> Create New Admin User
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by username or email address..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1A5B4B]"
            />
          </div>

          <div className="flex items-center gap-2">
            {(['All', 'SuperAdmin', 'Admin', 'Editor'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  roleFilter === r
                    ? 'bg-[#1A5B4B] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="w-full max-w-lg">
              <UserForm
                initialData={userToEdit || undefined}
                onSubmit={handleSaveUser}
                onCancel={() => {
                  setIsFormOpen(false);
                  setUserToEdit(null);
                }}
                isLoading={isSaving}
              />
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-5">User Credentials</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">Account Status</th>
                  <th className="p-3.5">Last Active Login</th>
                  <th className="p-3.5 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No admin user accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-[#1A5B4B] font-bold flex items-center justify-center border border-slate-200 uppercase">
                            {usr.username.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{usr.username}</p>
                            <p className="text-[11px] text-slate-500">{usr.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            usr.role === 'SuperAdmin'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : usr.role === 'Admin'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-sky-100 text-sky-800 border border-sky-200'
                          }`}
                        >
                          {usr.role}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            usr.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {usr.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-500">
                        {usr.lastLogin || 'Never'}
                      </td>

                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setUserToEdit(usr);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                            title="Edit Credentials or Role"
                          >
                            <Edit className="w-4 h-4 text-[#1A5B4B]" />
                          </button>

                          <button
                            onClick={() => setUserToDelete(usr)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!userToDelete}
          title="Delete Admin Account?"
          message={`Are you sure you want to revoke and delete admin account "${userToDelete?.username}"?`}
          confirmLabel="Delete User Account"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setUserToDelete(null)}
          isLoading={isDeleting}
        />
      </div>
    </RoleGuard>
  );
};
