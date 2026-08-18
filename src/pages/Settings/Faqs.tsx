import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { getFaqsApi, createFaqApi, updateFaqApi, deleteFaqApi } from '../../api/faqs';
import { FAQItem } from '../../types';
import { Plus, Trash2, Save, X, Edit, Loader2 } from 'lucide-react';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const Faqs: React.FC = () => {
  const { showToast } = useToast();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState('');
  const [editingAnswer, setEditingAnswer] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  
  // Delete confirmation state
  const [faqToDelete, setFaqToDelete] = useState<FAQItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = async () => {
    setLoading(true);
    try {
      const data = await getFaqsApi();
      setFaqs(data);
    } catch (error) {
      showToast('error', 'Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (faq: FAQItem) => {
    setEditingId(faq.id);
    setEditingQuestion(faq.question);
    setEditingAnswer(faq.answer);
  };

  const handleSave = async (id: string) => {
    if (!editingQuestion.trim() || !editingAnswer.trim()) {
      showToast('error', 'Question and answer are required');
      return;
    }
    try {
      await updateFaqApi(id, editingQuestion.trim(), editingAnswer.trim());
      showToast('success', 'FAQ updated successfully');
      loadFaqs();
      setEditingId(null);
      setEditingQuestion('');
      setEditingAnswer('');
    } catch (error) {
      showToast('error', 'Failed to update FAQ');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingQuestion('');
    setEditingAnswer('');
  };

  const handleDeleteConfirm = async () => {
    if (!faqToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFaqApi(faqToDelete.id);
      showToast('success', 'FAQ deleted successfully');
      setFaqToDelete(null);
      loadFaqs();
    } catch (error) {
      showToast('error', 'Failed to delete FAQ');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      showToast('error', 'Question and answer are required');
      return;
    }
    try {
      await createFaqApi(newQuestion.trim(), newAnswer.trim());
      showToast('success', 'FAQ created successfully');
      setNewQuestion('');
      setNewAnswer('');
      setShowAddForm(false);
      loadFaqs();
    } catch (error) {
      showToast('error', 'Failed to create FAQ');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8102E]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">FAQs</h2>
          <p className="text-sm text-[#718096]">Manage frequently asked questions for the public FAQ page</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-xs rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add FAQ
        </button>
      </div>

      {/* Add New FAQ Form */}
      {showAddForm && (
        <div className="bg-[#F9FAFB] border border-[#E2E8F0] rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Question</label>
            <input
              type="text"
              placeholder="Enter the question..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">Answer</label>
            <textarea
              placeholder="Enter the answer..."
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
            >
              <Save className="w-4 h-4" /> Create FAQ
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewQuestion(''); setNewAnswer(''); }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Existing FAQs */}
      {faqs.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-12 text-center text-[#718096]">
          <p className="font-semibold">No FAQs found</p>
          <p className="text-sm">Click "Add FAQ" to create one</p>
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq) => {
            const isEditing = editingId === faq.id;

            return (
              <div key={faq.id} className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
                <div className="bg-[#F9FAFB] px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <span className="font-bold text-[#111827] text-sm">FAQ</span>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSave(faq.id)}
                          className="px-3 py-1.5 rounded bg-[#C8102E] hover:bg-[#A00D24] text-white text-xs font-bold flex items-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" /> Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-3 py-1.5 rounded border border-[#E2E8F0] hover:bg-[#F9FAFB] text-xs font-bold flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(faq)}
                          className="px-3 py-1.5 rounded bg-[#111827] hover:bg-black text-white text-xs font-bold flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => setFaqToDelete(faq)}
                          className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-[#718096] mb-1">Question</label>
                        <input
                          type="text"
                          value={editingQuestion}
                          onChange={(e) => setEditingQuestion(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#718096] mb-1">Answer</label>
                        <textarea
                          value={editingAnswer}
                          onChange={(e) => setEditingAnswer(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-[#111827]">{faq.question}</p>
                      <p className="text-[#718096] text-sm">{faq.answer}</p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!faqToDelete}
        title="Delete FAQ?"
        message={`Are you sure you want to delete this FAQ?`}
        confirmLabel="Delete FAQ"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setFaqToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};