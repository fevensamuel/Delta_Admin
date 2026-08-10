import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GalleryItem } from '../../types';
import { getGalleryItems, deleteGalleryItem, updateGalleryItem } from '../../api/gallery';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { Plus, Upload, Search, Filter, MapPin, Calendar, Edit, Trash2, Video, Image as ImageIcon, Play, X, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';

// Helper to ensure array
const ensureArray = <T,>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.gallery)) return data.gallery;
  }
  return [];
};

// Helper to normalize type (handle both 'photo' and 'Photo')
const normalizeType = (type: string): string => {
  if (!type) return 'Photo';
  const lower = type.toLowerCase();
  if (lower === 'video') return 'Video';
  return 'Photo';
};

// Helper to get full image URL - FIXED
const getFullImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return '';
  
  // If it's already a full URL with http, return it
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a data URI, return as is
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  // Get the base URL from environment
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const baseWithoutApi = baseUrl.replace(/\/api$/, '');
  
  // If it starts with /uploads, prepend the base URL
  if (imageUrl.startsWith('/uploads')) {
    return `${baseWithoutApi}${imageUrl}`;
  }
  
  // Otherwise, assume it's a filename in /uploads/images/
  return `${baseWithoutApi}/uploads/images/${imageUrl}`;
};

// Helper to get full video URL - FIXED
const getFullVideoUrl = (videoUrl: string): string => {
  if (!videoUrl) return '';
  
  // If it's already a full URL with http, return it
  if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
    return videoUrl;
  }
  
  // If it's a YouTube URL
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    return videoUrl;
  }
  
  // Get the base URL from environment
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const baseWithoutApi = baseUrl.replace(/\/api$/, '');
  
  // If it starts with /uploads, prepend the base URL
  if (videoUrl.startsWith('/uploads')) {
    return `${baseWithoutApi}${videoUrl}`;
  }
  
  // Otherwise, assume it's a filename in /uploads/videos/
  return `${baseWithoutApi}/uploads/videos/${videoUrl}`;
};

export const GalleryGrid: React.FC = () => {
  const navigate = useNavigate();
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Delete modal
  const [itemToDelete, setItemToDelete] = useState<GalleryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Video ref for generating thumbnails
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGallery();
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveVideoItem(null);
        setActiveImageItem(null);
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const loadGallery = async () => {
    setIsLoading(true);
    try {
      const data = await getGalleryItems();
      const galleryArray = ensureArray<GalleryItem>(data);
      
      // Log raw data to see what's coming from the API
      console.log('📸 Raw gallery data:', galleryArray);
      
      const normalizedItems = galleryArray.map(item => ({
        ...item,
        type: normalizeType(item.type) as 'Photo' | 'Video',
        isActive: item.isActive !== undefined ? item.isActive : true,
        imageUrl: item.imageUrl || '',
        videoUrl: item.videoUrl || '',
        titleEn: item.titleEn || 'Untitled',
        uploadDate: item.uploadDate || new Date().toISOString().substring(0, 10)
      }));
      
      // Log normalized items with full URLs
      normalizedItems.forEach(item => {
        if (item.type === 'Video') {
          console.log(`🎬 Video: ${item.titleEn} -> ${getFullVideoUrl(item.videoUrl)}`);
        } else {
          console.log(`🖼️ Photo: ${item.titleEn} -> ${getFullImageUrl(item.imageUrl)}`);
        }
      });
      
      setItems(normalizedItems);
      console.log('✅ Gallery loaded:', normalizedItems.length, 'items');
    } catch (error) {
      console.error('❌ Error loading gallery:', error);
      showToast('error', 'Failed to load gallery items');
      setItems([]);
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

  const itemsArray = ensureArray<GalleryItem>(items);

  const filteredItems = itemsArray.filter((item) => {
    const itemType = normalizeType(item.type);
    const matchesSearch = item.titleEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'All' || itemType === typeFilter;
    const matchesStatus = statusFilter === 'All' ||
                          (statusFilter === 'Active' && item.isActive) ||
                          (statusFilter === 'Inactive' && !item.isActive);
    return matchesSearch && matchesType && matchesStatus;
  });

  // Check if URL is a YouTube URL
  const isYouTubeUrl = (url?: string): boolean => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Extract YouTube video ID
  const getYouTubeId = (url?: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Get YouTube embed URL
  const getYouTubeEmbedUrl = (url?: string): string | null => {
    const videoId = getYouTubeId(url);
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  };

  // Generate video thumbnail from video element
  const generateVideoThumbnail = (videoUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.currentTime = 1;
      
      video.addEventListener('loadeddata', () => {
        video.currentTime = 1;
      });
      
      video.addEventListener('seeked', () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 180;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnail = canvas.toDataURL('image/jpeg');
            resolve(thumbnail);
          } else {
            resolve('');
          }
        } catch (e) {
          resolve('');
        }
      });
      
      video.addEventListener('error', () => {
        resolve('');
      });
      
      video.load();
    });
  };

  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    const generateThumbnails = async () => {
      const thumbnails: Record<string, string> = {};
      for (const item of itemsArray) {
        if (item.type === 'Video' && item.videoUrl && !thumbnails[item.id]) {
          const fullUrl = getFullVideoUrl(item.videoUrl);
          console.log(`🎬 Generating thumbnail for: ${fullUrl}`);
          const thumbnail = await generateVideoThumbnail(fullUrl);
          if (thumbnail) {
            thumbnails[item.id] = thumbnail;
          }
        }
      }
      setVideoThumbnails(thumbnails);
    };
    
    if (itemsArray.length > 0) {
      generateThumbnails();
    }
  }, [itemsArray]);

  if (isLoading) {
    return <LoadingSpinner text="Loading Website Media Gallery..." />;
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#111827]">Website Gallery Manager</h2>
          <p className="text-xs text-[#718096] mt-0.5">Manage photos and video media displayed on the Delta Travel public website.</p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => navigate('/gallery/bulk-upload')}
            className="px-4 py-2.5 rounded-lg border border-[#C8102E] text-[#C8102E] hover:bg-[#C8102E] hover:text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Bulk Upload
          </button>
          <button
            onClick={() => navigate('/gallery/create')}
            className="px-5 py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" /> Add New Item
          </button>
        </div>
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
            <p className="font-semibold text-sm">
              {itemsArray.length === 0 ? 'No gallery items found. Upload your first photo or video!' : 'No items match your filters.'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const itemType = normalizeType(item.type);
            const isVideo = itemType === 'Video';
            const fullImageUrl = getFullImageUrl(item.imageUrl);
            const fullVideoUrl = getFullVideoUrl(item.videoUrl);
            const isYouTube = isVideo && isYouTubeUrl(item.videoUrl);
            const thumbnail = videoThumbnails[item.id] || '';
            
            return (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div
                  className="relative aspect-[4/3] bg-[#F9FAFB] overflow-hidden cursor-pointer"
                  onClick={() => {
                    if (isVideo) {
                      setActiveVideoItem(item);
                    } else {
                      setActiveImageItem(item);
                    }
                  }}
                >
                  {isVideo ? (
                    <div className="w-full h-full bg-[#111827] flex items-center justify-center">
                      {fullVideoUrl ? (
                        isYouTube ? (
                          <div className="w-full h-full relative">
                            <img
                              src={`https://img.youtube.com/vi/${getYouTubeId(item.videoUrl)}/mqdefault.jpg`}
                              alt={item.titleEn}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-all">
                              <div className="w-12 h-12 rounded-full bg-[#C8102E] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Play className="w-6 h-6 fill-current ml-0.5" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full relative bg-[#111827] flex items-center justify-center">
                            {thumbnail ? (
                              <img
                                src={thumbnail}
                                alt={item.titleEn}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <video
                                src={fullVideoUrl}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                poster={thumbnail || undefined}
                                onError={(e) => {
                                  const videoEl = e.target as HTMLVideoElement;
                                  videoEl.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-all pointer-events-none">
                              <div className="w-12 h-12 rounded-full bg-[#C8102E] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Play className="w-6 h-6 fill-current ml-0.5" />
                              </div>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="text-white text-center">
                          <Video className="w-12 h-12 mx-auto text-[#C8102E] opacity-50" />
                          <p className="text-xs mt-2 text-gray-400">No preview available</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <img
                      src={fullImageUrl}
                      alt={item.titleEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Hide image on error - no placeholder
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}

                  <span
                    className={`absolute top-3 left-3 px-2.5 py-1 rounded text-[10px] font-bold text-white shadow-xs flex items-center gap-1 ${
                      isVideo ? 'bg-[#111827]' : 'bg-[#C8102E]'
                    }`}
                  >
                    {isVideo ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                    {itemType} {item.duration ? `(${item.duration})` : ''}
                  </span>

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
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-[#111827] text-sm line-clamp-1">{item.titleEn}</h3>
                    {item.titleAr && <p className="text-xs text-[#718096] font-normal truncate mt-0.5" dir="rtl">{item.titleAr}</p>}
                    
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

                  <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#718096]">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 text-[#718096]" /> {item.uploadDate || 'N/A'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isVideo ? (
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

                      <button
                        onClick={() => navigate(`/gallery/edit/${item.id}`)}
                        className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F9FAFB] text-[#111827] transition-colors"
                        title="Edit Gallery Item"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-rose-50 text-[#C8102E] transition-colors"
                        title="Delete Gallery Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Video Player Modal */}
      {activeVideoItem && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveVideoItem(null);
              setIsFullscreen(false);
            }
          }}
        >
          <div 
            ref={modalRef}
            className={`bg-[#111827] text-white rounded-xl border border-white/10 shadow-2xl transition-all duration-300 ${
              isFullscreen ? 'fixed inset-4 rounded-xl max-w-none' : 'max-w-5xl w-full'
            }`}
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Video className="w-5 h-5 text-[#C8102E] shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-white truncate">{activeVideoItem.titleEn}</h3>
                  {activeVideoItem.location && (
                    <p className="text-[11px] text-gray-400 truncate">{activeVideoItem.location} • {activeVideoItem.duration || 'Video Clip'}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => {
                    setActiveVideoItem(null);
                    setIsFullscreen(false);
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-black flex justify-center items-center">
              <div className="w-full aspect-video max-h-[75vh]">
                {activeVideoItem.videoUrl && isYouTubeUrl(activeVideoItem.videoUrl) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(activeVideoItem.videoUrl)!}
                    title={activeVideoItem.titleEn}
                    className="w-full h-full rounded-lg shadow-lg border border-white/10"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                ) : activeVideoItem.videoUrl ? (
                  <video
                    src={getFullVideoUrl(activeVideoItem.videoUrl)}
                    controls
                    autoPlay
                    className="w-full h-full rounded-lg shadow-lg object-contain bg-black"
                    controlsList="nodownload"
                    playsInline
                    onError={(e) => {
                      const videoEl = e.target as HTMLVideoElement;
                      videoEl.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-[#1A1A2E] flex items-center justify-center text-gray-500 rounded-lg">
                    <div className="text-center">
                      <Video className="w-16 h-16 mx-auto text-[#C8102E] opacity-50" />
                      <p className="mt-2 text-sm text-white">No video source available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-[#1A1D20] text-xs text-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="font-bold text-[#E2E8F0] uppercase tracking-wider text-[10px] text-[#C8102E]">
                    Video Description
                  </p>
                  <p className="leading-relaxed text-sm text-gray-200 whitespace-pre-wrap break-words max-h-24 overflow-y-auto">
                    {activeVideoItem.description || 'No detailed description provided for this video.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveVideoItem(null);
                    setIsFullscreen(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-xs shrink-0 transition-colors"
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
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveImageItem(null);
          }}
        >
          <div className="bg-[#111827] text-white rounded-xl border border-white/10 max-w-4xl w-full overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <ImageIcon className="w-5 h-5 text-[#C8102E] shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-white truncate">{activeImageItem.titleEn}</h3>
                  {activeImageItem.titleAr && <p className="text-xs text-gray-400 truncate" dir="rtl">{activeImageItem.titleAr}</p>}
                </div>
              </div>
              <button
                onClick={() => setActiveImageItem(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-black flex justify-center items-center min-h-[300px]">
              {getFullImageUrl(activeImageItem.imageUrl) ? (
                <img
                  src={getFullImageUrl(activeImageItem.imageUrl)}
                  alt={activeImageItem.titleEn}
                  className="max-h-[70vh] w-auto object-contain rounded-lg border border-white/10 shadow-lg"
                  onError={(e) => {
                    // Hide on error
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full min-h-[280px] flex flex-col items-center justify-center rounded-lg border border-white/10 bg-[#1A1D20] text-gray-400">
                  <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">Image preview unavailable</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-[#1A1D20] text-xs text-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-1 flex-wrap">
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
                  <p className="leading-relaxed text-sm text-gray-200 whitespace-pre-wrap break-words max-h-24 overflow-y-auto">
                    {activeImageItem.description || 'No detailed description provided for this photo.'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveImageItem(null)}
                  className="px-4 py-2 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-xs shrink-0 transition-colors"
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
            {itemToDelete.type === 'Video' && itemToDelete.videoUrl ? (
              <div className="w-12 h-12 bg-[#111827] rounded-lg flex items-center justify-center border shrink-0">
                <Video className="w-6 h-6 text-[#C8102E]" />
              </div>
            ) : getFullImageUrl(itemToDelete.imageUrl) ? (
              <img src={getFullImageUrl(itemToDelete.imageUrl)} alt={itemToDelete.titleEn} className="w-12 h-12 object-cover rounded-lg border shrink-0" />
            ) : (
              <div className="w-12 h-12 bg-[#F9FAFB] rounded-lg border border-[#E2E8F0] flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5 text-[#718096]" />
              </div>
            )}
            <div>
              <p className="font-bold text-xs text-[#111827]">{itemToDelete.titleEn}</p>
              <p className="text-[11px] text-[#718096]">{itemToDelete.type} • {itemToDelete.location || 'No location'}</p>
            </div>
          </div>
        </ConfirmModal>
      )}
    </div>
  );
};