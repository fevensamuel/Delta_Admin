// src/api/faqs.ts
import { apiClient } from './client';
import { FAQItem } from '../types';

// Get all FAQs (Admin)
export async function getFaqsApi(): Promise<FAQItem[]> {
  try {
    const res = await apiClient.get('/admin/faqs');
    return res.data?.data || [];
  } catch (error) {
    console.error('❌ Error fetching FAQs:', error);
    return [];
  }
}

// Create a new FAQ
export async function createFaqApi(question: string, answer: string): Promise<FAQItem> {
  try {
    const res = await apiClient.post('/admin/faqs', { question, answer });
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error('❌ Error creating FAQ:', error);
    throw new Error(error?.response?.data?.error || 'Failed to create FAQ');
  }
}

// Update an existing FAQ
export async function updateFaqApi(id: string, question: string, answer: string): Promise<FAQItem> {
  try {
    const res = await apiClient.put(`/admin/faqs/${id}`, { question, answer });
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error('❌ Error updating FAQ:', error);
    throw new Error(error?.response?.data?.error || 'Failed to update FAQ');
  }
}

// Delete a FAQ
export async function deleteFaqApi(id: string): Promise<void> {
  try {
    await apiClient.delete(`/admin/faqs/${id}`);
  } catch (error: any) {
    console.error('❌ Error deleting FAQ:', error);
    throw new Error(error?.response?.data?.error || 'Failed to delete FAQ');
  }
}

// Get all FAQs (Public)
export async function getPublicFaqsApi(): Promise<FAQItem[]> {
  try {
    const res = await apiClient.get('/faqs');
    return res.data?.data || [];
  } catch (error) {
    console.error('❌ Error fetching public FAQs:', error);
    return [];
  }
}