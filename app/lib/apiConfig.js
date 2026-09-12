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
  const [baseUrl, setBaseUrlState] = useState(() => getApiBaseUrl());
  useEffect(() => {
    const refresh = () => setBaseUrl(getApiBaseUrl());
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
    // The existing Python service exposes its OpenAPI docs route, not /health.
    const response = await fetch(`${target}/docs`, { method: 'GET', signal: controller.signal });
    clearTimeout(timeoutId);
    const latency = Math.round(performance.now() - startTime);
    if (!response.ok) {
      if (response.status === 404) return { ok: false, state: 'endpoint-not-found', latency, message: 'AI service reached, but the configured test endpoint was not found.' };
      if (response.status >= 500) return { ok: false, state: 'server-error', latency, message: 'AI service returned an internal error.' };
      return { ok: false, state: 'error', latency, message: `AI service returned HTTP ${response.status}.` };
    }
    return {
      ok: true,
      state: 'connected',
      latency,
      status: response.status,
      message: 'Connected to the AI service.'
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      state: 'offline',
      latency: Math.round(performance.now() - startTime),
      message: err.name === 'AbortError' ? 'AI service unreachable: connection timed out.' : 'AI service unreachable.'
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
