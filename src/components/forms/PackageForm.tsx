import React, { useState, useRef, useEffect } from 'react';
import { Package, ItineraryDay, PackageCategory, PriceType, Discount } from '../../types';
import { Plus, Trash2, Calendar, X, ArrowLeft, MessageSquare, Upload, CheckCircle, RefreshCw, DollarSign, Tag } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { compressImageFile } from '../../utils/imageUtils';
import { useExchangeRateStore } from '../../store/useExchangeRateStore';

interface PackageFormProps {
  initialData?: Package;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Helper to get full image URL for display
const getFullImageUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (path.startsWith('data:')) {
    return path;
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const baseWithoutApi = baseUrl.replace(/\/api$/, '');
  if (path.startsWith('/uploads')) {
    return `${baseWithoutApi}${path}`;
  }
  return `${baseWithoutApi}${path}`;
};

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

  const parseArray = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // --- ALL STATE DECLARATIONS ---
  const [titleEn, setTitleEn] = useState(initialData?.titleEn || '');
  const [titleAr, setTitleAr] = useState(initialData?.titleAr || '');
  const [titleAm, setTitleAm] = useState(initialData?.titleAm || '');
  const [category, setCategory] = useState<PackageCategory>(initialData?.category || 'Standard');
  
  const [priceType, setPriceType] = useState<PriceType>(
    initialData?.priceType || 
    (initialData?.priceUsdMax && initialData.priceUsdMax > (initialData?.priceUsd || 0) ? 'range' : 'single')
  );
  
  const [priceUsd, setPriceUsd] = useState<number>(initialData?.priceUsd || initialData?.price || 0);
  const [priceEtb, setPriceEtb] = useState<number>(initialData?.priceEtb || 0);
  const [priceSar, setPriceSar] = useState<number>(initialData?.priceSar || 0);
  
  const [priceUsdMin, setPriceUsdMin] = useState<number>(initialData?.priceUsdMin || initialData?.priceUsd || 0);
  const [priceUsdMax, setPriceUsdMax] = useState<number>(initialData?.priceUsdMax || 0);
  const [priceEtbMin, setPriceEtbMin] = useState<number>(initialData?.priceEtbMin || 0);
  const [priceEtbMax, setPriceEtbMax] = useState<number>(initialData?.priceEtbMax || 0);
  const [priceSarMin, setPriceSarMin] = useState<number>(initialData?.priceSarMin || 0);
  const [priceSarMax, setPriceSarMax] = useState<number>(initialData?.priceSarMax || 0);
  
  const [discounts, setDiscounts] = useState<Discount[]>(parseArray(initialData?.discounts));
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [discountAppliedTo, setDiscountAppliedTo] = useState<'age' | 'group' | 'none'>('none');
  const [newDiscount, setNewDiscount] = useState<Discount>({
    id: `disc-${Date.now()}`,
    type: 'percentage',
    value: 0,
    label: '',
    description: '',
    isActive: true
  });
  
  const [durationDays, setDurationDays] = useState<number>(initialData?.durationDays || 7);
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inclusions, setInclusions] = useState<string[]>(parseArray(initialData?.inclusions));
  const [newInclusion, setNewInclusion] = useState('');

  const [availableDates, setAvailableDates] = useState<string[]>(parseArray(initialData?.availableDates));
  const [newDateInput, setNewDateInput] = useState('');

  const [itinerary, setItinerary] = useState<ItineraryDay[]>(parseArray(initialData?.itinerary));

  const [status, setStatus] = useState<'Active' | 'Inactive'>(initialData?.status || 'Active');
  const [priceReason, setPriceReason] = useState('');

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // --- EFFECTS ---
  
  // Handle price type switching - sets min/max when switching to range
  useEffect(() => {
    if (priceType === 'range') {
      if (priceUsdMin === 0 && priceUsdMax === 0) {
        setPriceUsdMin(priceUsd || 0);
        setPriceUsdMax(priceUsd || 0);
        setPriceEtbMin(priceEtb || 0);
        setPriceEtbMax(priceEtb || 0);
        setPriceSarMin(priceSar || 0);
        setPriceSarMax(priceSar || 0);
      }
    }
  }, [priceType]);

  // Generate default itinerary when duration changes
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
      setItinerary(itinerary.slice(0, targetDays));
    }
  }, [durationDays]);

  // Initialize itinerary from existing data
  useEffect(() => {
    if (initialData) {
      if (initialData.itinerary && initialData.itinerary.length > 0) {
        setIsInitialLoad(false);
      } else {
        setItinerary(generateDefaultItinerary(initialData.durationDays || durationDays));
        setIsInitialLoad(false);
      }
    } else {
      setItinerary(generateDefaultItinerary(durationDays));
      setIsInitialLoad(false);
    }
  }, [initialData]);

  // --- FUNCTIONS ---

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

  const autoFillPrices = () => {
    if (priceType === 'single') {
      if (priceUsd > 0) {
        const newEtb = Math.round(priceUsd * rate);
        const newSar = Math.round(priceUsd * 3.75);
        setPriceEtb(newEtb);
        setPriceSar(newSar);
        showToast('success', `Prices auto-filled: ${newEtb} ETB, ${newSar} SAR`);
      } else if (priceEtb > 0) {
        const newUsd = Math.round(priceEtb / rate);
        const newSar = Math.round(newUsd * 3.75);
        setPriceUsd(newUsd);
        setPriceSar(newSar);
        showToast('success', `Prices auto-filled: $${newUsd} USD, ${newSar} SAR`);
      } else if (priceSar > 0) {
        const newUsd = Math.round(priceSar / 3.75);
        const newEtb = Math.round(newUsd * rate);
        setPriceUsd(newUsd);
        setPriceEtb(newEtb);
        showToast('success', `Prices auto-filled: $${newUsd} USD, ${newEtb} ETB`);
      } else {
        showToast('error', 'Please enter at least one price (USD, ETB, or SAR) first');
      }
    } else if (priceType === 'range') {
      if (priceUsdMin > 0) {
        const newEtbMin = Math.round(priceUsdMin * rate);
        const newSarMin = Math.round(priceUsdMin * 3.75);
        setPriceEtbMin(newEtbMin);
        setPriceSarMin(newSarMin);
        if (priceUsdMax > 0) {
          const newEtbMax = Math.round(priceUsdMax * rate);
          const newSarMax = Math.round(priceUsdMax * 3.75);
          setPriceEtbMax(newEtbMax);
          setPriceSarMax(newSarMax);
        }
        showToast('success', 'Price range auto-filled');
      } else {
        showToast('error', 'Please enter a USD minimum price first');
      }
    }
  };

  const handleAddDiscount = () => {
    if (!newDiscount.label || newDiscount.value <= 0) {
      showToast('error', 'Please fill in all discount fields');
      return;
    }
    if (newDiscount.type === 'percentage' && newDiscount.value > 100) {
      showToast('error', 'Percentage discount cannot exceed 100%');
      return;
    }
    setDiscounts([...discounts, { ...newDiscount, id: `disc-${Date.now()}` }]);
    setNewDiscount({
      id: `disc-${Date.now()}`,
      type: 'percentage',
      value: 0,
      label: '',
      description: '',
      isActive: true
    });
    setShowDiscountForm(false);
    setDiscountAppliedTo('none');
    showToast('success', 'Discount added successfully');
  };

  const handleRemoveDiscount = (index: number) => {
    setDiscounts(discounts.filter((_, i) => i !== index));
  };

  const handleImageFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select a valid image file (PNG, JPG, WEBP)');
      return;
    }
    try {
      setSelectedImageFile(file);
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
    setFieldErrors({});
    const errors: Record<string, string> = {};
    
    if (!titleEn.trim()) errors.titleEn = 'English Title is required.';
    if (!category) errors.category = 'Category is required.';
    
    if (priceType === 'single' && priceUsd <= 0) errors.priceUsd = 'Valid USD price is required.';
    if (priceType === 'range' && priceUsdMin <= 0) errors.priceUsd = 'Valid USD minimum price is required.';
    if (durationDays <= 0) errors.durationDays = 'Duration must be at least 1 day.';
    if (!imageUrl && !selectedImageFile && !initialData?.imageUrl) errors.imageUrl = 'Image is required.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast('error', Object.values(errors)[0]);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('titleEn', titleEn.trim());
      formData.append('titleAr', titleAr.trim() || '');
      formData.append('titleAm', titleAm.trim() || '');
      formData.append('category', category);
      formData.append('priceType', priceType);
      
      if (priceType === 'single') {
        formData.append('priceUsd', String(priceUsd));
        formData.append('priceEtb', String(priceEtb || Math.round(priceUsd * rate)));
        formData.append('priceSar', String(priceSar || Math.round(priceUsd * 3.75)));
        formData.append('price', String(priceUsd));
      } else if (priceType === 'range') {
        const minUsd = priceUsdMin || 0;
        const maxUsd = priceUsdMax || minUsd;
        
        formData.append('priceUsd', String(minUsd));
        formData.append('priceUsdMin', String(minUsd));
        formData.append('priceUsdMax', String(maxUsd));
        formData.append('priceEtbMin', String(priceEtbMin || Math.round(minUsd * rate)));
        formData.append('priceEtbMax', String(priceEtbMax || Math.round(maxUsd * rate)));
        formData.append('priceSarMin', String(priceSarMin || Math.round(minUsd * 3.75)));
        formData.append('priceSarMax', String(priceSarMax || Math.round(maxUsd * 3.75)));
        formData.append('price', String(minUsd));
      }
      
      formData.append('durationDays', String(durationDays));
      formData.append('departureCity', 'Addis Ababa');
      formData.append('inclusions', JSON.stringify(inclusions));
      formData.append('availableDates', JSON.stringify(availableDates));
      formData.append('itinerary', JSON.stringify(itinerary));
      formData.append('status', status);
      formData.append('isActive', String(status === 'Active'));
      
      if (discounts.length > 0) {
        formData.append('discounts', JSON.stringify(discounts));
      }
      
      if (priceReason) {
        formData.append('reason', priceReason);
      }

      if (selectedImageFile) {
        formData.append('packageImage', selectedImageFile);
      } else if (imageUrl && imageUrl.startsWith('http')) {
        formData.append('imageUrl', imageUrl);
      } else if (initialData?.imageUrl) {
        formData.append('imageUrl', initialData.imageUrl);
      }

      await onSubmit(formData);
    } catch (error: any) {
      console.error('❌ Submit error:', error);
      showToast('error', error?.response?.data?.error || error?.message || 'Failed to save package.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <button type="button" onClick={onCancel} className="flex items-center gap-2 text-sm font-semibold text-[#2D3748] hover:text-[#C8102E] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Packages
        </button>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-[#E2E8F0] font-semibold text-sm text-[#2D3748] hover:bg-[#F9FAFB] transition-colors">Cancel</button>
          <button type="submit" disabled={isLoading} className="px-6 py-2 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer">
            {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {initialData ? 'Update Package' : 'Save Package'}
          </button>
        </div>
      </div>

      {initialData && (
        <div className="bg-[#C8102E]/5 border border-[#C8102E]/20 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C8102E] text-white flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#111827]">WhatsApp Click Lead Counter</h4>
              <p className="text-xs text-[#718096]">Read-only counter showing customer engagement</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-[#C8102E]">{initialData.whatsappClicks || 0}</span>
            <span className="block text-[11px] font-semibold text-[#718096]">total clicks</span>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border border-[#E2E8F0] shadow-xs space-y-5">
        <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C8102E]" /> Basic Package Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Title (English) *</label>
            <input type="text" required value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="e.g. 14 Days Premium Ramadan Umrah" className={`w-full px-3.5 py-2 rounded-lg border ${fieldErrors.titleEn ? 'border-red-500' : 'border-[#E2E8F0]'} text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]`} />
            {fieldErrors.titleEn && <p className="text-red-500 text-[10px] mt-1">{fieldErrors.titleEn}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Title (Arabic) <span className="text-[#718096] font-normal">(Optional)</span></label>
            <input type="text" dir="rtl" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} placeholder="برنامج العمرة الرمضانية" className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Title (Amharic) <span className="text-[#718096] font-normal">(Optional)</span></label>
            <input type="text" value={titleAm} onChange={(e) => setTitleAm(e.target.value)} placeholder="የኡምራ ፓኬጅ" className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Category *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as PackageCategory)} className={`w-full px-3.5 py-2 rounded-lg border ${fieldErrors.category ? 'border-red-500' : 'border-[#E2E8F0]'} text-sm font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]`}>
              <option value="Economy">Economy</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
              <option value="VIP">VIP</option>
            </select>
            {fieldErrors.category && <p className="text-red-500 text-[10px] mt-1">{fieldErrors.category}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Duration (Days) *</label>
            <input type="number" required min={1} step={1} value={durationDays || ''} onChange={(e) => { const val = e.target.value; if (val === '') setDurationDays(0); else { const num = parseInt(val, 10); if (!isNaN(num) && num >= 0) setDurationDays(num); } }} className={`w-full px-3.5 py-2 rounded-lg border ${fieldErrors.durationDays ? 'border-red-500' : 'border-[#E2E8F0]'} text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]`} placeholder="Enter duration in days" />
            {fieldErrors.durationDays && <p className="text-red-500 text-[10px] mt-1">{fieldErrors.durationDays}</p>}
          </div>
        </div>

        <div className="border-t border-[#E2E8F0] pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-[#111827]">Pricing</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPriceType('single')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${priceType === 'single' ? 'bg-[#2D7D6B] text-white' : 'bg-[#F9FAFB] text-[#2D3748] border border-[#E2E8F0]'}`}>Single</button>
              <button type="button" onClick={() => setPriceType('range')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${priceType === 'range' ? 'bg-[#2D7D6B] text-white' : 'bg-[#F9FAFB] text-[#2D3748] border border-[#E2E8F0]'}`}>Range</button>
              <button type="button" onClick={autoFillPrices} className="px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-black text-white text-xs font-bold transition-colors flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Auto-fill
              </button>
            </div>
          </div>

          {priceType === 'single' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1">Price (USD) *</label>
                <input type="number" required min={1} step={0.01} value={priceUsd || ''} onChange={(e) => { const val = parseFloat(e.target.value) || 0; setPriceUsd(val); }} className={`w-full px-3.5 py-2 rounded-lg border ${fieldErrors.priceUsd ? 'border-red-500' : 'border-[#E2E8F0]'} text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]`} placeholder="Enter USD" />
                {fieldErrors.priceUsd && <p className="text-red-500 text-[10px] mt-1">{fieldErrors.priceUsd}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1">Price (ETB)</label>
                <input type="number" min={1} value={priceEtb || ''} onChange={(e) => { const val = parseFloat(e.target.value) || 0; setPriceEtb(val); }} className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]" placeholder="Enter ETB" />
                <p className="text-[10px] text-[#718096] mt-1">Auto: {priceUsd > 0 ? Math.round(priceUsd * rate).toLocaleString() : '—'} ETB</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1">Price (SAR)</label>
                <input type="number" min={1} value={priceSar || ''} onChange={(e) => { const val = parseFloat(e.target.value) || 0; setPriceSar(val); }} className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]" placeholder="Enter SAR" />
                <p className="text-[10px] text-[#718096] mt-1">Auto: {priceUsd > 0 ? Math.round(priceUsd * 3.75).toLocaleString() : '—'} SAR</p>
              </div>
            </div>
          )}

          {priceType === 'range' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#111827] mb-1">Range (USD) *</label>
                  <div className="flex items-center gap-2">
                    <input type="number" required min={1} step={0.01} value={priceUsdMin || ''} onChange={(e) => { const val = parseFloat(e.target.value) || 0; setPriceUsdMin(val); }} className={`w-full px-3.5 py-2 rounded-lg border ${fieldErrors.priceUsd ? 'border-red-500' : 'border-[#E2E8F0]'} text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]`} placeholder="Min" />
                    <span className="text-[#718096] font-bold">-</span>
                    <input type="number" min={1} step={0.01} value={priceUsdMax || ''} onChange={(e) => { const val = parseFloat(e.target.value) || 0; setPriceUsdMax(val); }} className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]" placeholder="Max" />
                  </div>
                  {fieldErrors.priceUsd && <p className="text-red-500 text-[10px] mt-1">{fieldErrors.priceUsd}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111827] mb-1">Range (ETB)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} value={priceEtbMin || ''} onChange={(e) => { const val = parseFloat(e.target.value) || 0; setPriceEtbMin(val); }} className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]" placeholder="Min" />
                    <span className="text-[#718096] font-bold">-</span>
                    <input type="number" min={1} value={priceEtbMax || ''} onChange={(e) => { const val = parseFloat(e.target.value) || 0; setPriceEtbMax(val); }} className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D7D6B]" placeholder="Max" />
                  </div>
                  <p className="text-[10px] text-[#718096] mt-1">Auto: {priceUsdMin > 0 ? Math.round(priceUsdMin * rate).toLocaleString() : '—'} ETB</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111827] mb-1">Range (SAR)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} value={priceSarMin || ''} onChange={(e) => { const val = parseFloat(e.target.value) || 0; setPriceSarMin(val); }} className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]" placeholder="Min" />
                    <span className="text-[#718096] font-bold">-</span>
                    <input type="number" min={1} value={priceSarMax || ''} onChange={(e) => { const val = parseFloat(e.target.value) || 0; setPriceSarMax(val); }} className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]" placeholder="Max" />
                  </div>
                  <p className="text-[10px] text-[#718096] mt-1">Auto: {priceUsdMin > 0 ? Math.round(priceUsdMin * 3.75).toLocaleString() : '—'} SAR</p>
                </div>
              </div>
            </div>
          )}

          {/* Price Reason Field - For price logs */}
          <div className="mt-3">
            <label className="block text-xs font-bold text-[#111827] mb-1">
              Price Change Reason <span className="font-normal text-[#718096]">(Optional, for audit log)</span>
            </label>
            <input 
              type="text" 
              value={priceReason} 
              onChange={(e) => setPriceReason(e.target.value)} 
              placeholder="e.g. Seasonal adjustment, Updated package inclusions, Promotional offer" 
              className="w-full px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]" 
            />
            <p className="text-[9px] text-[#718096] mt-1">This reason will appear in the Price Change Logs</p>
          </div>
        </div>

        {/* Discounts Section */}
        <div className="border-t border-[#E2E8F0] pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#C8102E]" /> Discounts & Special Offers
            </label>
            <button 
              type="button" 
              onClick={() => setShowDiscountForm(!showDiscountForm)} 
              className="px-3 py-1.5 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Discount
            </button>
          </div>

          {showDiscountForm && (
            <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E2E8F0] space-y-3 mb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111827] mb-1">Discount Type *</label>
                  <select
                    value={newDiscount.type}
                    onChange={(e) => setNewDiscount({ ...newDiscount, type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111827] mb-1">Discount Label *</label>
                  <input
                    type="text"
                    value={newDiscount.label}
                    onChange={(e) => setNewDiscount({ ...newDiscount, label: e.target.value })}
                    placeholder="e.g. Family Discount, Group Discount, Senior Citizens"
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111827] mb-1">
                    {newDiscount.type === 'percentage' ? 'Discount % *' : 'Discount Amount *'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={newDiscount.type === 'percentage' ? 100 : undefined}
                    value={newDiscount.value || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setNewDiscount({ ...newDiscount, value: val });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm"
                    placeholder={newDiscount.type === 'percentage' ? 'e.g. 15' : 'e.g. 50'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111827] mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    value={newDiscount.description || ''}
                    onChange={(e) => setNewDiscount({ ...newDiscount, description: e.target.value })}
                    placeholder="e.g. 15% off for families of 4 or more"
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111827] mb-1">Discount Applied To</label>
                  <select
                    value={discountAppliedTo}
                    onChange={(e) => setDiscountAppliedTo(e.target.value as 'age' | 'group' | 'none')}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm"
                  >
                    <option value="none">None (General Discount)</option>
                    <option value="age">Age Group</option>
                    <option value="group">Group Size</option>
                  </select>
                </div>
                {discountAppliedTo === 'age' && (
                  <div>
                    <label className="block text-xs font-bold text-[#111827] mb-1">Age Group</label>
                    <input
                      type="text"
                      value={newDiscount.ageGroup || ''}
                      onChange={(e) => setNewDiscount({ ...newDiscount, ageGroup: e.target.value })}
                      placeholder="e.g. 60+, 0-12, 13-17"
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm"
                    />
                  </div>
                )}
                {discountAppliedTo === 'group' && (
                  <div>
                    <label className="block text-xs font-bold text-[#111827] mb-1">Min Persons</label>
                    <input
                      type="number"
                      min={1}
                      value={newDiscount.minPersons || ''}
                      onChange={(e) => setNewDiscount({ ...newDiscount, minPersons: parseInt(e.target.value) || undefined })}
                      placeholder="e.g. 4"
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={handleAddDiscount} 
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                >
                  Add Discount
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowDiscountForm(false);
                    setDiscountAppliedTo('none');
                  }} 
                  className="px-4 py-2 rounded-lg border border-[#E2E8F0] text-xs font-bold text-[#718096] hover:bg-[#F9FAFB] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {discounts.length > 0 ? (
            <div className="space-y-2">
              {discounts.map((discount, index) => (
                <div key={discount.id || index} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800">{discount.label}</span>
                    <span className="text-xs text-emerald-700">
                      {discount.type === 'percentage' ? `${discount.value}% off` : `$${discount.value} off`}
                    </span>
                    {discount.minPersons && (
                      <span className="text-xs text-emerald-700">({discount.minPersons}+ people)</span>
                    )}
                    {discount.ageGroup && (
                      <span className="text-xs text-emerald-700">(Age: {discount.ageGroup})</span>
                    )}
                    {discount.description && (
                      <span className="text-[10px] text-emerald-600">({discount.description})</span>
                    )}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveDiscount(index)} 
                    className="text-emerald-600 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#718096] italic">No discounts added yet</p>
          )}
        </div>

        <div className="p-3 bg-gradient-to-r from-[#F8FAFC] to-[#EDF2F7] border border-[#E2E8F0] rounded-lg flex items-center justify-between text-xs text-[#2D3748]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#C8102E]">💱 Real-Time Exchange Rate:</span>
            <span className="font-extrabold text-[#111827]">{rate.toFixed(2)} ETB / USD</span>
            {lastUpdated && <span className="text-[#718096] text-[11px]">• Last updated: {new Date(lastUpdated).toLocaleTimeString()}</span>}
          </div>
          <button type="button" onClick={() => fetchRate()} disabled={isRateLoading} className="flex items-center gap-1 text-[11px] font-bold text-[#C8102E] hover:underline cursor-pointer">
            <RefreshCw className={`w-3 h-3 ${isRateLoading ? 'animate-spin' : ''}`} /> Refresh Rate
          </button>
        </div>

        {/* Image Upload */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-[#111827]">Package Image</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setImageInputMode('upload')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${imageInputMode === 'upload' ? 'bg-[#C8102E] text-white shadow-xs' : 'bg-[#F9FAFB] text-[#2D3748] border border-[#E2E8F0]'}`}>Upload File</button>
              <button type="button" onClick={() => setImageInputMode('url')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${imageInputMode === 'url' ? 'bg-[#C8102E] text-white shadow-xs' : 'bg-[#F9FAFB] text-[#2D3748] border border-[#E2E8F0]'}`}>Image URL</button>
            </div>
          </div>

          {imageInputMode === 'upload' ? (
            <div>
              {imageUrl && imageUrl.startsWith('/uploads') && !selectedImageFile ? (
                <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E2E8F0] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={getFullImageUrl(imageUrl)} alt="Package Cover" className="w-20 h-16 object-cover rounded-md border border-[#E2E8F0] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111827] flex items-center gap-1"><CheckCircle className="w-4 h-4 text-emerald-600" /> Image Loaded</p>
                      <p className="text-[11px] text-[#718096] truncate mt-0.5">Current package image</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setImageUrl(''); setSelectedImageFile(null); }} className="px-3 py-1.5 text-xs font-bold text-[#C8102E] hover:bg-rose-50 rounded-lg border border-[#E2E8F0]">Change Image</button>
                </div>
              ) : imageUrl && imageUrl.startsWith('data:') ? (
                <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E2E8F0] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={imageUrl} alt="Package Cover" className="w-20 h-16 object-cover rounded-md border border-[#E2E8F0] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111827] flex items-center gap-1"><CheckCircle className="w-4 h-4 text-emerald-600" /> Image Loaded</p>
                      <p className="text-[11px] text-[#718096] truncate mt-0.5">{selectedImageFile?.name || 'Ready for upload'}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setImageUrl(''); setSelectedImageFile(null); }} className="px-3 py-1.5 text-xs font-bold text-[#C8102E] hover:bg-rose-50 rounded-lg border border-[#E2E8F0]">Change Image</button>
                </div>
              ) : (
                <div onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleImageFileSelect(e.dataTransfer.files[0]); }} onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${dragActive ? 'border-[#C8102E] bg-rose-50/50' : 'border-[#E2E8F0] hover:border-[#C8102E] bg-[#F9FAFB]'}`}>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImageFileSelect(e.target.files[0]); }} />
                  <Upload className="w-10 h-10 text-[#C8102E] mx-auto mb-3" />
                  <p className="text-sm font-bold text-[#111827]">Click or drag & drop to upload package image</p>
                  <p className="text-xs text-[#718096] mt-1">PNG, JPG, WEBP supported • Max 5MB</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex gap-3">
                <input type="url" value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); setSelectedImageFile(null); }} placeholder="https://example.com/image.jpg" className={`w-full px-3.5 py-2 rounded-lg border ${fieldErrors.imageUrl ? 'border-red-500' : 'border-[#E2E8F0]'} text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C8102E]`} />
                {imageUrl && imageUrl.startsWith('http') && <img src={imageUrl} alt="Preview" className="w-12 h-10 object-cover rounded-lg border border-[#E2E8F0] shrink-0" />}
              </div>
              {fieldErrors.imageUrl && <p className="text-red-500 text-[10px] mt-1">{fieldErrors.imageUrl}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-[#E2E8F0] shadow-xs space-y-4">
          <h3 className="text-base font-bold text-[#111827]">Inclusions</h3>
          <div className="flex gap-2">
            <input type="text" value={newInclusion} onChange={(e) => setNewInclusion(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddInclusion(); } }} placeholder="Add inclusion (e.g. Visa Included)" className="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]" />
            <button type="button" onClick={handleAddInclusion} className="px-3.5 py-2 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-semibold text-xs transition-colors flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {inclusions.length === 0 ? <p className="text-xs text-[#718096] italic">No inclusions added yet</p> : inclusions.map((inc, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E2E8F0] text-xs text-[#2D3748] font-medium">
                <span>{inc}</span>
                <button type="button" onClick={() => handleRemoveInclusion(i)} className="text-[#718096] hover:text-[#C8102E] transition-colors p-1"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-[#E2E8F0] shadow-xs space-y-4">
          <h3 className="text-base font-bold text-[#111827]">Available Departure Dates</h3>
          <div className="flex gap-2">
            <input type="date" value={newDateInput} onChange={(e) => setNewDateInput(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]" />
            <button type="button" onClick={handleAddDate} className="px-3.5 py-2 rounded-lg bg-[#111827] hover:bg-black text-white font-semibold text-xs transition-colors flex items-center gap-1"><Plus className="w-4 h-4" /> Add Date</button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {availableDates.length === 0 ? <p className="text-xs text-[#718096] italic">No dates added yet</p> : availableDates.map((dateStr) => (
              <div key={dateStr} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C8102E]/10 border border-[#C8102E]/20 text-[#C8102E] text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#C8102E]" />
                <span>{dateStr}</span>
                <button type="button" onClick={() => handleRemoveDate(dateStr)} className="text-[#C8102E] hover:text-[#A00D24] transition-colors ml-1"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-[#E2E8F0] shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Day-by-Day Itinerary</h3>
            <p className="text-xs text-[#718096]">Specify schedule details for each day. ({itinerary.length} days)</p>
          </div>
          <button type="button" onClick={handleAddItineraryDay} className="px-3.5 py-2 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-semibold text-xs transition-colors flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add Day</button>
        </div>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {itinerary.length === 0 ? (
            <div className="text-center py-8 text-[#718096]"><p className="text-sm font-medium">No itinerary days set.</p><p className="text-xs mt-1">Click "Add Day" to start building.</p></div>
          ) : (
            itinerary.map((day, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F9FAFB] space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#111827] text-white">Day {day.dayNumber}</span>
                  <button type="button" onClick={() => handleRemoveItineraryDay(idx)} className="text-[#718096] hover:text-[#C8102E] p-1 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" value={day.title} onChange={(e) => handleUpdateItineraryDay(idx, 'title', e.target.value)} placeholder="Day title" className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-sm bg-white text-[#111827]" />
                  <input type="text" value={day.description} onChange={(e) => handleUpdateItineraryDay(idx, 'description', e.target.value)} placeholder="Day description" className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-sm bg-white text-[#111827]" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-[#E2E8F0] shadow-xs flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-[#111827] mb-1">Package Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')} className="px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm font-semibold text-[#111827]">
            <option value="Active">Active (Published)</option>
            <option value="Inactive">Inactive (Hidden)</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-lg border border-[#E2E8F0] text-[#2D3748] font-semibold text-sm hover:bg-[#F9FAFB] transition-colors">Cancel</button>
          <button type="submit" disabled={isLoading} className="px-6 py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2 disabled:opacity-50">
            {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {initialData ? 'Update Package' : 'Save Package'}
          </button>
        </div>
      </div>
    </form>
  );
};