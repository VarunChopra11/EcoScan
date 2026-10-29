import {
  ScanResponse,
  Offer,
  OfferRedemptionResponse,
  UserHistoryResponse,
  ProductionDashboardResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function createAuthHeaders(auth?: { token?: string; testUserId?: string }): HeadersInit {
  const headers: Record<string, string> = {};
  if (auth?.token) {
    headers['Authorization'] = `Bearer ${auth.token}`;
  } else if (auth?.testUserId) {
    headers['X-Test-User-Id'] = auth.testUserId;
  }
  return headers;
}

/* ============================================================
   1. Test Build Endpoints (Preserved In-Memory Assignment Mode)
   ============================================================ */

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
  version: string;
  azure_openai_configured: boolean;
  vision_mode: string;
  clerk_configured?: boolean;
  database_mode?: string;
}> {
  const response = await fetch(`${API_BASE}/api/v1/health`);
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  return response.json();
}

/* ============================================================
   2. Production Build Endpoints (Clerk Auth + MongoDB Persistence)
   ============================================================ */

export async function getProductionDashboard(auth?: {
  token?: string;
  testUserId?: string;
}): Promise<ProductionDashboardResponse> {
  const headers = createAuthHeaders(auth);
  const response = await fetch(`${API_BASE}/api/v1/prod/dashboard`, {
    headers,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch production dashboard (${response.status})`);
  }

  return response.json();
}

export async function productionScanImage(params: {
  file?: File;
  base64Data?: string;
  sampleHint?: string;
  token?: string;
  testUserId?: string;
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

  const headers = createAuthHeaders({ token: params.token, testUserId: params.testUserId });

  const response = await fetch(`${API_BASE}/api/v1/prod/scan`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Production scan failed (${response.status})`);
  }

  return response.json();
}

export async function getProductionOffers(auth?: {
  token?: string;
  testUserId?: string;
}): Promise<Offer[]> {
  const headers = createAuthHeaders(auth);
  const response = await fetch(`${API_BASE}/api/v1/prod/offers`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch production offers');
  }

  return response.json();
}

export async function redeemProductionOffer(
  offerId: string,
  auth?: { token?: string; testUserId?: string }
): Promise<OfferRedemptionResponse> {
  const headers = createAuthHeaders(auth);
  const response = await fetch(`${API_BASE}/api/v1/prod/offers/${encodeURIComponent(offerId)}/redeem`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Redemption failed');
  }

  return response.json();
}

export async function getProductionHistory(auth?: {
  token?: string;
  testUserId?: string;
}): Promise<UserHistoryResponse> {
  const headers = createAuthHeaders(auth);
  const response = await fetch(`${API_BASE}/api/v1/prod/history`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch production history');
  }

  return response.json();
}
