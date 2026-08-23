/**
 * RadiNova AI — Dynamic Backend API Configuration & Health Monitoring
 * Automatically connects to local FastAPI server (http://localhost:8000) or custom Cloud API endpoint.
 */

const STORAGE_KEY = 'radinova_backend_api_url';

export function getApiBaseUrl(): string {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null && saved !== undefined) {
    return saved.trim().replace(/\/+$/, '');
  }
  // If running on localhost or 127.0.0.1, default to local FastAPI server
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
  }
  return '';
}

export function setApiBaseUrl(url: string): void {
  const clean = url.trim().replace(/\/+$/, '');
  localStorage.setItem(STORAGE_KEY, clean);
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!base) {
    return normalizedPath;
  }
  return `${base}${normalizedPath}`;
}

export async function checkBackendConnection(): Promise<{ connected: boolean; version?: string; device?: string; latencyMs?: number }> {
  const startTime = Date.now();
  const url = buildApiUrl('/health');
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3500)
    });
    if (!res.ok) {
      return { connected: false };
    }
    const data = await res.json();
    const latency = Date.now() - startTime;
    return {
      connected: data.status === 'healthy',
      version: data.version,
      device: data.device || 'CPU/GPU',
      latencyMs: latency
    };
  } catch (e) {
    return { connected: false };
  }
}
