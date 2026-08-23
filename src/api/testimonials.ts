// src/api/testimonials.ts
import { apiClient } from './client';
import { Testimonial } from '../types';

export async function getTestimonialsApi(): Promise<Testimonial[]> {
  try {
    const res = await apiClient.get('/admin/testimonials');
    console.log('📥 Admin testimonials response:', res.data);
    
    // Handle different response formats
    let data = res.data;
    if (data && data.data) {
      data = data.data;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    console.error('❌ Error fetching testimonials:', error);
    return [];
  }
}

export async function createTestimonialApi(data: Omit<Testimonial, 'id' | 'createdAt' | 'updatedAt'>): Promise<Testimonial> {
  try {
    // Remove avatar if it exists (for safety)
    const { avatar, ...cleanData } = data as any;
    const res = await apiClient.post('/admin/testimonials', cleanData);
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error('❌ Error creating testimonial:', error);
    throw new Error(error?.response?.data?.error || 'Failed to create testimonial');
  }
}

export async function updateTestimonialApi(id: string, data: Partial<Testimonial>): Promise<Testimonial> {
  try {
    // Remove avatar if it exists (for safety)
    const { avatar, ...cleanData } = data as any;
    const res = await apiClient.put(`/admin/testimonials/${id}`, cleanData);
    return res.data?.data || res.data;
  } catch (error: any) {
    console.error('❌ Error updating testimonial:', error);
    throw new Error(error?.response?.data?.error || 'Failed to update testimonial');
  }
}

export async function deleteTestimonialApi(id: string): Promise<void> {
  try {
    await apiClient.delete(`/admin/testimonials/${id}`);
  } catch (error: any) {
    console.error('❌ Error deleting testimonial:', error);
    throw new Error(error?.response?.data?.error || 'Failed to delete testimonial');
  }
}

export async function getPublicTestimonialsApi(): Promise<Testimonial[]> {
  try {
    console.log('📥 Fetching public testimonials from /testimonials');
    const response = await fetch('http://localhost:3000/api/testimonials');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('📥 Public testimonials response:', result);
    
    // The API returns { status, success, count, data: [...] }
    if (result && result.data && Array.isArray(result.data)) {
      console.log(`✅ Found ${result.data.length} public testimonials`);
      return result.data;
    }
    
    console.log('⚠️ No testimonials found in response, returning empty array');
    return [];
  } catch (error) {
    console.error('❌ Error fetching public testimonials:', error);
    return [];
  }
}