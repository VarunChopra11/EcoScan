import {
  ScanResponse,
  Offer,
  OfferRedemptionResponse,
  UserHistoryResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function scanImage(params: {
  file?: File;
  base64Data?: string;
  sampleHint?: string;
}): Promise<ScanResponse> {
  const formData = new FormData();

  if (params.file) {
    formData.append('file', params.file);
  }
  if (params.base64Data) {
    formData.append('image_base64', params.base64Data);
  }
  if (params.sampleHint) {
    formData.append('sample_hint', params.sampleHint);
  }

  const response = await fetch(`${API_BASE}/api/v1/scan`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Scan failed with status ${response.status}`);
  }

  return response.json();
}

export async function getOffers(): Promise<Offer[]> {
  const response = await fetch(`${API_BASE}/api/v1/offers`);
  if (!response.ok) {
    throw new Error('Failed to fetch offers');
  }
  return response.json();
}

export async function redeemOffer(offerId: string): Promise<OfferRedemptionResponse> {
  const response = await fetch(`${API_BASE}/api/v1/offers/${encodeURIComponent(offerId)}/redeem`, {
    method: 'POST',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Redemption failed');
  }

  return response.json();
}

export async function getHistory(): Promise<UserHistoryResponse> {
  const response = await fetch(`${API_BASE}/api/v1/history`);
  if (!response.ok) {
    throw new Error('Failed to fetch user history');
  }
  return response.json();
}

export async function resetHistory(): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/history`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to reset history');
  }
}

export async function checkHealth(): Promise<{
  status: string;
  azure_openai_configured: boolean;
  vision_mode: string;
}> {
  const response = await fetch(`${API_BASE}/api/v1/health`);
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  return response.json();
}
