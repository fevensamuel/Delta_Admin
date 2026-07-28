import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GalleryItem } from '../../types';
import { getGalleryItems, deleteGalleryItem, updateGalleryItem } from '../../api/gallery';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { RoleGuard } from '../../components/common/RoleGuard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Plus, Upload, Search, Filter, MapPin, Calendar, Edit, Trash2, Video, Image as ImageIcon, Play, X, ExternalLink } from 'lucide-react';

export const GalleryGrid: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Photo' | 'Video'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Video and Image player/preview modal state
  const [activeVideoItem, setActiveVideoItem] = useState<GalleryItem | null>(null);
  const [activeImageItem, setActiveImageItem] = useState<GalleryItem | null>(null);

  // Delete modal
  const [itemToDelete, setItemToDelete] = useState<GalleryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    setIsLoading(true);
    try {
      const data = await getGalleryItems();
      setItems(data);
    } catch {
      showToast('error', 'Failed to load gallery items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (item: GalleryItem) => {
    try {
      const newStatus = !item.isActive;
      await updateGalleryItem(item.id, { isActive: newStatus });
      showToast('success', `Item "${item.titleEn}" set to ${newStatus ? 'Active' : 'Inactive'}`);
      loadGallery();
    } catch {
      showToast('error', 'Failed to update item status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteGalleryItem(itemToDelete.id);
      showToast('success', `Item "${itemToDelete.titleEn}" deleted successfully`);
      setItemToDelete(null);
      loadGallery();
    } catch {
      showToast('error', 'Failed to delete item');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'All' || item.type === typeFilter;
    const matchesStatus = statusFilter === 'All' ||
                          (statusFilter === 'Active' && item.isActive) ||
                          (statusFilter === 'Inactive' && !item.isActive);
    return matchesSearch && matchesType && matchesStatus;
  });

  // Extract YouTube ID for embed iframe
  const getYouTubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?autoplay=1` : null;
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading Website Media Gallery..." />;
  }

  return (
    <RoleGuard module="gallery" action="view">
      <div className="space-y-6 pb-12 animate-in fade-in">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#111827]">Website Gallery Manager</h2>
            <p className="text-xs text-[#718096] mt-0.5">Manage photos and video media displayed on the Delta Travel public website.</p>
          </div>

          {hasPermission('gallery', 'create') && (
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <button
                onClick={() => navigate('/gallery/bulk-upload')}
                className="px-4 py-2.5 rounded-lg border border-[#C8102E] text-[#C8102E] hover:bg-[#C8102E] hover:text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" /> Bulk Upload Photos
              </button>
              <button
                onClick={() => navigate('/gallery/create')}
                className="px-5 py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" /> Add New Item
              </button>
            </div>
          )}
        </div>

        {/* Toolbar: Search & Filters */}
        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-[#718096] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or location..."
              className="w-full pl-10 pr-3.5 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Type filter */}
            <div className="flex items-center gap-1">
              <Filter className="w-4 h-4 text-[#718096] mr-1" />
              {(['All', 'Photo', 'Video'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    typeFilter === t
                      ? 'bg-[#C8102E] text-white'
                      : 'bg-[#F9FAFB] text-[#2D3748] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {t === 'All' ? 'All Types' : t + 's'}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredItems.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white rounded-lg border border-[#E2E8F0] text-[#718096]">
              <ImageIcon className="w-10 h-10 text-[#E2E8F0] mx-auto mb-2" />
              <p className="font-semibold text-sm">No gallery items found matching your filters.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
              >
                {/* Thumbnail Header with Badges */}
                <div
                  className="relative aspect-4/3 bg-[#F9FAFB] overflow-hidden cursor-pointer"
                  onClick={() => {
                    if (item.type === 'Video') {
                      setActiveVideoItem(item);
                    } else {
                      setActiveImageItem(item);
                    }
                  }}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.titleEn}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&q=80&w=800';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Type Badge */}
                  <span
                    className={`absolute top-3 left-3 px-2.5 py-1 rounded text-[10px] font-bold text-white shadow-xs flex items-center gap-1 ${
                      item.type === 'Video' ? 'bg-[#111827]' : 'bg-[#C8102E]'
                    }`}
                  >
                    {item.type === 'Video' ? <Video className="w-3 h-3 text-[#C8102E]" /> : <ImageIcon className="w-3 h-3" />}
                    {item.type} {item.duration ? `(${item.duration})` : ''}
                  </span>

                  {/* Active/Inactive Badge */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(item);
                    }}
                    className={`absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-bold text-white shadow-xs transition-opacity ${
                      item.isActive ? 'bg-emerald-600' : 'bg-rose-500'
                    }`}
                    title="Click to toggle status"
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </button>

                  {/* Video Play Overlay */}
                  {item.type === 'Video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                      <div className="w-12 h-12 rounded-full bg-[#C8102E] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-[#111827] text-sm line-clamp-1">{item.titleEn}</h3>
                    {item.titleAr && <p className="text-xs text-[#718096] font-normal truncate mt-0.5" dir="rtl">{item.titleAr}</p>}
                    
                    {/* Description Display on Card */}
                    {item.description ? (
                      <p className="text-xs text-[#4A5568] mt-1.5 line-clamp-2 font-normal leading-relaxed">
                        {item.description}
                      </p>
                    ) : (
                      <p className="text-[11px] text-[#A0AEC0] italic mt-1">No description provided</p>
                    )}

                    {item.location && (
                      <p className="text-[11px] text-[#718096] flex items-center gap-1 mt-1.5 truncate">
                        <MapPin className="w-3 h-3 text-[#C8102E]" /> {item.location}
                      </p>
                    )}
                  </div>

                  {/* Footer Meta & Actions */}
                  <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#718096]">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 text-[#718096]" /> {item.uploadDate}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {item.type === 'Video' ? (
                        <button
                          onClick={() => setActiveVideoItem(item)}
                          className="px-2 py-1 rounded border border-[#E2E8F0] hover:bg-[#C8102E] hover:text-white text-[#C8102E] font-bold text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                          title="Watch Video & View Description"
                        >
                          <Play className="w-3 h-3 fill-current" /> Watch
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveImageItem(item)}
                          className="px-2 py-1 rounded border border-[#E2E8F0] hover:bg-[#111827] hover:text-white text-[#111827] font-bold text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                          title="View Full Photo & Description"
                        >
                          <ImageIcon className="w-3 h-3" /> View
                        </button>
                      )}

                      {hasPermission('gallery', 'edit') && (
                        <button
                          onClick={() => navigate(`/gallery/edit/${item.id}`)}
                          className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F9FAFB] text-[#111827] transition-colors"
                          title="Edit Gallery Item"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {hasPermission('gallery', 'delete') && (
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-rose-50 text-[#C8102E] transition-colors"
                          title="Delete Gallery Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Video Player Modal */}
        {activeVideoItem && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#111827] text-white rounded-xl border border-white/10 max-w-3xl w-full overflow-hidden shadow-2xl space-y-4">
              {/* Modal Top Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#C8102E]" />
                  <div>
                    <h3 className="font-bold text-sm text-white">{activeVideoItem.titleEn}</h3>
                    {activeVideoItem.location && (
                      <p className="text-[11px] text-gray-400">{activeVideoItem.location} • {activeVideoItem.duration || 'Video Clip'}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setActiveVideoItem(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Player Body */}
              <div className="p-4 bg-black flex justify-center items-center">
                {activeVideoItem.videoUrl && getYouTubeEmbedUrl(activeVideoItem.videoUrl) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(activeVideoItem.videoUrl)!}
                    title={activeVideoItem.titleEn}
                    className="w-full aspect-video rounded-lg shadow-lg border border-white/10"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : activeVideoItem.videoUrl ? (
                  <video
                    src={activeVideoItem.videoUrl}
                    controls
                    autoPlay
                    className="w-full max-h-[65vh] rounded-lg shadow-lg object-contain bg-black"
                  />
                ) : (
                  <video
                    src={activeVideoItem.imageUrl}
                    controls
                    autoPlay
                    className="w-full max-h-[65vh] rounded-lg shadow-lg object-contain bg-black"
                  />
                )}
              </div>

              {/* Modal Footer Description */}
              <div className="p-4 border-t border-white/10 bg-[#1A1D20] text-xs text-gray-200 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-[#E2E8F0] uppercase tracking-wider text-[10px] text-[#C8102E]">
                      Video Description
                    </p>
                    <p className="leading-relaxed text-sm text-gray-200 whitespace-pre-wrap">
                      {activeVideoItem.description || 'No detailed description provided for this video.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveVideoItem(null)}
                    className="px-4 py-2 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-xs shrink-0 cursor-pointer"
                  >
                    Close Player
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photo Lightbox Preview Modal */}
        {activeImageItem && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#111827] text-white rounded-xl border border-white/10 max-w-3xl w-full overflow-hidden shadow-2xl space-y-0">
              {/* Modal Top Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#C8102E]" />
                  <div>
                    <h3 className="font-bold text-sm text-white">{activeImageItem.titleEn}</h3>
                    {activeImageItem.titleAr && <p className="text-xs text-gray-400" dir="rtl">{activeImageItem.titleAr}</p>}
                  </div>
                </div>
                <button
                  onClick={() => setActiveImageItem(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photo View Body */}
              <div className="p-4 bg-black flex justify-center items-center">
                <img
                  src={activeImageItem.imageUrl}
                  alt={activeImageItem.titleEn}
                  className="max-h-[60vh] w-auto object-contain rounded-lg border border-white/10 shadow-lg"
                />
              </div>

              {/* Modal Footer Description */}
              <div className="p-4 border-t border-white/10 bg-[#1A1D20] text-xs text-gray-200 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-1">
                      {activeImageItem.location && (
                        <span className="flex items-center gap-1 text-[#C8102E]">
                          <MapPin className="w-3 h-3" /> {activeImageItem.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Posted {activeImageItem.uploadDate}
                      </span>
                    </div>
                    <p className="font-bold text-[#E2E8F0] uppercase tracking-wider text-[10px] text-[#C8102E]">
                      Photo Description
                    </p>
                    <p className="leading-relaxed text-sm text-gray-200 whitespace-pre-wrap">
                      {activeImageItem.description || 'No detailed description provided for this photo.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveImageItem(null)}
                    className="px-4 py-2 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-xs shrink-0 cursor-pointer"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {itemToDelete && (
          <ConfirmModal
            isOpen={!!itemToDelete}
            title="Delete Gallery Item?"
            message={`Are you sure you want to delete "${itemToDelete.titleEn}"? This item will be removed from the public website gallery.`}
            confirmLabel="Delete Item"
            onConfirm={handleDeleteConfirm}
            onCancel={() => setItemToDelete(null)}
            isLoading={isDeleting}
          >
            <div className="mt-3 p-3 bg-[#F9FAFB] rounded-lg border border-[#E2E8F0] flex items-center gap-3">
              <img src={itemToDelete.imageUrl} alt={itemToDelete.titleEn} className="w-12 h-12 object-cover rounded-lg border shrink-0" />
              <div>
                <p className="font-bold text-xs text-[#111827]">{itemToDelete.titleEn}</p>
                <p className="text-[11px] text-[#718096]">{itemToDelete.type} • {itemToDelete.location || 'No location'}</p>
              </div>
            </div>
          </ConfirmModal>
        )}
      </div>
    </RoleGuard>
  );
};
