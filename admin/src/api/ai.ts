import request from '../utils/request';

export function analyzeImages(imageUrls: string[]) {
  return request.post('/api/admin/ai/analyze-images', { imageUrls });
}

export function generateDescription(data: {
  name: string;
  address?: string;
  maxGuests: number;
  bedrooms: number;
  area?: number;
  facilities?: string[];
}) {
  return request.post('/api/admin/ai/generate-description', data);
}

export function processVilla(data: {
  name: string;
  address?: string;
  maxGuests: number;
  bedrooms: number;
  area?: number;
  facilities?: string[];
  imageUrls: string[];
}) {
  return request.post('/api/admin/ai/process-villa', data);
}
