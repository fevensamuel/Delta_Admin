import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { getTestimonialsApi, createTestimonialApi, updateTestimonialApi, deleteTestimonialApi } from '../../api/testimonials';
import { Testimonial } from '../../types';
import { Plus, Trash2, Save, X, Edit, Loader2, Star, User, Quote } from 'lucide-react';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const Testimonials: React.FC = () => {
  const { showToast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newTestimonial, setNewTestimonial] = useState({
    name: '',
    location: '',
    rating: 5,
    text: '',
    date: new Date().toISOString().split('T')[0],
    isActive: true
  });

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    setLoading(true);
    try {
      const data = await getTestimonialsApi();
      setTestimonials(data);
    } catch (error) {
      showToast('error', 'Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newTestimonial.name.trim() || !newTestimonial.text.trim()) {
      showToast('error', 'Name and text are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createTestimonialApi({
        ...newTestimonial,
        isActive: true
      });
      setTestimonials(prev => [created, ...prev]);
      setNewTestimonial({ name: '', location: '', rating: 5, text: '', date: new Date().toISOString().split('T')[0], isActive: true });
      setShowAddForm(false);
      showToast('success', 'Testimonial added successfully!');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to add testimonial');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string, data: Partial<Testimonial>) => {
    try {
      const updated = await updateTestimonialApi(id, data);
      setTestimonials(prev => prev.map(t => t.id === id ? updated : t));
      showToast('success', 'Testimonial updated successfully');
      setEditingId(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update testimonial');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!testimonialToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTestimonialApi(testimonialToDelete.id);
      setTestimonials(prev => prev.filter(t => t.id !== testimonialToDelete.id));
      showToast('success', 'Testimonial deleted successfully');
      setTestimonialToDelete(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete testimonial');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleActive = async (testimonial: Testimonial) => {
    await handleUpdate(testimonial.id, { isActive: !testimonial.isActive });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-3.5 h-3.5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  if (loading) {
        return (
          <LoadingSpinner text="Loading Testimonials..." />
        );
      }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">Testimonials</h2>
          <p className="text-sm text-[#718096]">Manage customer reviews and testimonials</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-xs rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Testimonial
        </button>
      </div>

      {/* Add Form - NO AVATAR */}
      {showAddForm && (
        <div className="bg-[#F9FAFB] border border-[#E2E8F0] rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Customer Name *"
              value={newTestimonial.name}
              onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
            />
            <input
              type="text"
              placeholder="Location (e.g., Addis Ababa, Ethiopia)"
              value={newTestimonial.location}
              onChange={(e) => setNewTestimonial({ ...newTestimonial, location: e.target.value })}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Rating (1-5)</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewTestimonial({ ...newTestimonial, rating: star })}
                  className={`p-1 rounded ${star <= newTestimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  <Star className={`w-6 h-6 ${star <= newTestimonial.rating ? 'fill-yellow-400' : ''}`} />
                </button>
              ))}
              <span className="text-xs text-[#718096] ml-2">{newTestimonial.rating} / 5</span>
            </div>
          </div>
          <textarea
            placeholder="Testimonial Text *"
            value={newTestimonial.text}
            onChange={(e) => setNewTestimonial({ ...newTestimonial, text: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="date"
              value={newTestimonial.date}
              onChange={(e) => setNewTestimonial({ ...newTestimonial, date: e.target.value })}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Add Testimonial
                </>
              )}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewTestimonial({ name: '', location: '', rating: 5, text: '', date: new Date().toISOString().split('T')[0], isActive: true }); }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
        {testimonials.length === 0 ? (
          <div className="px-4 py-12 text-center text-[#718096]">
            <Quote className="w-12 h-12 mx-auto text-[#E2E8F0] mb-3" />
            <p className="font-semibold">No testimonials found</p>
            <p className="text-sm">Click "Add Testimonial" to create one</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {testimonials.map((testimonial) => {
              const isEditing = editingId === testimonial.id;

              return (
                <div key={testimonial.id} className="p-4 hover:bg-[#F9FAFB] transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Default user icon instead of avatar */}
                    <div className="w-12 h-12 rounded-full bg-[#C8102E]/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-[#C8102E]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            defaultValue={testimonial.name}
                            onBlur={(e) => handleUpdate(testimonial.id, { name: e.target.value })}
                            className="w-full px-2 py-1 rounded border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E]"
                            placeholder="Name"
                          />
                          <input
                            type="text"
                            defaultValue={testimonial.location}
                            onBlur={(e) => handleUpdate(testimonial.id, { location: e.target.value })}
                            className="w-full px-2 py-1 rounded border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E]"
                            placeholder="Location"
                          />
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => handleUpdate(testimonial.id, { rating: star })}
                                className="p-0.5"
                              >
                                <Star className={`w-4 h-4 ${star <= (testimonial.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                              </button>
                            ))}
                          </div>
                          <textarea
                            defaultValue={testimonial.text}
                            onBlur={(e) => handleUpdate(testimonial.id, { text: e.target.value })}
                            rows={2}
                            className="w-full px-2 py-1 rounded border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E]"
                            placeholder="Testimonial text"
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
                              <h3 className="font-bold text-[#111827]">{testimonial.name}</h3>
                              {testimonial.location && (
                                <p className="text-xs text-[#718096]">{testimonial.location}</p>
                              )}
                              <div className="flex items-center gap-0.5 mt-1">
                                {renderStars(testimonial.rating || 5)}
                              </div>
                              <p className="text-xs text-[#718096] mt-2 italic">"{testimonial.text}"</p>
                              <p className="text-[10px] text-[#718096] mt-1">Date: {testimonial.date}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                testimonial.isActive !== false
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {testimonial.isActive !== false ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            <button
                              onClick={() => setEditingId(testimonial.id)}
                              className="p-1.5 rounded hover:bg-[#E2E8F0] text-[#718096]"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => toggleActive(testimonial)}
                              className="p-1.5 rounded hover:bg-[#E2E8F0] text-[#718096]"
                              title={testimonial.isActive !== false ? 'Deactivate' : 'Activate'}
                            >
                              {testimonial.isActive !== false ? <X className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => setTestimonialToDelete(testimonial)}
                              className="p-1.5 rounded hover:bg-rose-50 text-[#C8102E]"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
          <li>Testimonials appear on the Home page in the reviews section</li>
          <li>Set a testimonial as "Inactive" to hide it from the public website</li>
        </ul>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!testimonialToDelete}
        title="Delete Testimonial?"
        message={`Are you sure you want to delete "${testimonialToDelete?.name}"'s testimonial?`}
        confirmLabel="Delete Testimonial"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTestimonialToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};