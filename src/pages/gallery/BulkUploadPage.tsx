import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bulkUploadGallery } from '../../api/gallery';
import { RoleGuard } from '../../components/common/RoleGuard';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, Upload, CheckCircle2, AlertCircle, FileImage, X, Loader2, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { compressImageFile } from '../../utils/imageUtils';

interface FileUploadItem {
  id: string;
  file: File;
  titleEn: string;
  titleAr: string;
  location: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  dataUrl: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  errorMessage?: string;
  isExpanded?: boolean;
}

export const BulkUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [uploadQueue, setUploadQueue] = useState<FileUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFilesAdded = (filesList: FileList | null) => {
    if (!filesList) return;

    const filesArray = Array.from(filesList);
    filesArray.forEach(async (file, idx) => {
      if (!file.type.startsWith('image/')) {
        showToast('error', `Skipped non-image file: ${file.name}`);
        return;
      }

      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const formattedTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

      try {
        const compressedDataUrl = await compressImageFile(file);
        const newItem: FileUploadItem = {
          id: `upload-${Date.now()}-${idx}-${Math.random()}`,
          file,
          titleEn: formattedTitle,
          titleAr: '',
          location: '',
          description: '',
          sortOrder: idx + 1,
          isActive: true,
          dataUrl: compressedDataUrl,
          status: 'pending',
          progress: 0,
          isExpanded: false
        };
        setUploadQueue((prev) => [...prev, newItem]);
      } catch {
        showToast('error', `Failed to process ${file.name}`);
      }
    });

    showToast('info', `Processing ${filesArray.length} images...`);
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

  const handleUpdateItemField = (id: string, field: keyof FileUploadItem, value: any) => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const toggleExpand = (id: string) => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isExpanded: !item.isExpanded } : item))
    );
  };

  const startBatchUpload = async () => {
    if (uploadQueue.length === 0) {
      showToast('info', 'Please add at least one image file from your device.');
      return;
    }

    setIsUploading(true);

    const payload = uploadQueue.map((item) => ({
      type: 'Photo' as const,
      titleEn: item.titleEn.trim() || 'Uploaded Photo',
      titleAr: item.titleAr.trim() || undefined,
      imageUrl: item.dataUrl, // Actual device file Data URL!
      location: item.location.trim() || undefined,
      description: item.description.trim() || undefined,
      sortOrder: Number(item.sortOrder) || 1,
      isActive: item.isActive
    }));

    try {
      // Update progress animation
      for (let p = 25; p <= 100; p += 25) {
        setUploadQueue((prev) =>
          prev.map((item) => ({ ...item, status: 'uploading', progress: p }))
        );
        await new Promise((r) => setTimeout(r, 150));
      }

      await bulkUploadGallery(payload);

      setUploadQueue((prev) =>
        prev.map((item) => ({ ...item, status: 'success', progress: 100 }))
      );

      showToast('success', `Successfully uploaded ${uploadQueue.length} photos to website gallery!`);
      setTimeout(() => {
        navigate('/gallery');
      }, 1000);
    } catch {
      setUploadQueue((prev) =>
        prev.map((item) => ({ ...item, status: 'error', errorMessage: 'Upload failed' }))
      );
      showToast('error', 'Failed to complete bulk upload');
    } finally {
      setIsUploading(false);
    }
  };

  const completedCount = uploadQueue.filter((i) => i.status === 'success').length;

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
          <h2 className="text-lg font-extrabold text-[#111827]">Bulk Upload Device Photos</h2>
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
          <h3 className="font-bold text-base text-[#111827]">Drag & Drop Photos From Your Device Here</h3>
          <p className="text-xs text-[#718096] mt-1 mb-4">Select multiple photos (PNG, JPG, WEBP formats up to 15MB each).</p>

          <label className="px-5 py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-2 transition-all">
            <FileImage className="w-4 h-4 text-white" /> Browse Photos from Computer
            <input
              type="file"
              multiple
              accept="image/*"
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
                  Selected Photos Queue ({uploadQueue.length})
                </h4>
                <p className="text-xs text-[#718096]">You can edit titles, locations, and descriptions for each photo below.</p>
              </div>
              <button
                onClick={() => setUploadQueue([])}
                disabled={isUploading}
                className="text-xs font-semibold text-[#C8102E] hover:underline"
              >
                Clear Queue
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {uploadQueue.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-[#E2E8F0] bg-[#F9FAFB] p-3.5 space-y-3"
                >
                  {/* Top Bar of Queue Card */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={item.dataUrl}
                        alt="Preview"
                        className="w-14 h-12 object-cover rounded-md border border-[#E2E8F0] shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={item.titleEn}
                          disabled={isUploading}
                          onChange={(e) => handleUpdateItemField(item.id, 'titleEn', e.target.value)}
                          placeholder="Photo Title (English) *"
                          className="w-full px-2.5 py-1 text-xs font-bold rounded border border-[#E2E8F0] text-[#111827] bg-white focus:ring-1 focus:ring-[#C8102E]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        className="px-2.5 py-1 rounded border border-[#E2E8F0] bg-white text-[11px] font-semibold text-[#2D3748] hover:bg-gray-100 flex items-center gap-1"
                      >
                        {item.isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {item.isExpanded ? 'Less Details' : 'More Details'}
                      </button>

                      {/* Status Indicator */}
                      {item.status === 'success' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" /> Uploaded
                        </span>
                      )}

                      {item.status === 'error' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#FC8181]">
                          <AlertCircle className="w-4 h-4" /> Failed
                        </span>
                      )}

                      {item.status === 'uploading' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#C8102E]">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </span>
                      )}

                      {item.status === 'pending' && (
                        <button
                          onClick={() => handleRemoveQueueItem(item.id)}
                          disabled={isUploading}
                          className="text-[#718096] hover:text-[#C8102E] p-1"
                          title="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Metadata Inputs */}
                  {item.isExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#E2E8F0] bg-white p-3 rounded-lg">
                      <div>
                        <label className="block text-[11px] font-bold text-[#111827] mb-0.5">Arabic Title</label>
                        <input
                          type="text"
                          dir="rtl"
                          value={item.titleAr}
                          onChange={(e) => handleUpdateItemField(item.id, 'titleAr', e.target.value)}
                          placeholder="العنوان بالعربية"
                          className="w-full px-2.5 py-1 text-xs rounded border border-[#E2E8F0] text-[#111827]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#111827] mb-0.5">Location</label>
                        <input
                          type="text"
                          value={item.location}
                          onChange={(e) => handleUpdateItemField(item.id, 'location', e.target.value)}
                          placeholder="e.g. Makkah, Saudi Arabia"
                          className="w-full px-2.5 py-1 text-xs rounded border border-[#E2E8F0] text-[#111827]"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-[#111827] mb-0.5">Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItemField(item.id, 'description', e.target.value)}
                          placeholder="Short description..."
                          className="w-full px-2.5 py-1 text-xs rounded border border-[#E2E8F0] text-[#111827]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#111827] mb-0.5">Sort Order</label>
                        <input
                          type="number"
                          min={1}
                          value={item.sortOrder}
                          onChange={(e) => handleUpdateItemField(item.id, 'sortOrder', Number(e.target.value))}
                          className="w-full px-2.5 py-1 text-xs rounded border border-[#E2E8F0] text-[#111827]"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemField(item.id, 'isActive', !item.isActive)}
                          className={`px-3 py-1 rounded text-xs font-bold text-white ${
                            item.isActive ? 'bg-emerald-600' : 'bg-gray-400'
                          }`}
                        >
                          {item.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {item.status === 'uploading' && (
                    <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#C8102E] h-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
              <span className="text-xs font-medium text-[#718096]">
                {completedCount} of {uploadQueue.length} photos ready for bulk publishing.
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
                  disabled={isUploading || uploadQueue.length === 0}
                  className="px-6 py-2 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-xs shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading Batch...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-white" /> Start Uploading All
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
};
