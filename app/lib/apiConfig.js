'use client';

import { useMemo } from 'react';

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

export function getApiBaseUrl() {
  return normalizeUrl(envServiceUrl());
}

export function useApiConfig() {
  return useMemo(() => {
    const baseUrl = getApiBaseUrl();
    return {
      baseUrl,
      configured: Boolean(baseUrl),
      fullPipelineEndpoint: baseUrl ? `${baseUrl}/api/v1/analytics/full` : ''
    };
  }, []);
}

export async function checkApiHealth(url) {
  const target = normalizeUrl(url);
  if (!target) {
    return { ok: false, latency: 0, message: 'Not connected' };
  }
  const startTime = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    await fetch(target, { method: 'GET', mode: 'no-cors', signal: controller.signal });
    clearTimeout(timeoutId);
    return {
      ok: true,
      latency: Math.round(performance.now() - startTime),
      message: 'Connected'
    };
  } catch (err) {
    return {
      ok: false,
      latency: Math.round(performance.now() - startTime),
      message: err.name === 'AbortError' ? 'Timed out' : 'Offline'
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
