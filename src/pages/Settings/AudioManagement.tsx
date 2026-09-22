import React, { useEffect, useState, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  getAudioTracksApi,
  createAudioTrackApi,
  updateAudioTrackApi,
  deleteAudioTrackApi,
  toggleAudioTrackStatusApi,
  reorderAudioTracksApi,
} from '../../api/audio';
import { AudioTrack } from '../../types';
import {
  Plus,
  Trash2,
  Save,
  X,
  Edit,
  Loader2,
  Upload,
  Music,
  Play,
  Pause,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const getFullAudioUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const baseWithoutApi = API_BASE_URL.replace(/\/api$/, '');
  if (path.startsWith('/uploads')) return `${baseWithoutApi}${path}`;
  return `${baseWithoutApi}${path}`;
};

export const AudioManagement: React.FC = () => {
  const { showToast } = useToast();
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audio file upload state (add form)
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview player state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Delete state
  const [trackToDelete, setTrackToDelete] = useState<AudioTrack | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    titleEn: string;
    titleAm: string;
    titleAr: string;
  }>({ titleEn: '', titleAm: '', titleAr: '' });

  // Add form state
  const [newTrack, setNewTrack] = useState({
    titleEn: '',
    titleAm: '',
    titleAr: '',
    isActive: true,
  });

  useEffect(() => {
    loadTracks();
    return () => {
      // Clean up any playing audio when component unmounts
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const loadTracks = async () => {
    setLoading(true);
    try {
      const data = await getAudioTracksApi();
      setTracks(data);
    } catch {
      showToast('error', 'Failed to load audio tracks');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      showToast('error', 'Please select an MP3 or audio file');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      showToast('error', 'Audio file must be less than 50MB');
      return;
    }
    setAudioFile(file);
  };

  const handleAdd = async () => {
    if (!newTrack.titleEn.trim()) {
      showToast('error', 'English title is required');
      return;
    }
    if (!audioFile) {
      showToast('error', 'Please select an audio file');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('titleEn', newTrack.titleEn.trim());
      formData.append('titleAm', newTrack.titleAm.trim());
      formData.append('titleAr', newTrack.titleAr.trim());
      formData.append('sortOrder', String(tracks.length));
      formData.append('isActive', 'true');
      formData.append('audio', audioFile);

      const created = await createAudioTrackApi(formData);
      setTracks((prev) => [...prev, created]);
      setNewTrack({ titleEn: '', titleAm: '', titleAr: '', isActive: true });
      setAudioFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowAddForm(false);
      showToast('success', 'Audio track added successfully!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to add audio track');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (track: AudioTrack) => {
    setEditingId(track.id);
    setEditValues({
      titleEn: track.titleEn || '',
      titleAm: track.titleAm || '',
      titleAr: track.titleAr || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      const formData = new FormData();
      formData.append('titleEn', editValues.titleEn.trim());
      formData.append('titleAm', editValues.titleAm.trim());
      formData.append('titleAr', editValues.titleAr.trim());

      const updated = await updateAudioTrackApi(editingId, formData);
      setTracks((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
      showToast('success', 'Audio track updated');
      setEditingId(null);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update audio track');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!trackToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAudioTrackApi(trackToDelete.id);
      setTracks((prev) => prev.filter((t) => t.id !== trackToDelete.id));
      showToast('success', 'Audio track deleted');
      setTrackToDelete(null);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete audio track');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (track: AudioTrack) => {
    try {
      const updated = await toggleAudioTrackStatusApi(track.id, !track.isActive);
      setTracks((prev) => prev.map((t) => (t.id === track.id ? updated : t)));
      showToast('success', `Track ${updated.isActive ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update status');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= tracks.length) return;

    const reordered = [...tracks];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    setTracks(reordered);

    try {
      await reorderAudioTracksApi(reordered.map((t) => t.id));
      showToast('success', 'Order updated');
    } catch {
      showToast('error', 'Failed to save new order');
      loadTracks();
    }
  };

  const handlePlayPause = (track: AudioTrack) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(getFullAudioUrl(track.audioUrl));
    audio.addEventListener('ended', () => setPlayingId(null));
    audio.play().catch(() => {
      showToast('error', 'Failed to play audio');
      setPlayingId(null);
    });
    audioRef.current = audio;
    setPlayingId(track.id);
  };

  if (loading) {
    return <LoadingSpinner text="Loading Audio Tracks..." />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">Audio / Nasheed</h2>
          <p className="text-sm text-[#718096]">
            Manage Quran recitations and nasheeds played on the website
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-xs rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Track
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-[#F9FAFB] border border-[#E2E8F0] rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Title (English) *"
              value={newTrack.titleEn}
              onChange={(e) => setNewTrack({ ...newTrack, titleEn: e.target.value })}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
            />
            <input
              type="text"
              placeholder="Title (Amharic) — optional"
              value={newTrack.titleAm}
              onChange={(e) => setNewTrack({ ...newTrack, titleAm: e.target.value })}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
            />
            <input
              type="text"
              placeholder="Title (Arabic) — optional"
              value={newTrack.titleAr}
              onChange={(e) => setNewTrack({ ...newTrack, titleAr: e.target.value })}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
            />
          </div>

          {/* Audio file picker */}
          <div>
            <label className="block text-xs font-bold text-[#718096] mb-1">
              Audio File * (MP3, max 50MB)
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                audioFile
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-[#E2E8F0] hover:border-[#C8102E]'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {audioFile ? (
                <div className="flex items-center justify-center gap-3 text-sm">
                  <Music className="w-6 h-6 text-emerald-600" />
                  <span className="text-[#111827] font-semibold">{audioFile.name}</span>
                  <span className="text-[#718096]">
                    ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Upload className="w-8 h-8 text-[#718096]" />
                  <span className="text-sm text-[#718096]">Click to select MP3 / audio file</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Track
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewTrack({ titleEn: '', titleAm: '', titleAr: '', isActive: true });
                setAudioFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Track list */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
        {tracks.length === 0 ? (
          <div className="px-4 py-12 text-center text-[#718096]">
            <Music className="w-12 h-12 mx-auto text-[#E2E8F0] mb-3" />
            <p className="font-semibold">No audio tracks yet</p>
            <p className="text-sm">Click "Add Track" to upload your first nasheed or recitation</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {tracks.map((track, index) => {
              const isEditing = editingId === track.id;
              const isPlaying = playingId === track.id;

              return (
                <div
                  key={track.id}
                  className="p-4 hover:bg-[#F9FAFB] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Play button */}
                    <button
                      onClick={() => handlePlayPause(track)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        isPlaying
                          ? 'bg-[#C8102E] text-white'
                          : 'bg-[#F1EBE0] text-[#C8102E] hover:bg-[#E8DCC8]'
                      }`}
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5 fill-current" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editValues.titleEn}
                            onChange={(e) =>
                              setEditValues({ ...editValues, titleEn: e.target.value })
                            }
                            placeholder="Title (English)"
                            className="w-full px-2 py-1 rounded border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E]"
                          />
                          <input
                            type="text"
                            value={editValues.titleAm}
                            onChange={(e) =>
                              setEditValues({ ...editValues, titleAm: e.target.value })
                            }
                            placeholder="Title (Amharic)"
                            className="w-full px-2 py-1 rounded border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E]"
                          />
                          <input
                            type="text"
                            value={editValues.titleAr}
                            onChange={(e) =>
                              setEditValues({ ...editValues, titleAr: e.target.value })
                            }
                            placeholder="Title (Arabic)"
                            className="w-full px-2 py-1 rounded border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E]"
                          />
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1 bg-[#C8102E] hover:bg-[#A00D24] text-white text-xs font-bold rounded flex items-center gap-1"
                            >
                              <Save className="w-3.5 h-3.5" /> Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-[#111827]">{track.titleEn}</h3>
                              {(track.titleAm || track.titleAr) && (
                                <p className="text-xs text-[#718096] mt-0.5">
                                  {track.titleAm && <span>{track.titleAm}</span>}
                                  {track.titleAm && track.titleAr && <span> • </span>}
                                  {track.titleAr && (
                                    <span dir="rtl" className="inline-block">
                                      {track.titleAr}
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ml-2 ${
                                track.isActive
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {track.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 mt-2">
                            <button
                              onClick={() => handleStartEdit(track)}
                              className="p-1.5 rounded hover:bg-[#E2E8F0] text-[#718096]"
                              title="Edit titles"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(track)}
                              className="p-1.5 rounded hover:bg-[#E2E8F0] text-[#718096]"
                              title={track.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {track.isActive ? (
                                <X className="w-3.5 h-3.5" />
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => setTrackToDelete(track)}
                              className="p-1.5 rounded hover:bg-rose-50 text-[#C8102E]"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <span className="w-px h-4 bg-[#E2E8F0] mx-1" />

                            <button
                              onClick={() => handleMove(index, 'up')}
                              disabled={index === 0}
                              className="p-1.5 rounded hover:bg-[#E2E8F0] text-[#718096] disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMove(index, 'down')}
                              disabled={index === tracks.length - 1}
                              className="p-1.5 rounded hover:bg-[#E2E8F0] text-[#718096] disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] text-[#718096] ml-1">
                              #{index + 1}
                            </span>
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
          <li>Tracks appear in the order shown above on the website player</li>
          <li>Only "Active" tracks are played on the public website</li>
          <li>Use MP3 files for best browser compatibility (max 50MB each)</li>
          <li>Set the English title as the main display name — Amharic and Arabic are optional</li>
        </ul>
      </div>

      <ConfirmModal
        isOpen={!!trackToDelete}
        title="Delete Audio Track?"
        message={`Are you sure you want to delete "${trackToDelete?.titleEn}"? The MP3 file will remain on the server but this entry will be removed.`}
        confirmLabel="Delete Track"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTrackToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};