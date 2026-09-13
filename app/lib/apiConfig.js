'use client';

<<<<<<< HEAD
import { useState, useEffect, useCallback } from 'react';

export const DEFAULT_API_BASE = 'https://students-problems-signing-pencil.trycloudflare.com';
export const STORAGE_KEY = 'ibvap_api_base_url';
export const EVENT_KEY = 'ibvap_api_config_changed';

/**
 * Normalizes URL by removing trailing slashes
 */
export function normalizeUrl(url) {
  if (!url) return DEFAULT_API_BASE;
  const trimmed = url.trim();
  return trimmed.replace(/\/+$/, '');
}

/**
 * Returns current API base URL from localStorage, env, or default
 */
export function getApiBaseUrl() {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_IBVAP_API_BASE_URL || DEFAULT_API_BASE;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) {
      return normalizeUrl(saved);
    }
  } catch {
    // localStorage might be unavailable
  }
  return process.env.NEXT_PUBLIC_IBVAP_API_BASE_URL || DEFAULT_API_BASE;
}

/**
 * Saves a new API base URL to localStorage and dispatches a change event
 */
export function setApiBaseUrl(url) {
  const normalized = normalizeUrl(url);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, normalized);
      window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: { baseUrl: normalized } }));
    } catch (e) {
      console.error('Failed to save API base URL to localStorage:', e);
    }
  }
  return normalized;
}

/**
 * Resets the API base URL to default
 */
export function resetApiBaseUrl() {
  return setApiBaseUrl(DEFAULT_API_BASE);
}

/**
 * React hook to listen for API base URL changes
 */
export function useApiConfig() {
  const [baseUrl, setBaseUrl] = useState(() => getApiBaseUrl());

  useEffect(() => {
    // Ensure initial client-side value is fresh
    setBaseUrl(getApiBaseUrl());

    const handleConfigChange = (e) => {
      if (e?.detail?.baseUrl) {
        setBaseUrl(e.detail.baseUrl);
      } else {
        setBaseUrl(getApiBaseUrl());
      }
    };

    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        setBaseUrl(getApiBaseUrl());
      }
    };

    window.addEventListener(EVENT_KEY, handleConfigChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(EVENT_KEY, handleConfigChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateUrl = useCallback((newUrl) => {
    const saved = setApiBaseUrl(newUrl);
    setBaseUrl(saved);
    return saved;
  }, []);

  const resetUrl = useCallback(() => {
    const saved = resetApiBaseUrl();
    setBaseUrl(saved);
    return saved;
  }, []);

  return {
    baseUrl,
    setBaseUrl: updateUrl,
    resetBaseUrl: resetUrl,
    swaggerUrl: `${baseUrl}/docs`,
    fullPipelineEndpoint: `${baseUrl}/api/v1/analytics/full`,
    anprEndpoint: `${baseUrl}/api/v1/analytics/anpr`,
  };
}

/**
 * Checks connectivity to the given API base URL
 */
export async function checkApiHealth(url) {
  const target = normalizeUrl(url);
  const startTime = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${target}/docs`, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const duration = Math.round(performance.now() - startTime);
    return {
      ok: true,
      latency: duration,
      status: res.status || 200,
      message: `Gateway is reachable (${duration}ms latency)`,
    };
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    return {
      ok: false,
      latency: duration,
      message: err.name === 'AbortError' 
        ? 'Connection timed out (>8s). Check gateway address or firewall.' 
        : `Connection failed: ${err.message}`,
=======
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
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
    };
  }
}

<<<<<<< HEAD
/**
 * Safely decodes base64 alert headers (X-IBVAP-Alerts-JSON)
 */
=======
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
export function decodeAlertsHeader(value) {
  if (!value) return [];
  try {
    const decoded = typeof window !== 'undefined' ? window.atob(value) : Buffer.from(value, 'base64').toString('utf-8');
    return JSON.parse(decoded);
<<<<<<< HEAD
  } catch (err) {
    console.warn('Failed to parse X-IBVAP-Alerts-JSON header:', err);
=======
  } catch {
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
    return [];
  }
}
