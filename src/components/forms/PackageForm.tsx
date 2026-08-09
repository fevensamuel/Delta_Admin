import React, { useState, useRef, useEffect } from 'react';
import { Package, ItineraryDay, PackageCategory } from '../../types';
import { Plus, Trash2, Calendar, X, ArrowLeft, MessageSquare, Upload, CheckCircle, Image as ImageIcon, Link, RefreshCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { compressImageFile } from '../../utils/imageUtils';
import { useExchangeRateStore } from '../../store/useExchangeRateStore';

interface PackageFormProps {
  initialData?: Package;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const PackageForm: React.FC<PackageFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const { showToast } = useToast();
  const { rate, lastUpdated, fetchRate, isLoading: isRateLoading } = useExchangeRateStore();

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  const [titleEn, setTitleEn] = useState(initialData?.titleEn || '');
  const [titleAr, setTitleAr] = useState(initialData?.titleAr || '');
  const [titleAm, setTitleAm] = useState(initialData?.titleAm || '');
  const [category, setCategory] = useState<PackageCategory>(initialData?.category || 'Standard');
  
  // Primary Price is ETB
  const [priceEtb, setPriceEtb] = useState<number>(
    initialData?.priceEtb || (initialData?.priceUsd || initialData?.price ? Math.round((initialData.priceUsd || initialData.price) * (rate || 159.98)) : 175000)
  );
  
  // Auto-calculated USD Price
  const priceUsdDisplay = rate > 0 ? priceEtb / rate : 0;
  const [durationDays, setDurationDays] = useState<number>(initialData?.durationDays || 7);
  
  // Image state & mode
  const [imageUrl, setImageUrl] = useState(
    initialData?.imageUrl || ''
  );
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inclusions, setInclusions] = useState<string[]>(
    initialData?.inclusions || []
  );
  const [newInclusion, setNewInclusion] = useState('');

  const [availableDates, setAvailableDates] = useState<string[]>(
    initialData?.availableDates || []
  );
  const [newDateInput, setNewDateInput] = useState('');

  const [itinerary, setItinerary] = useState<ItineraryDay[]>(
    initialData?.itinerary || []
  );

  const [status, setStatus] = useState<'Active' | 'Archived' | 'Inactive'>(initialData?.status || 'Active');

  // Flag to prevent auto-generation on initial load in edit mode
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Field errors state for user-friendly messages
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Generate default itinerary based on duration
  const generateDefaultItinerary = (days: number) => {
    const defaultTitles = [
      'Arrival & Welcome',
      'Day of Worship',
      'Ziyarat Tour',
      'Free Day for Ibadah',
      'Day of Reflection',
      'Departure Preparation',
      'Farewell & Return'
    ];
    
    const newItinerary: ItineraryDay[] = [];
    for (let i = 1; i <= days; i++) {
      const titleIndex = Math.min(i - 1, defaultTitles.length - 1);
      newItinerary.push({
        dayNumber: i,
        title: `Day ${i}: ${defaultTitles[titleIndex] || 'Religious Program'}`,
        description: ''
      });
    }
    return newItinerary;
  };

  // Auto-generate itinerary when duration changes (only after initial load)
  useEffect(() => {
    if (isInitialLoad) return;
    
    const currentDays = itinerary.length;
    const targetDays = durationDays;
    
    if (targetDays > currentDays) {
      const newItinerary = [...itinerary];
      for (let i = currentDays + 1; i <= targetDays; i++) {
        newItinerary.push({
          dayNumber: i,
          title: `Day ${i}: Religious Program`,
          description: ''
        });
      }
      setItinerary(newItinerary);
    } else if (targetDays < currentDays && targetDays > 0) {
      const newItinerary = itinerary.slice(0, targetDays);
      setItinerary(newItinerary);
    }
  }, [durationDays]);

  // Set initial load flag to false after component mounts
  useEffect(() => {
    if (initialData) {
      if (initialData.itinerary && initialData.itinerary.length > 0) {
        setIsInitialLoad(false);
      } else {
        const defaultItinerary = generateDefaultItinerary(initialData.durationDays || durationDays);
        setItinerary(defaultItinerary);
        setIsInitialLoad(false);
      }
    } else {
      const defaultItinerary = generateDefaultItinerary(durationDays);
      setItinerary(defaultItinerary);
      setIsInitialLoad(false);
    }
  }, [initialData]);

  useEffect(() => {
    if (initialData?.itinerary && initialData.itinerary.length > 0) {
      setItinerary(initialData.itinerary);
    }
  }, [initialData?.itinerary]);

  // Handle device image file selection
  const handleImageFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select a valid image file (PNG, JPG, WEBP)');
      return;
    }
    try {
      // Store the file for submission
      setSelectedImageFile(file);
      // Show preview
      const compressedDataUrl = await compressImageFile(file);
      setImageUrl(compressedDataUrl);
      showToast('success', 'Package image loaded from device');
    } catch {
      showToast('error', 'Failed to process image file');
    }
  };

  const handleAddInclusion = () => {
    if (!newInclusion.trim()) return;
    setInclusions((prev) => [...prev, newInclusion.trim()]);
    setNewInclusion('');
  };

  const handleRemoveInclusion = (index: number) => {
    setInclusions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddDate = () => {
    if (!newDateInput) return;
    if (availableDates.includes(newDateInput)) {
      showToast('info', 'Date already added');
      return;
    }
    setAvailableDates((prev) => [...prev, newDateInput]);
    setNewDateInput('');
  };

  const handleRemoveDate = (dateStr: string) => {
    setAvailableDates((prev) => prev.filter((d) => d !== dateStr));
  };

  const handleAddItineraryDay = () => {
    const nextDayNum = itinerary.length + 1;
    setItinerary((prev) => [
      ...prev,
      { dayNumber: nextDayNum, title: `Day ${nextDayNum} Program`, description: '' }
    ]);
    setDurationDays(itinerary.length + 1);
  };

  const handleUpdateItineraryDay = (index: number, field: keyof ItineraryDay, value: string) => {
    setItinerary((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveItineraryDay = (index: number) => {
    setItinerary((prev) =>
      prev.filter((_, i) => i !== index).map((day, idx) => ({ ...day, dayNumber: idx + 1 }))
    );
    setDurationDays(itinerary.length - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setFieldErrors({});

    // Validation with user-friendly messages
    const errors: Record<string, string> = {};
    
    if (!titleEn.trim()) {
      errors.titleEn = 'English Title is required. Please enter a title for your package.';
    }
    
    if (!category) {
      errors.category = 'Category is required. Please select a package category.';
    }
    
    if (priceEtb <= 0) {
      errors.priceEtb = 'Valid price is required. Please enter a price greater than 0.';
    }
    
    if (durationDays <= 0) {
      errors.durationDays = 'Duration must be at least 1 day. Please enter a valid number of days.';
    }
    
    if (!imageUrl && !selectedImageFile) {
      errors.imageUrl = 'Image is required. Please upload an image for the package.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      showToast('error', firstError);
      return;
    }

    try {
      const formData = new FormData();
      
      // Append all fields
      formData.append('titleEn', titleEn.trim());
      formData.append('titleAr', titleAr.trim() || '');
      formData.append('titleAm', titleAm.trim() || '');
      formData.append('category', category);
      formData.append('priceUsd', String(priceUsdDisplay));
      formData.append('durationDays', String(durationDays));
      formData.append('departureCity', 'Addis Ababa');
      formData.append('inclusions', JSON.stringify(inclusions));
      formData.append('availableDates', JSON.stringify(availableDates));
      formData.append('itinerary', JSON.stringify(itinerary));
      formData.append('status', status);
      formData.append('isActive', String(status === 'Active'));

      // Append image file if selected
      if (selectedImageFile) {
        formData.append('packageImage', selectedImageFile);
      } else if (imageUrl) {
        // If using URL, send as imageUrl
        formData.append('imageUrl', imageUrl);
      }

      console.log('📤 PackageForm - Submitting FormData');
      await onSubmit(formData);
    } catch (error: any) {
      console.error('❌ Submit error:', error);
      const errorMessage = error?.response?.data?.error || 
                          error?.message || 
                          'Failed to create package. Please check all fields and try again.';
      showToast('error', errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 text-sm font-semibold text-[#2D3748] hover:text-[#C8102E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Packages
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-[#E2E8F0] font-semibold text-sm text-[#2D3748] hover:bg-[#F9FAFB] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {initialData ? 'Update Package' : 'Save Package'}
          </button>
        </div>
      </div>

      {/* WhatsApp Clicks Display (Read-only counter for existing package) */}
      {initialData && (
        <div className="bg-[#C8102E]/5 border border-[#C8102E]/20 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C8102E] text-white flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#111827]">WhatsApp Click Lead Counter</h4>
              <p className="text-xs text-[#718096]">Read-only counter showing customer engagement for this package</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-[#C8102E]">{initialData.whatsappClicks || 0}</span>
            <span className="block text-[11px] font-semibold text-[#718096]">total clicks</span>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg border border-[#E2E8F0] shadow-xs space-y-5">
        <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C8102E]" /> Basic Package Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Title (English) *</label>
            <input
              type="text"
              required
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="e.g. 14 Days Premium Ramadan Umrah"
              className={`w-full px-3.5 py-2 rounded-lg border ${fieldErrors.titleEn ? 'border-red-500' : 'border-[#E2E8F0]'} text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]`}
            />
            {fieldErrors.titleEn && <p className="text-red-500 text-[10px] mt-1">{fieldErrors.titleEn}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Title (Arabic) <span className="text-[#718096] font-normal">(Optional)</span></label>
            <input
              type="text"
              dir="rtl"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              placeholder="برنامج العمرة الرمضانية"
              className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Title (Amharic) <span className="text-[#718096] font-normal">(Optional)</span></label>
            <input
              type="text"
              value={titleAm}
              onChange={(e) => setTitleAm(e.target.value)}
              placeholder="የኡምራ ፓኬጅ"
              className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PackageCategory)}
              className={`w-full px-3.5 py-2 rounded-lg border ${fieldErrors.category ? 'border-red-500' : 'border-[#E2E8F0]'} text-sm font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]`}
            >
              <option value="Economy">Economy</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
              <option value="VIP">VIP</option>
            </select>
            {fieldErrors.category && <p className="text-red-500 text-[10px] mt-1">{fieldErrors.category}</p>}
          </div>

          {/* Primary - Price (ETB) */}
          <div>
            <label htmlFor="priceEtb" className="block text-xs font-bold text-[#111827] mb-1">
              Price (ETB) *
            </label>
            <div className="relative">
              <input
                id="priceEtb"
                type="number"
                required
                min={1}
                value={priceEtb || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setPriceEtb(val);
                }}
                placeholder="Enter price in Ethiopian Birr (e.g., 185000)"
                className={`w-full px-3.5 py-2 rounded-lg border ${fieldErrors.priceEtb ? 'border-red-500' : 'border-[#E2E8F0]'} text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]`}
              />
            </div>
            <p className="text-[10px] text-[#718096] mt-1">
              1 USD = {rate.toFixed(2)} ETB
            </p>
            {fieldErrors.priceEtb && <p className="text-red-500 text-[10px] mt-1">{fieldErrors.priceEtb}</p>}
          </div>

          {/* Secondary - Price (USD) - Auto-calculated */}
          <div>
            <label htmlFor="priceUsd" className="block text-xs font-bold text-[#111827] mb-1">
              Price (USD) - Auto-calculated
            </label>
            <div className="relative">
              <input
                id="priceUsd"
                type="text"
                readOnly
                disabled
                value={priceUsdDisplay ? `$${priceUsdDisplay.toFixed(2)}` : 'Auto-calculated'}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm font-bold text-[#111827] cursor-not-allowed opacity-80"
              />
            </div>
            <p className="text-[10px] text-emerald-600 font-medium mt-1">
              Auto-calculated based on real-time exchange rate
            </p>
          </div>

          {/* Duration (Days) - CLEARABLE WITH VALIDATION */}
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Duration (Days) *</label>
            <div className="relative">
              <input
                type="number"
                required
                min={1}
                step={1}
                value={durationDays || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setDurationDays(0);
                    setFieldErrors(prev => ({ ...prev, durationDays: 'Duration must be at least 1 day' }));
                  } else {
                    const num = parseInt(val, 10);
                    if (!isNaN(num) && num >= 0) {
                      setDurationDays(num);
                      if (num > 0) {
                        setFieldErrors(prev => ({ ...prev, durationDays: '' }));
                      }
                    }
                  }
                }}
                onBlur={() => {
                  if (durationDays <= 0) {
                    setFieldErrors(prev => ({ ...prev, durationDays: 'Duration must be at least 1 day' }));
                    showToast('error', 'Duration must be at least 1 day');
                    setDurationDays(1);
                  }
                }}
                className={`w-full px-3.5 py-2 rounded-lg border ${fieldErrors.durationDays ? 'border-red-500' : 'border-[#E2E8F0]'} text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]`}
                placeholder="Enter duration in days"
              />
              {durationDays <= 0 && !fieldErrors.durationDays && (
                <p className="text-red-500 text-[10px] mt-1">Duration is required (minimum 1 day)</p>
              )}
              {fieldErrors.durationDays && (
                <p className="text-red-500 text-[10px] mt-1">{fieldErrors.durationDays}</p>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              ⚡ Itinerary days auto-update when changed ({itinerary.length} days)
            </p>
          </div>
        </div>

        {/* Real-time Exchange Rate Banner */}
        <div className="p-3 bg-gradient-to-r from-[#F8FAFC] to-[#EDF2F7] border border-[#E2E8F0] rounded-lg flex items-center justify-between text-xs text-[#2D3748]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#C8102E]">💱 Real-Time Exchange Rate:</span>
            <span className="font-extrabold text-[#111827]">{rate.toFixed(2)} ETB / USD</span>
            {lastUpdated && (
              <span className="text-[#718096] text-[11px]">
                • Last updated: {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fetchRate()}
            disabled={isRateLoading}
            className="flex items-center gap-1 text-[11px] font-bold text-[#C8102E] hover:underline cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isRateLoading ? 'animate-spin' : ''}`} /> Refresh Rate
          </button>
        </div>

        {/* Device Image Uploader Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-[#111827]">
              Package Image *
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setImageInputMode('upload')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  imageInputMode === 'upload'
                    ? 'bg-[#C8102E] text-white shadow-xs'
                    : 'bg-[#F9FAFB] text-[#2D3748] border border-[#E2E8F0]'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setImageInputMode('url')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  imageInputMode === 'url'
                    ? 'bg-[#C8102E] text-white shadow-xs'
                    : 'bg-[#F9FAFB] text-[#2D3748] border border-[#E2E8F0]'
                }`}
              >
                Image URL
              </button>
            </div>
          </div>

          {imageInputMode === 'upload' ? (
            <div>
              {imageUrl && imageUrl.startsWith('data:') ? (
                <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E2E8F0] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={imageUrl} alt="Package Cover" className="w-20 h-16 object-cover rounded-md border border-[#E2E8F0] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111827] flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-emerald-600" /> Image Loaded
                      </p>
                      <p className="text-[11px] text-[#718096] truncate mt-0.5">{selectedImageFile?.name || 'Ready for upload'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setImageUrl(''); setSelectedImageFile(null); }}
                    className="px-3 py-1.5 text-xs font-bold text-[#C8102E] hover:bg-rose-50 rounded-lg border border-[#E2E8F0]"
                  >
                    Change Image
                  </button>
                </div>
              ) : (
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
                    dragActive
                      ? 'border-[#C8102E] bg-rose-50/50'
                      : 'border-[#E2E8F0] hover:border-[#C8102E] bg-[#F9FAFB]'
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
                  <Upload className="w-8 h-8 text-[#C8102E] mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#111827]">Click or drag to upload package image</p>
                  <p className="text-[11px] text-[#718096] mt-1">PNG, JPG, WEBP supported</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setSelectedImageFile(null);
                  }}
                  placeholder="https://images.unsplash.com/photo-..."
                  className={`w-full px-3.5 py-2 rounded-lg border ${fieldErrors.imageUrl ? 'border-red-500' : 'border-[#E2E8F0]'} text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]`}
                />
                {imageUrl && imageUrl.startsWith('http') && (
                  <img src={imageUrl} alt="Preview" className="w-12 h-10 object-cover rounded-lg border border-[#E2E8F0] shrink-0" />
                )}
              </div>
              {fieldErrors.imageUrl && <p className="text-red-500 text-[10px] mt-1">{fieldErrors.imageUrl}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Inclusions & Available Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inclusions */}
        <div className="bg-white p-6 rounded-lg border border-[#E2E8F0] shadow-xs space-y-4">
          <h3 className="text-base font-bold text-[#111827]">Inclusions</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newInclusion}
              onChange={(e) => setNewInclusion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddInclusion();
                }
              }}
              placeholder="Add inclusion (e.g. Visa Included)"
              className="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            />
            <button
              type="button"
              onClick={handleAddInclusion}
              className="px-3.5 py-2 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-semibold text-xs transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {inclusions.length === 0 ? (
              <p className="text-xs text-[#718096] italic">No inclusions added yet</p>
            ) : (
              inclusions.map((inc, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E2E8F0] text-xs text-[#2D3748] font-medium">
                  <span>{inc}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInclusion(i)}
                    className="text-[#718096] hover:text-[#C8102E] transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Available Dates */}
        <div className="bg-white p-6 rounded-lg border border-[#E2E8F0] shadow-xs space-y-4">
          <h3 className="text-base font-bold text-[#111827]">Available Departure Dates</h3>
          <div className="flex gap-2">
            <input
              type="date"
              value={newDateInput}
              onChange={(e) => setNewDateInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            />
            <button
              type="button"
              onClick={handleAddDate}
              className="px-3.5 py-2 rounded-lg bg-[#111827] hover:bg-black text-white font-semibold text-xs transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Date
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {availableDates.length === 0 ? (
              <p className="text-xs text-[#718096] italic">No dates added yet</p>
            ) : (
              availableDates.map((dateStr) => (
                <div key={dateStr} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C8102E]/10 border border-[#C8102E]/20 text-[#C8102E] text-xs font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-[#C8102E]" />
                  <span>{dateStr}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDate(dateStr)}
                    className="text-[#C8102E] hover:text-[#A00D24] transition-colors ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Itinerary Builder */}
      <div className="bg-white p-6 rounded-lg border border-[#E2E8F0] shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Day-by-Day Itinerary</h3>
            <p className="text-xs text-[#718096]">Specify schedule details for each day of the journey. ({itinerary.length} days)</p>
          </div>
          <button
            type="button"
            onClick={handleAddItineraryDay}
            className="px-3.5 py-2 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Day
          </button>
        </div>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {itinerary.length === 0 ? (
            <div className="text-center py-8 text-[#718096]">
              <p className="text-sm font-medium">No itinerary days set.</p>
              <p className="text-xs mt-1">Click "Add Day" to start building the itinerary.</p>
            </div>
          ) : (
            itinerary.map((day, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F9FAFB] space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#111827] text-white">
                    Day {day.dayNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItineraryDay(idx)}
                    className="text-[#718096] hover:text-[#C8102E] p-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={day.title}
                    onChange={(e) => handleUpdateItineraryDay(idx, 'title', e.target.value)}
                    placeholder="Day title (e.g. Arrival in Makkah)"
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-sm bg-white text-[#111827]"
                  />
                  <input
                    type="text"
                    value={day.description}
                    onChange={(e) => handleUpdateItineraryDay(idx, 'description', e.target.value)}
                    placeholder="Day description details..."
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-sm bg-white text-[#111827]"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status & Submit */}
      <div className="bg-white p-6 rounded-lg border border-[#E2E8F0] shadow-xs flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-[#111827] mb-1">Active / Inactive Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm font-semibold text-[#111827]"
          >
            <option value="Active">Active (Published)</option>
            <option value="Inactive">Inactive (Hidden)</option>
            <option value="Archived">Archived</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg border border-[#E2E8F0] text-[#2D3748] font-semibold text-sm hover:bg-[#F9FAFB] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {initialData ? 'Update Package' : 'Save Package'}
          </button>
        </div>
      </div>
    </form>
  );
};