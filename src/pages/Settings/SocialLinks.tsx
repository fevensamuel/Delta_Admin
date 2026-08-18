import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { getSocialLinksApi, createSocialLinkApi, updateSocialLinkApi, deleteSocialLinkApi } from '../../api/socialLinks';
import { SocialLink } from '../../types';
import { Edit, Plus, Trash2, X, Check, Loader2 } from 'lucide-react';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const SocialLinks: React.FC = () => {
  const { showToast } = useToast();
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlatform, setNewPlatform] = useState('');
  const [newUrl, setNewUrl] = useState('');
  
  // Delete confirmation state
  const [linkToDelete, setLinkToDelete] = useState<SocialLink | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    setLoading(true);
    try {
      const data = await getSocialLinksApi();
      setLinks(data);
    } catch (error) {
      showToast('error', 'Failed to load social links');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newPlatform.trim() || !newUrl.trim()) {
      showToast('error', 'Platform and URL are required');
      return;
    }

    try {
      const newLink = await createSocialLinkApi({
        platform: newPlatform.trim(),
        url: newUrl.trim(),
        isActive: true,
        icon: newPlatform.trim().charAt(0).toUpperCase() + newPlatform.trim().slice(1)
      });
      setLinks(prev => [...prev, newLink]);
      setNewPlatform('');
      setNewUrl('');
      setShowAddForm(false);
      showToast('success', 'Social link added successfully!');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to add social link');
    }
  };

  const handleUpdate = async (id: string, data: Partial<SocialLink>) => {
    try {
      const updated = await updateSocialLinkApi(id, data);
      setLinks(prev => prev.map(l => l.id === id ? updated : l));
      showToast('success', 'Social link updated successfully');
      setEditingId(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update social link');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!linkToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSocialLinkApi(linkToDelete.id);
      setLinks(prev => prev.filter(l => l.id !== linkToDelete.id));
      showToast('success', 'Social link deleted successfully');
      setLinkToDelete(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete social link');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleActive = async (link: SocialLink) => {
    await handleUpdate(link.id, { isActive: !link.isActive });
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#C8102E]" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">Social Media Links</h2>
          <p className="text-sm text-[#718096]">Manage social media links displayed on the website</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-xs rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Social Link
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-[#F9FAFB] border border-[#E2E8F0] rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Platform (e.g., youtube, twitter)"
              value={newPlatform}
              onChange={(e) => setNewPlatform(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
            />
            <input
              type="url"
              placeholder="URL (e.g., https://youtube.com/deltatravel)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
            >
              <Check className="w-4 h-4" /> Add
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewPlatform(''); setNewUrl(''); }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F9FAFB] border-b border-[#E2E8F0]">
            <tr>
              <th className="px-4 py-3 font-bold text-[#111827]">Platform</th>
              <th className="px-4 py-3 font-bold text-[#111827]">URL</th>
              <th className="px-4 py-3 font-bold text-[#111827] text-center">Status</th>
              <th className="px-4 py-3 font-bold text-[#111827] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {links.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[#718096]">
                  No social links found. Click "Add Social Link" to add one.
                </td>
              </tr>
            ) : (
              links.map((link) => (
                <tr key={link.id} className="hover:bg-[#F9FAFB]">
                  <td className="px-4 py-3 font-semibold text-[#111827] capitalize">
                    {link.platform}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === link.id ? (
                      <input
                        type="url"
                        defaultValue={link.url}
                        onBlur={(e) => {
                          const newUrl = e.target.value.trim();
                          if (newUrl && newUrl !== link.url) {
                            handleUpdate(link.id, { url: newUrl });
                          } else {
                            setEditingId(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const newUrl = (e.target as HTMLInputElement).value.trim();
                            if (newUrl && newUrl !== link.url) {
                              handleUpdate(link.id, { url: newUrl });
                            } else {
                              setEditingId(null);
                            }
                          }
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="w-full px-2 py-1 rounded border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
                        autoFocus
                      />
                    ) : (
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[#C8102E] hover:underline">
                        {link.url}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(link)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                        link.isActive !== false
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {link.isActive !== false ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {editingId === link.id ? (
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-sm text-[#718096] hover:text-[#111827]"
                      >
                        Cancel
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingId(link.id)}
                          className="p-1.5 rounded hover:bg-[#F9FAFB] text-[#718096]"
                          title="Edit URL"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setLinkToDelete(link)}
                          className="p-1.5 rounded hover:bg-rose-50 text-[#C8102E]"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <p className="font-bold">💡 Tip:</p>
        <p>Social links appear in the footer and contact sections of the website. Toggle "Inactive" to hide a platform.</p>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!linkToDelete}
        title="Delete Social Link?"
        message={`Are you sure you want to delete the "${linkToDelete?.platform}" social link?`}
        confirmLabel="Delete Link"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setLinkToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};