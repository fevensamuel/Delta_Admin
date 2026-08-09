import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GalleryItem, GalleryType } from '../../types';
import { getGalleryItem, createGalleryItem, updateGalleryItem } from '../../api/gallery';
import { RoleGuard } from '../../components/common/RoleGuard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, Upload, Video, Image as ImageIcon, Save, X, Link, Clock, CheckCircle } from 'lucide-react';
import { compressImageFile } from '../../utils/imageUtils';

export const GalleryFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(!!id);
  const [isSaving, setIsSaving] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<GalleryItem | null>(null);

  // Form states
  const [type, setType] = useState<GalleryType>('Photo');
  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // Holds Data URL or existing URL
  const [videoSourceType, setVideoSourceType] = useState<'upload' | 'url'>('upload');
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(1);

  // File upload refs & drag states
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [imageDragActive, setImageDragActive] = useState(false);
  const [videoDragActive, setVideoDragActive] = useState(false);

  useEffect(() => {
    if (id) {
      loadExistingItem(id);
    }
  }, [id]);

  const loadExistingItem = async (itemId: string) => {
    setIsLoading(true);
    try {
      const found = await getGalleryItem(itemId);
      if (found) {
        setItemToEdit(found);
        setType(found.type || 'Photo');
        setTitleEn(found.titleEn || '');
        setTitleAr(found.titleAr || '');
        setImageUrl(found.imageUrl || '');
        setVideoUrl(found.videoUrl || '');
        if (found.videoUrl && found.videoUrl.startsWith('http')) {
          setVideoSourceType('url');
        }
        setDuration(found.duration || '');
        setLocation(found.location || '');
        setDescription(found.description || '');
        setIsActive(found.isActive ?? true);
        setSortOrder(found.sortOrder || 1);
      } else {
        showToast('error', 'Gallery item not found');
        navigate('/gallery');
      }
    } catch (error) {
      console.error('Error fetching gallery item:', error);
      showToast('error', 'Error fetching gallery item');
    } finally {
      setIsLoading(false);
    }
  };

  // Process image file selection from device
  const handleImageFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select a valid image file (PNG, JPG, WEBP)');
      return;
    }
    try {
      const compressedDataUrl = await compressImageFile(file);
      setImageUrl(compressedDataUrl);
      showToast('success', 'Image uploaded and processed successfully from device');
    } catch {
      showToast('error', 'Failed to process image file');
    }
  };

  // Helper to calculate video duration from a URL
  const calculateVideoDurationFromUrl = (url: string) => {
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = url;
    tempVideo.crossOrigin = 'anonymous';
    
    tempVideo.onloadedmetadata = () => {
      const totalSeconds = Math.floor(tempVideo.duration);
      if (isNaN(totalSeconds) || totalSeconds === 0) return;

      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setDuration(formatted);
      showToast('info', `Video duration calculated automatically: ${formatted}`);
    };
    
    tempVideo.onerror = () => {
      // If metadata can't be loaded, let user enter manually
      showToast('info', 'Could not auto-calculate duration. Please enter it manually.');
    };
    
    tempVideo.load();
  };

  // Helper to calculate video duration from file
  const calculateVideoDurationFromFile = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    calculateVideoDurationFromUrl(objectUrl);
    // Revoke the URL after calculation
    setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
  };

  // Process video file selection from device safely without memory crash
  const handleVideoFileSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      showToast('error', 'Please select a valid video file (MP4, WEBM, MOV)');
      return;
    }

    // Guard against ridiculously massive files that freeze the browser
    if (file.size > 500 * 1024 * 1024) {
      showToast('error', 'Video file is too large (> 500MB). Please select a smaller video or enter a stream URL.');
      return;
    }

    // Use Blob Object URL instead of readAsDataURL to prevent browser heap crash
    const objectUrl = URL.createObjectURL(file);
    setVideoUrl(objectUrl);
    calculateVideoDurationFromFile(file);
    showToast('success', `Video "${file.name}" loaded from device (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
  };

  // Handle video URL input change
  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setVideoUrl(val);
    
    // Auto-calculate duration for direct video URLs
    if (val && (val.match(/\.(mp4|webm|mov|avi)$/i) || val.includes('video'))) {
      calculateVideoDurationFromUrl(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titleEn.trim()) {
      showToast('error', 'English Title is required');
      return;
    }

    if (type === 'Photo' && !imageUrl) {
      showToast('error', 'Please upload a thumbnail image from your device');
      return;
    }

    if (type === 'Video') {
      if (!videoUrl) {
        showToast('error', 'Please upload a video file or enter a video stream URL');
        return;
      }
    }

    setIsSaving(true);
    try {
      let result;

      // For video uploads from device, use FormData
      if (type === 'Video' && videoSourceType === 'upload' && videoUrl && !videoUrl.startsWith('http')) {
        const formData = new FormData();
        formData.append('titleEn', titleEn.trim());
        formData.append('titleAr', titleAr.trim() || '');
        formData.append('type', 'video');
        formData.append('location', location.trim() || '');
        formData.append('description', description.trim() || '');
        formData.append('isActive', String(isActive));
        formData.append('sortOrder', String(sortOrder));
        if (duration) formData.append('duration', duration);

        // Get the file from the videoUrl blob
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const file = new File([blob], 'video.mp4', { type: blob.type || 'video/mp4' });
        formData.append('video', file);

        if (id) {
          result = await updateGalleryItem(id, formData);
        } else {
          result = await createGalleryItem(formData);
        }
      } 
      // For photo uploads from device, use FormData
      else if (type === 'Photo' && imageUrl && imageUrl.startsWith('data:')) {
        const formData = new FormData();
        formData.append('titleEn', titleEn.trim());
        formData.append('titleAr', titleAr.trim() || '');
        formData.append('type', 'photo');
        formData.append('location', location.trim() || '');
        formData.append('description', description.trim() || '');
        formData.append('isActive', String(isActive));
        formData.append('sortOrder', String(sortOrder));

        // Convert data URL to blob
        const blob = dataURLToBlob(imageUrl);
        const file = new File([blob], 'image.jpg', { type: blob.type || 'image/jpeg' });
        formData.append('image', file);

        if (id) {
          result = await updateGalleryItem(id, formData);
        } else {
          result = await createGalleryItem(formData);
        }
      } 
      // For video URLs (YouTube, Vimeo, direct MP4 links, etc.) - send as JSON
      else {
        const payload: Omit<GalleryItem, 'id' | 'uploadDate'> = {
          type,
          titleEn: titleEn.trim(),
          titleAr: titleAr.trim() || undefined,
          imageUrl: type === 'Photo' ? imageUrl : '',
          videoUrl: type === 'Video' ? videoUrl : '',
          duration: type === 'Video' ? duration.trim() || '' : '',
          location: location.trim() || undefined,
          description: description.trim() || undefined,
          isActive,
          sortOrder: Number(sortOrder) || 1
        };

        if (id) {
          result = await updateGalleryItem(id, payload);
        } else {
          result = await createGalleryItem(payload);
        }
      }

      showToast('success', id ? 'Gallery item updated successfully' : 'New gallery item created successfully');
      navigate('/gallery');
    } catch (error: any) {
      console.error('Error saving gallery item:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to save gallery item';
      showToast('error', errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper: Convert data URL to Blob
  const dataURLToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading gallery item..." />;
  }

  return (
    <RoleGuard module="gallery" action={id ? 'edit' : 'create'}>
      <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
          <button
            type="button"
            onClick={() => navigate('/gallery')}
            className="flex items-center gap-2 text-sm font-semibold text-[#2D3748] hover:text-[#C8102E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Gallery
          </button>
          <h2 className="text-lg font-extrabold text-[#111827]">
            {id ? 'Edit Gallery Item' : 'Create Gallery Item'}
          </h2>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-[#E2E8F0] shadow-xs space-y-6">
          {/* Type Selector */}
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-2">Media Type *</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setType('Photo')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                  type === 'Photo'
                    ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-sm'
                    : 'bg-[#F9FAFB] text-[#2D3748] border-[#E2E8F0] hover:bg-[#E2E8F0]'
                }`}
              >
                <ImageIcon className="w-4 h-4" /> Photo
              </button>

              <button
                type="button"
                onClick={() => setType('Video')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                  type === 'Video'
                    ? 'bg-[#111827] text-white border-[#111827] shadow-sm'
                    : 'bg-[#F9FAFB] text-[#2D3748] border-[#E2E8F0] hover:bg-[#E2E8F0]'
                }`}
              >
                <Video className="w-4 h-4 text-[#C8102E]" /> Video
              </button>
            </div>
          </div>

          {/* Titles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">Title (English) *</label>
              <input
                type="text"
                required
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="e.g. Masjid al-Haram Golden Hour"
                className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">Title (Arabic) - Optional</label>
              <input
                type="text"
                dir="rtl"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder="المسجد الحرام"
                className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
            </div>
          </div>

          {type === 'Photo' && (
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">
                Upload Image Thumbnail from Device *
              </label>

              {imageUrl ? (
                <div className="relative rounded-lg border border-[#E2E8F0] overflow-hidden bg-[#F9FAFB] p-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={imageUrl}
                      alt="Uploaded Thumbnail"
                      className="w-20 h-16 object-cover rounded-md border border-[#E2E8F0] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" /> Image Uploaded from Device
                      </p>
                      <p className="text-[11px] text-[#718096] truncate mt-0.5">Ready for display on public website gallery</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="px-3 py-1.5 text-xs font-bold text-[#C8102E] hover:bg-rose-50 rounded-lg border border-[#E2E8F0] transition-colors"
                  >
                    Change Image
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setImageDragActive(true); }}
                  onDragLeave={() => setImageDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setImageDragActive(false);
                    if (e.dataTransfer.files?.[0]) handleImageFileSelect(e.dataTransfer.files[0]);
                  }}
                  onClick={() => imageInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                    imageDragActive
                      ? 'border-[#C8102E] bg-rose-50/50'
                      : 'border-[#E2E8F0] hover:border-[#C8102E] bg-[#F9FAFB]'
                  }`}
                >
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleImageFileSelect(e.target.files[0]);
                    }}
                  />
                  <Upload className="w-8 h-8 text-[#C8102E] mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#111827]">Click or drag to upload image from device</p>
                  <p className="text-[11px] text-[#718096] mt-1">PNG, JPG, WEBP formats supported</p>
                </div>
              )}
            </div>
          )}

          {/* Video Options (Upload from device OR Video Stream URL) */}
          {type === 'Video' && (
            <div className="space-y-4 p-5 rounded-lg bg-[#111827]/5 border border-[#111827]/15">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-[#C8102E]" /> Video Source Selection
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVideoSourceType('upload')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      videoSourceType === 'upload'
                        ? 'bg-[#C8102E] text-white shadow-xs'
                        : 'bg-white text-[#2D3748] border border-[#E2E8F0]'
                    }`}
                  >
                    Upload from Device
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSourceType('url')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      videoSourceType === 'url'
                        ? 'bg-[#C8102E] text-white shadow-xs'
                        : 'bg-white text-[#2D3748] border border-[#E2E8F0]'
                    }`}
                  >
                    Video Stream URL
                  </button>
                </div>
              </div>

              {videoSourceType === 'upload' ? (
                <div>
                  <label className="block text-xs font-bold text-[#111827] mb-1">
                    Upload Video File from Device
                  </label>
                  {videoUrl && !videoUrl.startsWith('http') ? (
                    <div className="p-3 bg-white rounded-lg border border-[#E2E8F0] flex items-center justify-between">
                      <span className="text-xs font-bold text-[#111827] flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" /> Video Loaded from Device
                      </span>
                      <button
                        type="button"
                        onClick={() => { setVideoUrl(''); setDuration(''); }}
                        className="text-xs text-[#C8102E] font-bold hover:underline"
                      >
                        Remove Video
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setVideoDragActive(true); }}
                      onDragLeave={() => setVideoDragActive(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setVideoDragActive(false);
                        if (e.dataTransfer.files?.[0]) handleVideoFileSelect(e.dataTransfer.files[0]);
                      }}
                      onClick={() => videoInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
                        videoDragActive
                          ? 'border-[#C8102E] bg-rose-50/50'
                          : 'border-[#E2E8F0] hover:border-[#C8102E] bg-white'
                      }`}
                    >
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleVideoFileSelect(e.target.files[0]);
                        }}
                      />
                      <Video className="w-8 h-8 text-[#111827] mx-auto mb-1" />
                      <p className="text-xs font-bold text-[#111827]">Click or drag to upload video file</p>
                      <p className="text-[11px] text-[#718096]">MP4, WEBM formats (Duration is auto-calculated)</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-[#111827] mb-1">
                    Video Stream URL (YouTube, Vimeo, MP4 link)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={handleVideoUrlChange}
                      placeholder="https://www.youtube.com/watch?v=... or direct MP4 link"
                      className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                    />
                    <Link className="w-4 h-4 text-[#718096] absolute left-3 top-2.5" />
                  </div>
                  <p className="text-[10px] text-[#718096] mt-1">
                    Duration will auto-calculate for direct video URLs (MP4, WEBM)
                  </p>
                </div>
              )}

              {/* Auto Calculated Video Duration field */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-[#111827] mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#C8102E]" /> Video Duration
                    <span className="font-normal text-[#718096]">(Auto-calculated or enter manually)</span>
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 02:45"
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm font-semibold text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Location & Sort Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Makkah, Saudi Arabia"
                className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">Sort Order (Ordering Index)</label>
              <input
                type="number"
                min={1}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short descriptive caption for website visitors..."
              className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            />
          </div>

          {/* Active / Inactive Toggle */}
          <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-lg border border-[#E2E8F0]">
            <div>
              <span className="text-xs font-bold text-[#111827] block">Active Status</span>
              <span className="text-[11px] text-[#718096]">When active, item is publicly visible in website gallery.</span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors ${
                isActive ? 'bg-[#48BB78] text-white' : 'bg-[#FC8181] text-white'
              }`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </button>
          </div>

          {/* Footer Form Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/gallery')}
              className="px-5 py-2.5 rounded-lg border border-[#E2E8F0] text-[#2D3748] font-semibold text-sm hover:bg-[#F9FAFB] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <Save className="w-4 h-4" />
              {id ? 'Update Gallery Item' : 'Create Gallery Item'}
            </button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
};