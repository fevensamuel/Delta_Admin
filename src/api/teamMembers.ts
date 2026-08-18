// src/api/teamMembers.ts
import { apiClient } from './client';
import { TeamMember } from '../types';

export async function getTeamMembersApi(): Promise<TeamMember[]> {
  try {
    const res = await apiClient.get('/admin/team-members');
    return res.data?.data || [];
  } catch (error) {
    console.error('❌ Error fetching team members:', error);
    return [];
  }
}

export async function createTeamMemberApi(formData: FormData): Promise<TeamMember> {
  try {
    const res = await apiClient.post('/admin/team-members', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error('❌ Error creating team member:', error);
    throw new Error(error?.response?.data?.error || 'Failed to create team member');
  }
}

export async function updateTeamMemberApi(id: string, formData: FormData): Promise<TeamMember> {
  try {
    const res = await apiClient.put(`/admin/team-members/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error('❌ Error updating team member:', error);
    throw new Error(error?.response?.data?.error || 'Failed to update team member');
  }
}

export async function deleteTeamMemberApi(id: string): Promise<void> {
  try {
    await apiClient.delete(`/admin/team-members/${id}`);
  } catch (error: any) {
    console.error('❌ Error deleting team member:', error);
    throw new Error(error?.response?.data?.error || 'Failed to delete team member');
  }
}