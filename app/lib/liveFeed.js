'use client';

import { useEffect, useState, useCallback } from 'react';

/**
<<<<<<< HEAD
 * Bridges a real IBVAP edge-analytics run (Workbench.jsx) to any other part of
 * the app (e.g. the homepage Dashboard) so the UI reflects an ACTUAL YOLO11n +
 * ByteTrack inference result instead of fabricated placeholder data whenever
 * one is available. Falls back gracefully when nothing has been run yet.
=======
 * Bridges a workbench inference run to the homepage HUD so real annotated
 * video and perimeter events replace the labeled demo overlay when available.
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
 */

export const STORAGE_KEY = 'sentryx_last_analysis';
export const EVENT_KEY = 'sentryx_last_analysis_changed';

export function saveLastAnalysis(data) {
  if (typeof window === 'undefined') return;
  try {
    const payload = { ...data, savedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: payload }));
  } catch (e) {
    console.warn('Could not persist last analysis result:', e);
  }
}

export function getLastAnalysis() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearLastAnalysis() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: null }));
  } catch {
    // ignore
  }
}

/**
 * Live-updating hook. Returns the most recent real analytics result, or null
 * if the operator hasn't run a live pipeline yet (Dashboard should fall back
 * to its simulated preview in that case — never invent fake "real" numbers).
 * Note: the annotated video is a blob URL that only survives for the current
 * browser tab session (it's revoked on full page reload), so we treat that
 * field as best-effort and let consumers handle a broken/missing video src.
 */
export function useLastAnalysis() {
  const [analysis, setAnalysis] = useState(() => getLastAnalysis());

  const refresh = useCallback(() => setAnalysis(getLastAnalysis()), []);

  useEffect(() => {
    refresh();
    const onChange = (e) => setAnalysis(e?.detail ?? getLastAnalysis());
    const onStorage = (e) => { if (e.key === STORAGE_KEY) refresh(); };
    window.addEventListener(EVENT_KEY, onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENT_KEY, onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  return analysis;
}
