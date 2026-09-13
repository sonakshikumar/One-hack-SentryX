export const CONFIG_STORAGE_KEY = 'sentryx_surveillance_config';
export const CONFIG_EVENT = 'sentryx_presets_changed';

export const DEFAULT_SURVEILLANCE_CONFIG = {
  aiServiceUrl: '',
  inputSource: 'upload',
  videoMode: 'thermal',
  maxDuration: 15,
  zoneSensitivity: 'standard',
  confThreshold: 0.5,
  detectionClass: 'person',
  dwellThreshold: 8,
  speedThreshold: 0.8,
  approachThreshold: 12,
  riskThreshold: 70,
  alertSeverity: 'medium',
  detectionModel: 'thermal-person-v1',
  trackingModel: 'bytetrack',
  behaviorModel: 'behavior-v0.1',
  modelVersion: '0.1.0'
};

export function loadSurveillanceConfig() {
  if (typeof window === 'undefined') return { ...DEFAULT_SURVEILLANCE_CONFIG };
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) return { ...DEFAULT_SURVEILLANCE_CONFIG, ...JSON.parse(raw) };
    const maxDuration = localStorage.getItem('sentryx_default_duration');
    const videoMode = localStorage.getItem('sentryx_video_mode');
    return {
      ...DEFAULT_SURVEILLANCE_CONFIG,
      ...(maxDuration ? { maxDuration: Number(maxDuration) } : {}),
      ...(videoMode ? { videoMode } : {})
    };
  } catch {
    return { ...DEFAULT_SURVEILLANCE_CONFIG };
  }
}

export function saveSurveillanceConfig(config) {
  const next = { ...DEFAULT_SURVEILLANCE_CONFIG, ...config };
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(CONFIG_EVENT, { detail: next }));
  }
  return next;
}
