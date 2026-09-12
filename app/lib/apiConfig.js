'use client';

import { useEffect, useState } from 'react';
import { CONFIG_EVENT, loadSurveillanceConfig, saveSurveillanceConfig } from './surveillanceConfig';

// Compatibility exports required by the historical Settings screen.
export const DEFAULT_API_BASE = '';

function envServiceUrl() {
  return (
    process.env.NEXT_PUBLIC_AI_SERVICE_URL ||
    ''
  );
}

export function normalizeUrl(url) {
  if (!url) return '';
  return url.trim().replace(/\/+$/, '');
}

export function validateServiceUrl(value) {
  const candidate = normalizeUrl(value);
  try {
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) {
      return { valid: false, value: candidate, message: 'Enter a valid HTTPS service URL.' };
    }
    return { valid: true, value: candidate, message: '' };
  } catch {
    return { valid: false, value: candidate, message: 'Enter a valid HTTPS service URL.' };
  }
}

export function getApiBaseUrl() {
  const stored = typeof window !== 'undefined' ? loadSurveillanceConfig().aiServiceUrl : '';
  return normalizeUrl(stored || envServiceUrl());
}

export function useApiConfig() {
  // Keep the server render and first browser render identical. The persisted
  // browser URL is loaded after mount to avoid hydration mismatches.
  const [baseUrl, setBaseUrlState] = useState('');
  useEffect(() => {
    const refresh = () => setBaseUrlState(getApiBaseUrl());
    refresh();
    window.addEventListener(CONFIG_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(CONFIG_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  const setBaseUrl = (url) => {
    const normalized = normalizeUrl(url);
    saveSurveillanceConfig({ ...loadSurveillanceConfig(), aiServiceUrl: normalized });
    setBaseUrlState(normalized);
    return normalized;
  };
  const resetBaseUrl = () => setBaseUrl(DEFAULT_API_BASE);
  return {
    baseUrl,
    configured: Boolean(baseUrl),
    fullPipelineEndpoint: baseUrl ? `${baseUrl}/api/v1/analytics/full` : '',
    setBaseUrl,
    resetBaseUrl,
    swaggerUrl: baseUrl ? `${baseUrl}/docs` : '',
    anprEndpoint: baseUrl ? `${baseUrl}/api/v1/analytics/anpr` : ''
  };
}

export async function checkApiHealth(url) {
  const target = normalizeUrl(url);
  if (!target) {
    return { ok: false, state: 'not-configured', latency: 0, message: 'Not configured' };
  }
  const startTime = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${target}/health`, { method: 'GET', signal: controller.signal, headers: { Accept: 'application/json' } });
    clearTimeout(timeoutId);
    const latency = Math.round(performance.now() - startTime);
    if (!response.ok) {
      if (response.status === 404) return { ok: false, state: 'endpoint-not-found', latency, message: 'AI service reached, but /health was not found.' };
      if (response.status >= 500) return { ok: false, state: 'server-error', latency, message: 'AI service returned an internal error.' };
      return { ok: false, state: 'error', latency, message: `AI service returned HTTP ${response.status}.` };
    }
    let payload;
    try {
      payload = await response.json();
    } catch {
      return { ok: false, state: 'error', latency, message: 'AI service returned an unexpected response.' };
    }
    if (payload?.service !== 'sentryx-ai' || payload?.status !== 'ok' || payload?.model_loaded !== true) {
      return { ok: false, state: 'not-ready', latency, message: 'AI service responded, but the SentryX model is not ready.' };
    }
    return {
      ok: true,
      state: 'connected',
      latency,
      status: response.status,
      message: 'Connected to SentryX AI.',
      service: payload.service,
      device: payload.device
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      state: 'offline',
      latency: Math.round(performance.now() - startTime),
      message: err.name === 'AbortError'
        ? 'AI service request timed out.'
        : 'Browser could not access the AI service. Check CORS or network access.'
    };
  }
}

export function decodeAlertsHeader(value) {
  if (!value) return [];
  try {
    const decoded = typeof window !== 'undefined' ? window.atob(value) : Buffer.from(value, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return [];
  }
}
