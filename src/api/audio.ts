// src/api/audio.ts
import { apiClient, ensureArray } from './client';
import { AudioTrack } from '../types';

/**
 * GET /admin/audio — fetch all tracks (including inactive)
 */
export async function getAudioTracksApi(): Promise<AudioTrack[]> {
  try {
    const res = await apiClient.get('/admin/audio');
    return ensureArray<AudioTrack>(res.data);
  } catch (error) {
    console.error('❌ Error fetching audio tracks:', error);
    throw error;
  }
}

/**
 * POST /admin/audio — create a new track
 * Accepts FormData with: titleEn, titleAm, titleAr, duration, sortOrder, isActive, audio (file)
 */
export async function createAudioTrackApi(formData: FormData): Promise<AudioTrack> {
  try {
    const res = await apiClient.post('/admin/audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // audio uploads can be large
    });
    return res.data?.data || res.data;
  } catch (error) {
    console.error('❌ Error creating audio track:', error);
    throw error;
  }
}

/**
 * PUT /admin/audio/:id — update an existing track
 */
export async function updateAudioTrackApi(
  id: string,
  formData: FormData
): Promise<AudioTrack> {
  try {
    const res = await apiClient.put(`/admin/audio/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return res.data?.data || res.data;
  } catch (error) {
    console.error('❌ Error updating audio track:', error);
    throw error;
  }
}

/**
 * DELETE /admin/audio/:id
 */
export async function deleteAudioTrackApi(id: string): Promise<void> {
  try {
    await apiClient.delete(`/admin/audio/${id}`);
  } catch (error) {
    console.error('❌ Error deleting audio track:', error);
    throw error;
  }
}

/**
 * PATCH /admin/audio/:id/status — toggle isActive
 */
export async function toggleAudioTrackStatusApi(
  id: string,
  isActive: boolean
): Promise<AudioTrack> {
  try {
    const res = await apiClient.patch(`/admin/audio/${id}/status`, { isActive });
    return res.data?.data || res.data;
  } catch (error) {
    console.error('❌ Error toggling audio track status:', error);
    throw error;
  }
}

/**
 * PATCH /admin/audio/reorder — send the ordered list of track IDs
 */
export async function reorderAudioTracksApi(ids: string[]): Promise<void> {
  try {
    await apiClient.patch('/admin/audio/reorder', { ids });
  } catch (error) {
    console.error('❌ Error reordering audio tracks:', error);
    throw error;
  }
}