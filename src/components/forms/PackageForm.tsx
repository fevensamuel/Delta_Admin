import React, { useState, useRef, useEffect } from 'react';
import { Package, ItineraryDay, PackageCategory } from '../../types';
import { Plus, Trash2, Calendar, X, ArrowLeft, MessageSquare, Upload, CheckCircle, Image as ImageIcon, Link, RefreshCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { compressImageFile } from '../../utils/imageUtils';
import { useExchangeRateStore } from '../../store/useExchangeRateStore';

interface PackageFormProps {
  initialData?: Package;
  onSubmit: (data: Omit<Package, 'id' | 'whatsappClicks' | 'createdAt' | 'updatedAt'>) => Promise<void>;
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
  const [durationDays, setDurationDays] = useState<number>(initialData?.durationDays || 10);
  
  // Image state & mode
  const [imageUrl, setImageUrl] = useState(
    initialData?.imageUrl || 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&q=80&w=800'
  );
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inclusions, setInclusions] = useState<string[]>(
    initialData?.inclusions || ['Hotel Accommodation', 'Visa Processing', 'Airport Transfers', 'Guided Ziyarat Tours']
  );
  const [newInclusion, setNewInclusion] = useState('');

  const [availableDates, setAvailableDates] = useState<string[]>(
    initialData?.availableDates || ['2026-08-15', '2026-09-01']
  );
  const [newDateInput, setNewDateInput] = useState('');

  const [itinerary, setItinerary] = useState<ItineraryDay[]>(
    initialData?.itinerary || [
      { dayNumber: 1, title: 'Arrival in Jeddah & Transfer to Makkah', description: 'Meet at Jeddah Airport and transfer to hotel. Perform Umrah.' },
      { dayNumber: 2, title: 'Ibadah & Prayer in Makkah', description: 'Prayers at Masjid Al-Haram.' }
    ]
  );

  const [status, setStatus] = useState<'Active' | 'Archived' | 'Inactive'>(initialData?.status || 'Active');

  // Handle device image file selection
  const handleImageFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select a valid image file (PNG, JPG, WEBP)');
      return;
    }
    try {
      const compressedDataUrl = await compressImageFile(file);
      setImageUrl(compressedDataUrl);
      showToast('success', 'Package cover image loaded and compressed from device');
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim()) {
      showToast('error', 'English Title is required');
      return;
    }
    if (priceEtb <= 0) {
      showToast('error', 'ETB Price must be positive and greater than 0');
      return;
    }
    if (!imageUrl) {
      showToast('error', 'Package cover image is required');
      return;
    }

    try {
      await onSubmit({
        titleEn,
        titleAr,
        titleAm,
        category,
        priceEtb,
        priceUsd: priceUsdDisplay,
        price: priceUsdDisplay,
        durationDays,
        imageUrl,
        inclusions,
        availableDates,
        itinerary,
        status
      });
    } catch {
      // Toast handled by caller
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
              className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Title (Arabic)</label>
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
            <label className="block text-xs font-bold text-[#111827] mb-1">Title (Amharic)</label>
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
              className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            >
              <option value="Economy">Economy</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
              <option value="VIP">VIP</option>
            </select>
          </div>

          {/* Primary - Price (ETB) (Admin enters this) */}
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
                className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]"
              />
            </div>
            <p className="text-[10px] text-[#718096] mt-1">
              1 USD = {rate.toFixed(2)} ETB
            </p>
          </div>

          {/* Secondary - Price (USD) (Read-only, auto-calculated) */}
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

          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Duration (Days) *</label>
            <input
              type="number"
              required
              min={1}
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            />
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
              Package Cover Image *
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
                Upload File from Device
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
                        <CheckCircle className="w-4 h-4 text-emerald-600" /> Image Uploaded from Device
                      </p>
                      <p className="text-[11px] text-[#718096] truncate mt-0.5">Ready for package listing</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
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
                  <p className="text-xs font-bold text-[#111827]">Click or drag to upload package photo from device</p>
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
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="flex-1 px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
                {imageUrl && (
                  <img src={imageUrl} alt="Preview" className="w-12 h-10 object-cover rounded-lg border border-[#E2E8F0] shrink-0" />
                )}
              </div>
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
            {inclusions.map((inc, i) => (
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
            ))}
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
            {availableDates.map((dateStr) => (
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
            ))}
          </div>
        </div>
      </div>

      {/* Itinerary Builder */}
      <div className="bg-white p-6 rounded-lg border border-[#E2E8F0] shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Day-by-Day Itinerary</h3>
            <p className="text-xs text-[#718096]">Specify schedule details for each day of the journey.</p>
          </div>
          <button
            type="button"
            onClick={handleAddItineraryDay}
            className="px-3.5 py-2 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Day
          </button>
        </div>

        <div className="space-y-4">
          {itinerary.map((day, idx) => (
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
          ))}
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
