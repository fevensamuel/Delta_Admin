import React, { useEffect, useState, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { getOfficeImagesApi, createOfficeImageApi, updateOfficeImageApi, deleteOfficeImageApi } from '../../api/officeImages';
import { OfficeImage } from '../../types';
import { Plus, Trash2, Save, X, Edit, Loader2, Image as ImageIcon, Upload } from 'lucide-react';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

// Helper function to get full image URL
const getFullImageUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const baseWithoutApi = API_BASE_URL.replace(/\/api$/, '');
  if (path.startsWith('/uploads')) {
    return `${baseWithoutApi}${path}`;
  }
  return `${baseWithoutApi}${path}`;
};

export const OfficeImages: React.FC = () => {
  const { showToast } = useToast();
  const [images, setImages] = useState<OfficeImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<OfficeImage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const [newImage, setNewImage] = useState({
    title: '',
    description: '',
    order: 0,
    isActive: true
  });

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    try {
      const data = await getOfficeImagesApi();
      setImages(data);
    } catch (error) {
      showToast('error', 'Failed to load office images');
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select a valid image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'Image size must be less than 10MB');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = async () => {
    if (!selectedFile) {
      showToast('error', 'Please select an image');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', newImage.title || '');
      formData.append('description', newImage.description || '');
      formData.append('order', String(images.length + 1));
      formData.append('isActive', 'true');
      formData.append('image', selectedFile);

      const created = await createOfficeImageApi(formData);
      setImages(prev => [...prev, created]);
      setNewImage({ title: '', description: '', order: 0, isActive: true });
      setSelectedFile(null);
      setImagePreview('');
      setShowAddForm(false);
      showToast('success', 'Office image added successfully!');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to add office image');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string, data: Partial<OfficeImage>) => {
    try {
      const updated = await updateOfficeImageApi(id, data);
      setImages(prev => prev.map(img => img.id === id ? updated : img));
      showToast('success', 'Office image updated successfully');
      setEditingId(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update office image');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!imageToDelete) return;
    setIsDeleting(true);
    try {
      await deleteOfficeImageApi(imageToDelete.id);
      setImages(prev => prev.filter(img => img.id !== imageToDelete.id));
      showToast('success', 'Office image deleted successfully');
      setImageToDelete(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete office image');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleActive = async (image: OfficeImage) => {
    await handleUpdate(image.id, { isActive: !image.isActive });
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
    setImages(newImages);
    for (let i = 0; i < newImages.length; i++) {
      await updateOfficeImageApi(newImages[i].id, { order: i + 1 });
    }
    showToast('success', 'Order updated successfully');
  };

  const moveDown = async (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    setImages(newImages);
    for (let i = 0; i < newImages.length; i++) {
      await updateOfficeImageApi(newImages[i].id, { order: i + 1 });
    }
    showToast('success', 'Order updated successfully');
  };

   if (loading) {
      return (
        <LoadingSpinner text="Loading Office Images..." />
      );
    }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">Office Images</h2>
          <p className="text-sm text-[#718096]">Manage images for the "Visit Our Office" page</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-xs rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Office Image
        </button>
      </div>

      {/* Add Form with File Upload - Title is Optional */}
      {showAddForm && (
        <div className="bg-[#F9FAFB] border border-[#E2E8F0] rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Image Title (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Office Reception (Optional)"
              value={newImage.title}
              onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
            />
          </div>
          
          {/* File Upload */}
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Image File *</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files?.[0]) handleImageFileSelect(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                dragActive ? 'border-[#C8102E] bg-rose-50/50' :
                imagePreview ? 'border-emerald-500 bg-emerald-50' :
                'border-[#E2E8F0] hover:border-[#C8102E] bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleImageFileSelect(e.target.files[0]);
                }}
              />
              {imagePreview ? (
                <div className="flex items-center justify-center gap-4">
                  <img src={imagePreview} alt="Preview" className="h-24 w-auto object-contain rounded-lg border border-[#E2E8F0]" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-emerald-700">Image Ready</p>
                    <p className="text-xs text-[#718096]">{selectedFile?.name}</p>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setImagePreview(''); setSelectedFile(null); }}
                      className="text-xs text-[#C8102E] hover:underline mt-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Upload className="w-8 h-8 text-[#718096]" />
                  <span className="text-sm text-[#718096]">Click or drag & drop to upload</span>
                  <span className="text-xs text-[#718096]">JPG, PNG, WEBP (max 5MB)</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Description (Optional)</label>
            <textarea
              placeholder="Brief description of the office image"
              value={newImage.description}
              onChange={(e) => setNewImage({ ...newImage, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              disabled={isSubmitting || !selectedFile}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Upload Image
                </>
              )}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewImage({ title: '', description: '', order: 0, isActive: true }); setSelectedFile(null); setImagePreview(''); }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
        {images.length === 0 ? (
          <div className="px-4 py-12 text-center text-[#718096]">
            <ImageIcon className="w-12 h-12 mx-auto text-[#E2E8F0] mb-3" />
            <p className="font-semibold">No office images found</p>
            <p className="text-sm">Click "Add Office Image" to upload one</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {images.map((image, index) => {
              const isEditing = editingId === image.id;
              const fullImageUrl = getFullImageUrl(image.imageUrl);

              return (
                <div key={image.id} className="p-4 hover:bg-[#F9FAFB] transition-colors">
                  <div className="flex items-start gap-4">
                    <img
                      src={fullImageUrl}
                      alt={image.title || 'Office Image'}
                      className="w-20 h-16 object-cover rounded-lg border border-[#E2E8F0] flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="60" viewBox="0 0 80 60"%3E%3Crect width="80" height="60" fill="%23e5e7eb"/%3E%3Ctext x="40" y="32" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="10" font-family="sans-serif"%3ENo Image%3C/text%3E%3C/svg%3E';
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            defaultValue={image.title || ''}
                            placeholder="Title (Optional)"
                            onBlur={(e) => handleUpdate(image.id, { title: e.target.value })}
                            className="w-full px-2 py-1 rounded border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E]"
                          />
                          <textarea
                            defaultValue={image.description || ''}
                            onBlur={(e) => handleUpdate(image.id, { description: e.target.value })}
                            rows={2}
                            className="w-full px-2 py-1 rounded border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E]"
                            placeholder="Description (Optional)"
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
                              {image.title && (
                                <h3 className="font-bold text-[#111827]">{image.title}</h3>
                              )}
                              {image.description && (
                                <p className="text-xs text-[#718096] mt-1">{image.description}</p>
                              )}
                              <p className="text-[10px] text-[#718096] mt-1">Order: #{image.order || index + 1}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                image.isActive !== false
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {image.isActive !== false ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            <button
                              onClick={() => setEditingId(image.id)}
                              className="p-1.5 rounded hover:bg-[#E2E8F0] text-[#718096]"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => toggleActive(image)}
                              className="p-1.5 rounded hover:bg-[#E2E8F0] text-[#718096]"
                              title={image.isActive !== false ? 'Deactivate' : 'Activate'}
                            >
                              {image.isActive !== false ? <X className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => setImageToDelete(image)}
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
                              disabled={index === images.length - 1}
                              className="p-1.5 rounded hover:bg-[#E2E8F0] text-[#718096] disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move Down"
                            >
                              ↓
                            </button>
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
          <li>Images appear on the "Visit Our Office" page in the order shown</li>
          <li>Upload square or landscape images (recommended: 800x600px) for best results</li>
          <li>Title is optional - you can leave it blank</li>
          <li>Use the up/down arrows to reorder images</li>
          <li>Set an image as "Inactive" to hide it from the public website</li>
        </ul>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!imageToDelete}
        title="Delete Office Image?"
        message={`Are you sure you want to delete this office image${imageToDelete?.title ? ` "${imageToDelete.title}"` : ''}?`}
        confirmLabel="Delete Image"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setImageToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};