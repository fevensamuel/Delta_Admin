import React, { useEffect, useState, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { getTeamMembersApi, createTeamMemberApi, updateTeamMemberApi, deleteTeamMemberApi } from '../../api/teamMembers';
import { TeamMember } from '../../types';
import { Plus, Trash2, Save, X, Edit, Loader2, Upload, User } from 'lucide-react';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const TeamMembers: React.FC = () => {
  const { showToast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete confirmation state
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    bio: '',
    order: 0,
    isActive: true
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await getTeamMembersApi();
      setMembers(data);
    } catch (error) {
      showToast('error', 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'Image size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showToast('error', 'Please select an image file');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = async () => {
    if (!newMember.name.trim() || !newMember.role.trim() || !newMember.bio.trim()) {
      showToast('error', 'Name, role, and bio are required');
      return;
    }

    if (!imageFile) {
      showToast('error', 'Please select a profile image');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', newMember.name.trim());
      formData.append('role', newMember.role.trim());
      formData.append('bio', newMember.bio.trim());
      formData.append('order', String(members.length + 1));
      formData.append('isActive', 'true');
      formData.append('image', imageFile);

      const created = await createTeamMemberApi(formData);
      setMembers(prev => [...prev, created]);
      setNewMember({ name: '', role: '', bio: '', order: 0, isActive: true });
      setImageFile(null);
      setImagePreview('');
      setShowAddForm(false);
      showToast('success', 'Team member added successfully!');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to add team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string, data: Partial<TeamMember>) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      const updated = await updateTeamMemberApi(id, formData);
      setMembers(prev => prev.map(m => m.id === id ? updated : m));
      showToast('success', 'Team member updated successfully');
      setEditingId(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update team member');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTeamMemberApi(memberToDelete.id);
      setMembers(prev => prev.filter(m => m.id !== memberToDelete.id));
      showToast('success', 'Team member deleted successfully');
      setMemberToDelete(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete team member');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleActive = async (member: TeamMember) => {
    const formData = new FormData();
    formData.append('isActive', String(!member.isActive));
    try {
      const updated = await updateTeamMemberApi(member.id, formData);
      setMembers(prev => prev.map(m => m.id === member.id ? updated : m));
      showToast('success', `Team member ${updated.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update team member');
    }
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const newMembers = [...members];
    [newMembers[index], newMembers[index - 1]] = [newMembers[index - 1], newMembers[index]];
    setMembers(newMembers);
    for (let i = 0; i < newMembers.length; i++) {
      const formData = new FormData();
      formData.append('order', String(i + 1));
      await updateTeamMemberApi(newMembers[i].id, formData);
    }
    showToast('success', 'Order updated successfully');
  };

  const moveDown = async (index: number) => {
    if (index === members.length - 1) return;
    const newMembers = [...members];
    [newMembers[index], newMembers[index + 1]] = [newMembers[index + 1], newMembers[index]];
    setMembers(newMembers);
    for (let i = 0; i < newMembers.length; i++) {
      const formData = new FormData();
      formData.append('order', String(i + 1));
      await updateTeamMemberApi(newMembers[i].id, formData);
    }
    showToast('success', 'Order updated successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8102E]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">Team Members</h2>
          <p className="text-sm text-[#718096]">Manage the "Meet Our Scholars & Mutawwif Team" section</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-xs rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Team Member
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-[#F9FAFB] border border-[#E2E8F0] rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Full Name"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
            />
            <input
              type="text"
              placeholder="Role (e.g., Head Mutawwif)"
              value={newMember.role}
              onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
            />
          </div>
          <textarea
            placeholder="Bio / Description"
            value={newMember.bio}
            onChange={(e) => setNewMember({ ...newMember, bio: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
          />
          
          {/* Image Upload */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-[#718096] mb-1">Profile Image *</label>
              <div 
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                  imagePreview ? 'border-emerald-500 bg-emerald-50' : 'border-[#E2E8F0] hover:border-[#C8102E]'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                {imagePreview ? (
                  <div className="flex items-center justify-center gap-3">
                    <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500" />
                    <span className="text-sm text-[#718096]">Click to change image</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="w-8 h-8 text-[#718096]" />
                    <span className="text-sm text-[#718096]">Click to upload image</span>
                    <span className="text-xs text-[#718096]">JPG, PNG, WEBP (max 5MB)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Add Member
                </>
              )}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewMember({ name: '', role: '', bio: '', order: 0, isActive: true }); setImageFile(null); setImagePreview(''); }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
        {members.length === 0 ? (
          <div className="px-4 py-12 text-center text-[#718096]">
            <User className="w-12 h-12 mx-auto text-[#E2E8F0] mb-3" />
            <p className="font-semibold">No team members found</p>
            <p className="text-sm">Click "Add Team Member" to create one</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {members.map((member, index) => {
              const isEditing = editingId === member.id;

              return (
                <div key={member.id} className="p-4 hover:bg-[#F9FAFB] transition-colors">
                  <div className="flex items-start gap-4">
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#E2E8F0] flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64x64/cccccc/666666?text=?';
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            defaultValue={member.name}
                            onBlur={(e) => handleUpdate(member.id, { name: e.target.value })}
                            className="w-full px-2 py-1 rounded border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E]"
                            placeholder="Name"
                          />
                          <input
                            type="text"
                            defaultValue={member.role}
                            onBlur={(e) => handleUpdate(member.id, { role: e.target.value })}
                            className="w-full px-2 py-1 rounded border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E]"
                            placeholder="Role"
                          />
                          <textarea
                            defaultValue={member.bio}
                            onBlur={(e) => handleUpdate(member.id, { bio: e.target.value })}
                            rows={2}
                            className="w-full px-2 py-1 rounded border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E]"
                            placeholder="Bio"
                          />
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 bg-[#C8102E] hover:bg-[#A00D24] text-white text-xs font-bold rounded"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-[#111827]">{member.name}</h3>
                              <p className="text-sm text-[#C8102E] font-semibold">{member.role}</p>
                              <p className="text-xs text-[#718096] mt-1">{member.bio}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                member.isActive !== false
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {member.isActive !== false ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            <button
                              onClick={() => setEditingId(member.id)}
                              className="p-1.5 rounded hover:bg-[#E2E8F0] text-[#718096]"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => toggleActive(member)}
                              className="p-1.5 rounded hover:bg-[#E2E8F0] text-[#718096]"
                              title={member.isActive !== false ? 'Deactivate' : 'Activate'}
                            >
                              {member.isActive !== false ? <X className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => setMemberToDelete(member)}
                              className="p-1.5 rounded hover:bg-rose-50 text-[#C8102E]"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-px h-4 bg-[#E2E8F0] mx-1" />
                            <button
                              onClick={() => moveUp(index)}
                              disabled={index === 0}
                              className="p-1.5 rounded hover:bg-[#E2E8F0] text-[#718096] disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move Up"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => moveDown(index)}
                              disabled={index === members.length - 1}
                              className="p-1.5 rounded hover:bg-[#E2E8F0] text-[#718096] disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move Down"
                            >
                              ↓
                            </button>
                            <span className="text-[10px] text-[#718096] ml-1">#{index + 1}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <p className="font-bold">💡 Tip:</p>
        <ul className="list-disc list-inside space-y-1 text-xs mt-1">
          <li>Team members appear on the About Us page in the "Meet Our Scholars & Mutawwif Team" section</li>
          <li>Upload square images (recommended: 400x400px) for best results</li>
          <li>Use the up/down arrows to reorder team members</li>
          <li>Set a member as "Inactive" to hide them from the public website</li>
        </ul>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!memberToDelete}
        title="Delete Team Member?"
        message={`Are you sure you want to delete "${memberToDelete?.name}" from the team?`}
        confirmLabel="Delete Member"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setMemberToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};