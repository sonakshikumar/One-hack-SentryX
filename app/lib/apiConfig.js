'use client';

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
    };
  }
}

/**
 * Safely decodes base64 alert headers (X-IBVAP-Alerts-JSON)
 */
export function decodeAlertsHeader(value) {
  if (!value) return [];
  try {
    const decoded = typeof window !== 'undefined' ? window.atob(value) : Buffer.from(value, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (err) {
    console.warn('Failed to parse X-IBVAP-Alerts-JSON header:', err);
    return [];
  }
}
