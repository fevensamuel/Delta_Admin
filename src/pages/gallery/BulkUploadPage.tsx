import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bulkUploadGallery } from '../../api/gallery';
import { RoleGuard } from '../../components/common/RoleGuard';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, Upload, CheckCircle2, AlertCircle, FileImage, X, Loader2, ChevronDown, ChevronUp, Image as ImageIcon, Video } from 'lucide-react';
import { compressImageFile } from '../../utils/imageUtils';

interface FileUploadItem {
  id: string;
  file: File;
  dataUrl: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  errorMessage?: string;
  duration?: string;
}

interface BulkUploadDetails {
  titleEn: string;
  titleAr: string;
  titleAm: string;
  location: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  type: 'Photo' | 'Video';
}

// Helper to format video duration
const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const BulkUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [uploadQueue, setUploadQueue] = useState<FileUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Common details for all files
  const [commonDetails, setCommonDetails] = useState<BulkUploadDetails>({
    titleEn: '',
    titleAr: '',
    titleAm: '',
    location: '',
    description: '',
    sortOrder: 1,
    isActive: true,
    type: 'Photo'
  });

  const handleFilesAdded = (filesList: FileList | null) => {
    if (!filesList) return;

    const filesArray = Array.from(filesList);
    const validFiles = filesArray.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (validFiles.length === 0) {
      showToast('error', 'No valid image or video files found.');
      return;
    }

    if (validFiles.length !== filesArray.length) {
      showToast('info', `${validFiles.length} file(s) added. ${filesArray.length - validFiles.length} unsupported file(s) skipped.`);
    }

    validFiles.forEach(async (file, idx) => {
      try {
        let dataUrl: string;
        let duration: string | undefined;
        
        // If it's a video, create a temporary URL for preview and get duration
        if (file.type.startsWith('video/')) {
          dataUrl = URL.createObjectURL(file);
          
          // Get video duration
          const videoElement = document.createElement('video');
          videoElement.src = dataUrl;
          videoElement.preload = 'metadata';
          
          await new Promise((resolve) => {
            videoElement.onloadedmetadata = () => {
              duration = formatDuration(videoElement.duration);
              resolve(true);
            };
            videoElement.onerror = () => {
              // If metadata can't be loaded, just continue
              resolve(true);
            };
            videoElement.load();
          });
        } else {
          // Compress image
          dataUrl = await compressImageFile(file);
        }
        
        const newItem: FileUploadItem = {
          id: `upload-${Date.now()}-${idx}-${Math.random()}`,
          file,
          dataUrl,
          status: 'pending',
          progress: 0,
          duration: duration
        };
        setUploadQueue((prev) => [...prev, newItem]);
      } catch (error) {
        console.error('Error processing file:', error);
        showToast('error', `Failed to process ${file.name}`);
      }
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleRemoveQueueItem = (id: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearQueue = () => {
    if (isUploading) return;
    setUploadQueue([]);
    showToast('info', 'Queue cleared');
  };

  const handleCommonDetailChange = (field: keyof BulkUploadDetails, value: any) => {
    setCommonDetails(prev => ({ ...prev, [field]: value }));
  };

  const startBatchUpload = async () => {
    if (uploadQueue.length === 0) {
      showToast('info', 'Please add at least one file from your device.');
      return;
    }

    if (!commonDetails.titleEn.trim()) {
      showToast('error', 'Please enter a Title (English) for all items.');
      return;
    }

    setIsUploading(true);

    // Prepare FormData
    const formData = new FormData();
    
    // Prepare items array as JSON string
    const items = uploadQueue.map((item, index) => {
      const isVideo = item.file.type.startsWith('video/');
      return {
        type: isVideo ? 'Video' : 'Photo',
        titleEn: commonDetails.titleEn.trim(),
        titleAr: commonDetails.titleAr.trim() || undefined,
        titleAm: commonDetails.titleAm.trim() || undefined,
        location: commonDetails.location.trim() || undefined,
        description: commonDetails.description.trim() || undefined,
        sortOrder: Number(commonDetails.sortOrder) + index,
        isActive: commonDetails.isActive,
        duration: item.duration
      };
    });
    formData.append('items', JSON.stringify(items));

    // Append files
    uploadQueue.forEach((item, index) => {
      formData.append('files', item.file);
    });

    try {
      // Update progress animation
      for (let p = 25; p <= 100; p += 25) {
        setUploadQueue((prev) =>
          prev.map((item) => ({ ...item, status: 'uploading', progress: p }))
        );
        await new Promise((r) => setTimeout(r, 150));
      }

      const result = await bulkUploadGallery(formData);
      console.log('✅ Bulk upload result:', result);

      setUploadQueue((prev) =>
        prev.map((item) => ({ ...item, status: 'success', progress: 100 }))
      );

      showToast('success', `Successfully uploaded ${uploadQueue.length} item(s) to website gallery!`);
      setTimeout(() => {
        navigate('/gallery');
      }, 1500);
    } catch (error) {
      console.error('❌ Bulk upload error:', error);
      setUploadQueue((prev) =>
        prev.map((item) => ({ ...item, status: 'error', errorMessage: 'Upload failed' }))
      );
      showToast('error', 'Failed to complete bulk upload. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const completedCount = uploadQueue.filter((i) => i.status === 'success').length;

  // Determine accepted file types based on commonDetails.type
  const getAcceptTypes = () => {
    if (commonDetails.type === 'Photo') {
      return 'image/*';
    } else {
      return 'video/*';
    }
  };

  // Play video in a modal
  const [activeVideo, setActiveVideo] = useState<FileUploadItem | null>(null);

  const openVideoPreview = (item: FileUploadItem) => {
    setActiveVideo(item);
  };

  const closeVideoPreview = () => {
    setActiveVideo(null);
  };

  return (
    <RoleGuard module="gallery" action="create">
      <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
          <button
            onClick={() => navigate('/gallery')}
            className="flex items-center gap-2 text-sm font-semibold text-[#2D3748] hover:text-[#C8102E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Gallery
          </button>
          <h2 className="text-lg font-extrabold text-[#111827]">Bulk Upload Photos & Videos</h2>
        </div>

        {/* Common Details Form - Applied to ALL Items */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#C8102E]" />
            <h3 className="font-bold text-sm text-[#111827]">Common Details for All Items</h3>
            <span className="text-xs text-[#718096]">(These details will apply to every item in this upload)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">
                Title (English) *
              </label>
              <input
                type="text"
                value={commonDetails.titleEn}
                onChange={(e) => handleCommonDetailChange('titleEn', e.target.value)}
                placeholder="e.g. Holy Kaaba & Mataf Courtyard"
                className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">
                Title (Arabic) <span className="text-[#718096] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                dir="rtl"
                value={commonDetails.titleAr}
                onChange={(e) => handleCommonDetailChange('titleAr', e.target.value)}
                placeholder="العنوان بالعربية"
                className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">
                Title (Amharic) <span className="text-[#718096] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={commonDetails.titleAm}
                onChange={(e) => handleCommonDetailChange('titleAm', e.target.value)}
                placeholder="በአማርኛ ርዕስ"
                className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">
                Location <span className="text-[#718096] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={commonDetails.location}
                onChange={(e) => handleCommonDetailChange('location', e.target.value)}
                placeholder="e.g. Masjid al-Haram, Makkah"
                className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">
                Description <span className="text-[#718096] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={commonDetails.description}
                onChange={(e) => handleCommonDetailChange('description', e.target.value)}
                placeholder="Brief description..."
                className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">
                Sort Order <span className="text-[#718096] font-normal">(Starting number)</span>
              </label>
              <input
                type="number"
                min={1}
                value={commonDetails.sortOrder}
                onChange={(e) => handleCommonDetailChange('sortOrder', Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
              <p className="text-[10px] text-[#718096] mt-1">
                Items will be ordered starting from this number
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">
                Media Type
              </label>
              <select
                value={commonDetails.type}
                onChange={(e) => handleCommonDetailChange('type', e.target.value as 'Photo' | 'Video')}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              >
                <option value="Photo">📷 Photo</option>
                <option value="Video">🎬 Video</option>
              </select>
              <p className="text-[10px] text-[#718096] mt-1">
                File picker will filter for the selected type
              </p>
            </div>

            <div className="flex items-end">
              <div className="flex items-center gap-3">
                <label className="block text-xs font-bold text-[#111827] mb-1">Status</label>
                <button
                  type="button"
                  onClick={() => handleCommonDetailChange('isActive', !commonDetails.isActive)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors ${
                    commonDetails.isActive ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-400 hover:bg-gray-500'
                  }`}
                >
                  {commonDetails.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Drag and Drop Container */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all bg-white ${
            dragActive
              ? 'border-[#C8102E] bg-rose-50/40'
              : 'border-[#E2E8F0] hover:border-[#C8102E]'
          }`}
        >
          <Upload className="w-12 h-12 text-[#C8102E] mx-auto mb-3" />
          <h3 className="font-bold text-base text-[#111827]">Drag & Drop Files From Your Device Here</h3>
          <p className="text-xs text-[#718096] mt-1 mb-4">
            {commonDetails.type === 'Photo' ? 'Select multiple photos (PNG, JPG, WEBP)' : 'Select multiple videos (MP4, MOV, AVI)'}
          </p>

          <label className="px-5 py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-2 transition-all">
            <FileImage className="w-4 h-4 text-white" /> Browse Files from Computer
            <input
              type="file"
              multiple
              accept={getAcceptTypes()}
              className="hidden"
              onChange={(e) => handleFilesAdded(e.target.files)}
            />
          </label>
        </div>

        {/* Selected Queue Items */}
        {uploadQueue.length > 0 && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-[#111827]">
                  Selected Files Queue ({uploadQueue.length})
                </h4>
                <p className="text-xs text-[#718096]">All files will use the common details entered above.</p>
              </div>
              <button
                onClick={handleClearQueue}
                disabled={isUploading}
                className="text-xs font-semibold text-[#C8102E] hover:underline disabled:opacity-50"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-1">
              {uploadQueue.map((item) => {
                const isVideo = item.file.type.startsWith('video/');
                return (
                  <div
                    key={item.id}
                    className="relative rounded-lg border border-[#E2E8F0] bg-[#F9FAFB] overflow-hidden group"
                  >
                    {isVideo ? (
                      <div 
                        className="w-full h-32 bg-[#111827] flex items-center justify-center cursor-pointer relative group"
                        onClick={() => openVideoPreview(item)}
                      >
                        <video
                          src={item.dataUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                          <div className="w-10 h-10 rounded-full bg-[#C8102E] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                              <polygon points="5,3 19,12 5,21" fill="white" />
                            </svg>
                          </div>
                        </div>
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] font-bold rounded">
                          {item.duration || 'VIDEO'}
                        </span>
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] font-bold rounded">
                          ▶ Click to play
                        </span>
                      </div>
                    ) : (
                      <img
                        src={item.dataUrl}
                        alt="Preview"
                        className="w-full h-32 object-cover"
                      />
                    )}

                    {/* Status Overlay */}
                    {item.status === 'success' && (
                      <div className="absolute inset-0 bg-emerald-900/40 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-white" />
                      </div>
                    )}

                    {item.status === 'error' && (
                      <div className="absolute inset-0 bg-rose-900/40 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-white" />
                      </div>
                    )}

                    {item.status === 'uploading' && (
                      <div className="absolute inset-0 bg-[#C8102E]/40 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}

                    {/* Remove Button */}
                    {item.status === 'pending' && (
                      <button
                        onClick={() => handleRemoveQueueItem(item.id)}
                        disabled={isUploading}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* File Name & Type */}
                    <div className="p-2 truncate text-[10px] font-medium text-[#718096] flex items-center justify-between">
                      <span className="truncate">{item.file.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-slate-200 rounded">
                        {isVideo ? 'Video' : 'Photo'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {item.status === 'uploading' && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#E2E8F0]">
                        <div
                          className="bg-[#C8102E] h-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
              <span className="text-xs font-medium text-[#718096]">
                {completedCount} of {uploadQueue.length} files ready for publishing.
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/gallery')}
                  className="px-4 py-2 rounded-lg border border-[#E2E8F0] font-semibold text-xs text-[#2D3748] hover:bg-[#F9FAFB]"
                >
                  Cancel
                </button>
                <button
                  onClick={startBatchUpload}
                  disabled={isUploading || uploadQueue.length === 0 || !commonDetails.titleEn.trim()}
                  className="px-6 py-2 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-xs shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading Batch...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-white" /> Upload All Files
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Preview Modal */}
      {activeVideo && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeVideoPreview();
            }
          }}
        >
          <div className="bg-[#111827] text-white rounded-xl border border-white/10 max-w-4xl w-full overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Video className="w-5 h-5 text-[#C8102E] shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-white truncate">{activeVideo.file.name}</h3>
                  <p className="text-[11px] text-gray-400 truncate">{activeVideo.duration || 'Video Preview'}</p>
                </div>
              </div>
              <button
                onClick={closeVideoPreview}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-black flex justify-center items-center">
              <div className="w-full aspect-video max-h-[70vh]">
                <video
                  src={activeVideo.dataUrl}
                  controls
                  autoPlay
                  className="w-full h-full rounded-lg shadow-lg object-contain bg-black"
                  playsInline
                />
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-[#1A1D20] text-xs text-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="font-bold text-[#E2E8F0] uppercase tracking-wider text-[10px] text-[#C8102E]">
                    File Details
                  </p>
                  <p className="leading-relaxed text-sm text-gray-200 whitespace-pre-wrap break-words">
                    Name: {activeVideo.file.name}
                  </p>
                  <p className="leading-relaxed text-sm text-gray-200 whitespace-pre-wrap break-words">
                    Size: {(activeVideo.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <p className="leading-relaxed text-sm text-gray-200 whitespace-pre-wrap break-words">
                    Duration: {activeVideo.duration || 'Unknown'}
                  </p>
                </div>
                <button
                  onClick={closeVideoPreview}
                  className="px-4 py-2 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-xs shrink-0 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
};