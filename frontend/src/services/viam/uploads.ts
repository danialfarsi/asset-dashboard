/**
 * 📁 VIAM Uploads API
 */
import api from '@/lib/api';

const BASE = '/intangible/viam';

export interface VIAMUpload {
  id: number;
  file: string;
  file_url: string;
  original_name: string;
  file_type: 'pdf' | 'word' | 'image' | 'video' | 'audio' | 'other';
  file_type_display: string;
  mime_type: string;
  file_size: number;
  section: 'strategic_planning' | 'culture' | 'empowerment' | 'performance';
  section_display: string;
  title: string;
  description: string;
  tags: string[];
  organization: number;
  uploaded_by: number;
  uploaded_by_name: string;
  created_at: string;
  updated_at: string;
}

export const viamUploadsApi = {
  // لیست
  list: (params?: { section?: string; file_type?: string; search?: string }) =>
    api.get(`${BASE}/uploads/`, { params }),

  // جزئیات
  get: (id: number) =>
    api.get(`${BASE}/uploads/${id}/`),

  // آپلود
  upload: (data: FormData, onProgress?: (percent: number) => void) =>
    api.post(`${BASE}/uploads/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    }),

  // حذف
  delete: (id: number) =>
    api.delete(`${BASE}/uploads/${id}/`),

  // آمار
  stats: () =>
    api.get(`${BASE}/uploads/stats/`),
};
