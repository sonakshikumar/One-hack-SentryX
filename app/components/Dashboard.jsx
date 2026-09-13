'use client';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useLastAnalysis } from '../lib/liveFeed';

<<<<<<< HEAD
/* ---------------------------------------------------------------------------
 * SkySentinel Command Center — simulated live drone surveillance preview.
 * The feed itself is a static aerial frame (no live drone is connected yet),
 * but every readout — FPS, latency, tracking, risk scoring, telemetry — is
 * driven by a real client-side simulation loop so the UI behaves the way the
 * production HUD will once wired to a real RTSP/edge inference backend.
 * ------------------------------------------------------------------------- */

const BASE_IMAGE =
  'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f6?auto=format&fit=crop&w=1600&q=85';

const MODES = [
  { id: 'rgb', label: 'RGB', icon: '◐' },
  { id: 'thermal', label: 'Thermal / IR', icon: '◑' },
  { id: 'lowlight', label: 'Low-Light', icon: '☾' },
  { id: 'split', label: 'Split View', icon: '◧' },
];

const RESOLUTIONS = {
  rgb: '3840 × 2160 · 4K UHD',
  lowlight: '1920 × 1080 · Night-ISO',
  thermal: '640 × 512 · Radiometric',
  split: '1920 × 1080 · Dual-Sensor',
};

// Patrol paths are in percentage coordinates over the stage.
const TRACK_DEFS = [
  { id: '042', type: 'PERSON', category: 'CRAWLING', baseRisk: 78, baseConf: 94, speedTier: 'slow',
    path: [{ x: 9, y: 83 }, { x: 21, y: 79 }, { x: 33, y: 75 }, { x: 45, y: 71 }], speed: 0.00022 },
  { id: '017', type: 'VEHICLE', category: 'MOVING', baseRisk: 44, baseConf: 97, speedTier: 'fast',
    path: [{ x: 4, y: 41 }, { x: 34, y: 37 }, { x: 64, y: 34 }, { x: 93, y: 30 }], speed: 0.00085 },
  { id: '029', type: 'PERSON', category: 'LOITERING', baseRisk: 57, baseConf: 90, speedTier: 'idle',
    path: [{ x: 71, y: 61 }, { x: 76, y: 55 }, { x: 70, y: 50 }, { x: 64, y: 56 }], speed: 0.00033 },
=======
/* Sample HUD for the operator view. Values are labeled demo/sample unless
 * useLastAnalysis() returns a real inference blob from the workbench. */

const BASE_IMAGE =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=85';

const MODES = [
  { id: 'thermal', label: 'Thermal', icon: '◑' },
  { id: 'lowlight', label: 'Low-Light', icon: '☾' },
  { id: 'rgb', label: 'RGB', icon: '◐' },
  { id: 'split', label: 'Split View', icon: '◧' },
];

const TRACK_DEFS = [
  {
    id: '042',
    type: 'PERSON',
    status: 'IN RESTRICTED ZONE',
    movement: 'LOW SPEED',
    behavior: 'UNUSUAL DWELL',
    riskLabel: 'HIGH',
    confLabel: 'Sample',
    signals: ['restricted-zone presence', 'prolonged dwell', 'low movement velocity'],
    path: [{ x: 9, y: 83 }, { x: 21, y: 79 }, { x: 33, y: 75 }, { x: 45, y: 71 }],
    speed: 0.00022
  },
  {
    id: '029',
    type: 'PERSON',
    status: 'NEAR PERIMETER',
    movement: 'APPROACHING BOUNDARY',
    behavior: 'DIRECTION CHANGE',
    riskLabel: 'MEDIUM',
    confLabel: 'Sample',
    signals: ['boundary approach', 'direction toward restricted area'],
    path: [{ x: 71, y: 61 }, { x: 76, y: 55 }, { x: 70, y: 50 }, { x: 64, y: 56 }],
    speed: 0.00033
  },
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
];

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const pad2 = (n) => String(n).padStart(2, '0');

function pointOnPath(path, u) {
  const segs = path.length - 1;
  const scaled = clamp(u, 0, 1) * segs;
  const idx = Math.min(segs - 1, Math.floor(scaled));
  const t = scaled - idx;
  const a = path[idx], b = path[idx + 1];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
function pingPong(u2) {
  const m = u2 % 2;
  return m <= 1 ? m : 2 - m;
}
<<<<<<< HEAD
function riskTier(risk) {
  if (risk >= 75) return 'high';
  if (risk >= 50) return 'mid';
  return 'low';
}

function buildTrack(def, tick, idx, prev) {
  const u = pingPong(tick * def.speed);
  const pos = pointOnPath(def.path, u);
  const prevPos = prev?.pos || pos;
  const dx = pos.x - prevPos.x, dy = pos.y - prevPos.y;
  const distPct = Math.hypot(dx, dy);
  const metersPerPct = 1.85;
  const tickSeconds = 0.7;
  const rawSpeedMs = (distPct * metersPerPct) / tickSeconds;
  const speedMs = def.speedTier === 'idle' ? Math.min(rawSpeedMs, 0.3) : rawSpeedMs;

  const risk = Math.round(
    clamp(def.baseRisk + Math.sin((tick + idx * 11) / 6) * 9 + (Math.random() * 6 - 3), 2, 99)
  );
  const conf = Math.round(clamp(def.baseConf + (Math.random() * 4 - 2), 82, 99));
  const angle = distPct > 0.05 ? (Math.atan2(dy, dx) * 180) / Math.PI : prev?.angle ?? 0;

  const speedLabel =
    def.type === 'VEHICLE'
      ? `${(speedMs * 3.6).toFixed(0)} km/h`
      : `${speedMs.toFixed(1)} m/s`;

  return {
    id: def.id, type: def.type, category: def.category,
    pos, angle, risk, conf, speedLabel,
    tier: riskTier(risk),
  };
=======

function buildTrack(def, tick) {
  const u = pingPong(tick * def.speed);
  const pos = pointOnPath(def.path, u);
  return { ...def, pos, duration: pad2(Math.floor((tick * 0.7) % 60)) };
}

function explainAlert(a) {
  if (a.message) return a.message;
  const track = a.track_id || a.id || 'N/A';
  const type = (a.type || 'perimeter event').replace(/_/g, ' ');
  return `Track #${track} — ${type}. Review zone and movement context.`;
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
}

export function Dashboard() {
  const liveAnalysis = useLastAnalysis();
  const containerRef = useRef(null);
  const mediaRef = useRef(null);
<<<<<<< HEAD
  const trackStateRef = useRef([]);
  const alertedRef = useRef({});
  const [videoError, setVideoError] = useState(false);

  const [mode, setMode] = useState('rgb');
  const [playing, setPlaying] = useState(true);
  const [modelOnline, setModelOnline] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeCam, setActiveCam] = useState(1);
  const [connection, setConnection] = useState('connected');

  const [tick, setTick] = useState(0);
  const [runtimeSec, setRuntimeSec] = useState(0);
  const [fps, setFps] = useState(28);
  const [latency, setLatency] = useState(76);
  const [tracks, setTracks] = useState(() =>
    TRACK_DEFS.map((d, i) => buildTrack(d, 0, i, null))
  );
  const [alerts, setAlerts] = useState([]);
  const [clockStr, setClockStr] = useState('');

  const [altitude] = useState(118);
  const [battery, setBattery] = useState(87);
  const [heading, setHeading] = useState(214);

  // Main simulation tick — drives tracking, fps, latency, drift.
  // Skipped entirely once a real analysis result exists — we never want to
  // keep animating fabricated numbers over real detection data.
  useEffect(() => {
    if (liveAnalysis || !playing || !modelOnline) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      setFps(clamp(Math.round(28 + Math.sin(Date.now() / 900) * 2 + (Math.random() * 2 - 1)), 22, 30));
      setLatency(Math.round(clamp(76 + (Math.random() * 18 - 9), 54, 118)));
      setHeading((h) => (h + (Math.random() * 4 - 2) + 360) % 360);
    }, 700);
    return () => clearInterval(interval);
  }, [playing, modelOnline]);

  // Recompute track geometry whenever tick advances.
  useEffect(() => {
    const next = TRACK_DEFS.map((d, i) =>
      buildTrack(d, tick, i, trackStateRef.current[i])
    );
    trackStateRef.current = next;
    setTracks(next);

    next.forEach((t) => {
      const wasAlerted = alertedRef.current[t.id];
      if (t.tier === 'high' && !wasAlerted) {
        alertedRef.current[t.id] = true;
        setAlerts((prev) =>
          [
            {
              id: `${t.id}-${Date.now()}`,
              time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
              msg: `Track #${t.id} (${t.type}) crossed risk threshold — ${t.category.toLowerCase()} near Sector A, ${t.risk}% suspicion.`,
            },
            ...prev,
          ].slice(0, 6)
        );
      } else if (t.risk < 60 && wasAlerted) {
        alertedRef.current[t.id] = false;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  // Wall clock + elapsed runtime + slow battery drain, independent of sim speed.
=======
  const [videoError, setVideoError] = useState(false);

  const [mode, setMode] = useState('thermal');
  const [playing, setPlaying] = useState(true);
  const [modelOnline, setModelOnline] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const [tick, setTick] = useState(0);
  const [runtimeSec, setRuntimeSec] = useState(0);
  const [tracks, setTracks] = useState(() => TRACK_DEFS.map((d) => buildTrack(d, 0)));
  const [clockStr, setClockStr] = useState('');

  useEffect(() => {
    if (liveAnalysis || !playing || !modelOnline) return;
    const interval = setInterval(() => setTick((t) => t + 1), 700);
    return () => clearInterval(interval);
  }, [playing, modelOnline, liveAnalysis]);

  useEffect(() => {
    setTracks(TRACK_DEFS.map((d) => buildTrack(d, tick)));
  }, [tick]);

>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
  useEffect(() => {
    const clock = setInterval(() => {
      setClockStr(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    }, 1000);
    return () => clearInterval(clock);
  }, []);
<<<<<<< HEAD
  useEffect(() => {
    if (liveAnalysis || !playing) return;
    const runtime = setInterval(() => {
      setRuntimeSec((s) => s + 1);
      setBattery((b) => (Math.random() < 0.08 ? clamp(b - 1, 1, 100) : b));
    }, 1000);
    return () => clearInterval(runtime);
  }, [playing]);
=======

  useEffect(() => {
    if (liveAnalysis || !playing) return;
    const runtime = setInterval(() => setRuntimeSec((s) => s + 1), 1000);
    return () => clearInterval(runtime);
  }, [playing, liveAnalysis]);
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98

  useEffect(() => {
    setClockStr(new Date().toLocaleTimeString('en-IN', { hour12: false }));
  }, []);

  const handleReplay = useCallback(() => {
    if (liveAnalysis) {
      if (mediaRef.current) {
        mediaRef.current.currentTime = 0;
        mediaRef.current.play().catch(() => {});
      }
      setPlaying(true);
      return;
    }
<<<<<<< HEAD
    trackStateRef.current = [];
    alertedRef.current = {};
    setTick(0);
    setRuntimeSec(0);
    setAlerts([]);
    setPlaying(true);
    setTracks(TRACK_DEFS.map((d, i) => buildTrack(d, 0, i, null)));
=======
    setTick(0);
    setRuntimeSec(0);
    setPlaying(true);
    setTracks(TRACK_DEFS.map((d) => buildTrack(d, 0)));
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
  }, [liveAnalysis]);

  const togglePlaying = useCallback(() => {
    setPlaying((p) => {
      const next = !p;
      if (liveAnalysis && mediaRef.current) {
        if (next) mediaRef.current.play().catch(() => {});
        else mediaRef.current.pause();
      }
      return next;
    });
  }, [liveAnalysis]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  }, []);
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

<<<<<<< HEAD
  const simulateSignalLoss = useCallback(() => {
    setConnection('reconnecting');
    setTimeout(() => setConnection('connected'), 3200);
  }, []);

=======
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
  const durationLabel = useMemo(() => {
    const m = Math.floor(runtimeSec / 60), s = runtimeSec % 60;
    return `${pad2(m)}:${pad2(s)}`;
  }, [runtimeSec]);

<<<<<<< HEAD
  const visibleTracks = modelOnline && connection === 'connected' ? tracks : [];
  const activeAlertCount = visibleTracks.filter((t) => t.tier === 'high').length;
  const gps = useMemo(() => '28.6139° N, 77.2090° E', []);
=======
  const visibleTracks = !liveAnalysis && modelOnline ? tracks : [];
  const sampleAlerts = [
    {
      id: '042',
      time: clockStr || '—',
      title: 'Track #042 entered Restricted Zone A.',
      detail: 'Behavior analysis: prolonged dwell + low-speed movement. Risk: HIGH. Confidence: sample.'
    },
    {
      id: '029',
      time: clockStr || '—',
      title: 'Track #029 approaching perimeter tripwire.',
      detail: 'Movement: approaching boundary. Risk: MEDIUM. Signals: boundary approach.'
    }
  ];
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98

  return (
    <div
      ref={containerRef}
      className={`command-center mode-${mode} ${fullscreen ? 'is-fullscreen' : ''} ${!playing ? 'is-paused' : ''}`}
    >
      <div className="cc-topbar">
        <div className="cc-topleft">
<<<<<<< HEAD
          <b className={`live-dot ${liveAnalysis ? '' : connection !== 'connected' ? 'dot-warn' : ''}`} />
          {liveAnalysis ? (
            <>
              <span className="cc-cam-name">REAL ANALYSIS · YOLO11n + ByteTrack</span>
              <span className="cc-mode-chip">{liveAnalysis.mode === 'anpr' ? 'ANPR' : 'FULL PIPELINE'}</span>
            </>
          ) : (
            <>
              <span className="cc-cam-name">DRONE CAM {pad2(activeCam)}</span>
              <span className="cc-mode-chip">{MODES.find((m) => m.id === mode)?.label.toUpperCase()}</span>
=======
          <b className="live-dot" />
          {liveAnalysis ? (
            <>
              <span className="cc-cam-name">INFERENCE RUN · PERSON TRACKING</span>
              <span className="cc-mode-chip">LIVE ANALYSIS</span>
            </>
          ) : (
            <>
              <span className="cc-cam-name">THERMAL / LOW-LIGHT HUD</span>
              <span className="cc-mode-chip">DEMO INFERENCE</span>
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
            </>
          )}
        </div>
        <div className="cc-topright">
<<<<<<< HEAD
          <span>
            {liveAnalysis
              ? `${liveAnalysis.nativeRes?.width || '—'} × ${liveAnalysis.nativeRes?.height || '—'}`
              : RESOLUTIONS[mode]}
          </span>
=======
          <span>{liveAnalysis ? (liveAnalysis.nativeRes ? `${liveAnalysis.nativeRes.width} × ${liveAnalysis.nativeRes.height}` : 'Native video') : 'Sample aerial frame'}</span>
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
          <span>{liveAnalysis ? liveAnalysis.timestamp : `${clockStr} IST`}</span>
        </div>
      </div>

      <div className="cc-stage">
        {liveAnalysis && !videoError ? (
          mode === 'split' ? (
            <div className="cc-split">
              <div className="cc-pane">
                <video src={liveAnalysis.videoUrl} muted loop playsInline onError={() => setVideoError(true)} />
<<<<<<< HEAD
                <span className="pane-tag">RGB</span>
              </div>
              <div className="cc-pane thermal-filter">
                <video src={liveAnalysis.videoUrl} muted loop playsInline />
                <span className="pane-tag">THERMAL</span>
=======
                <span className="pane-tag">RGB REF</span>
              </div>
              <div className="cc-pane thermal-filter">
                <video src={liveAnalysis.videoUrl} muted loop playsInline />
                <span className="pane-tag">THERMAL VIEW</span>
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
              </div>
            </div>
          ) : (
            <div className={`cc-media cc-filter-${mode}`}>
              <video
                ref={mediaRef}
                src={liveAnalysis.videoUrl}
                muted
                loop
                autoPlay
                playsInline
                onError={() => setVideoError(true)}
              />
            </div>
          )
        ) : mode === 'split' ? (
          <div className="cc-split">
            <div className="cc-pane">
<<<<<<< HEAD
              <img src={BASE_IMAGE} alt="RGB drone feed" />
              <span className="pane-tag">RGB</span>
            </div>
            <div className="cc-pane thermal-filter">
              <img src={BASE_IMAGE} alt="Thermal drone feed" />
              <span className="pane-tag">THERMAL</span>
=======
              <img src={BASE_IMAGE} alt="RGB reference drone frame" />
              <span className="pane-tag">RGB REF</span>
            </div>
            <div className="cc-pane thermal-filter">
              <img src={BASE_IMAGE} alt="Thermal-style drone frame" />
              <span className="pane-tag">THERMAL VIEW</span>
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
            </div>
          </div>
        ) : (
          <div className={`cc-media cc-filter-${mode}`}>
<<<<<<< HEAD
            <img src={BASE_IMAGE} alt="Live drone surveillance feed" />
=======
            <img src={BASE_IMAGE} alt="Sample aerial surveillance frame" />
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
          </div>
        )}

        <div className="cc-scanlines" aria-hidden="true" />
        <div className="cc-grid-overlay" aria-hidden="true" />
        <div className="cc-vignette" aria-hidden="true" />

        {liveAnalysis && videoError && (
          <div className="cc-flag cc-flag-standby">
<<<<<<< HEAD
            RECORDING EXPIRED THIS SESSION · DETECTIONS BELOW ARE STILL REAL
=======
            SESSION VIDEO EXPIRED · COUNTS BELOW ARE FROM THE LAST RUN
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
          </div>
        )}

        {!liveAnalysis && mode !== 'split' &&
          visibleTracks.map((t) => (
            <div
              className="cc-track"
              key={t.id}
<<<<<<< HEAD
              style={{ left: `${t.pos.x}%`, top: `${t.pos.y}%`, '--track-color': tierColor(t.tier) }}
            >
              <div className="cc-track-label">
                <b>{t.type} #{t.id}</b>
                <span>CONF {t.conf}%</span>
                <span className={`cc-risk cc-risk-${t.tier}`}>RISK {t.risk}%</span>
              </div>
              <div className={`cc-track-box tier-${t.tier}`}>
                <i className="corner tl" /><i className="corner tr" />
                <i className="corner bl" /><i className="corner br" />
                {t.tier === 'high' && <span className="cc-alert-chip">ALERT</span>}
              </div>
              <div className="cc-track-meta">
                <span className="cc-arrow" style={{ transform: `rotate(${t.angle}deg)` }}>➤</span>
                <span>{t.category}</span>
                <span>{t.speedLabel}</span>
                <span>⏱ {durationLabel}</span>
=======
              style={{ left: `${t.pos.x}%`, top: `${t.pos.y}%`, '--track-color': t.riskLabel === 'HIGH' ? '#ff5c7a' : '#ffcc78' }}
            >
              <div className="cc-track-label cc-track-label-rich">
                <b>{t.type} #{t.id}</b>
                <span>Confidence: {t.confLabel}</span>
                <span>Status: {t.status}</span>
                <span>Movement: {t.movement}</span>
                <span>Behavior: {t.behavior}</span>
                <span className={`cc-risk cc-risk-${t.riskLabel === 'HIGH' ? 'high' : 'mid'}`}>Risk: {t.riskLabel}</span>
                <span>Duration: 00:{t.duration}</span>
              </div>
              <div className={`cc-track-box tier-${t.riskLabel === 'HIGH' ? 'high' : 'mid'}`}>
                <i className="corner tl" /><i className="corner tr" />
                <i className="corner bl" /><i className="corner br" />
                <span className="cc-alert-chip">SAMPLE</span>
              </div>
              <div className="cc-track-meta">
                {t.signals.map((s) => <span key={s}>• {s}</span>)}
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
              </div>
            </div>
          ))}

        {!playing && <div className="cc-flag cc-flag-pause">⏸ FEED PAUSED</div>}
<<<<<<< HEAD
        {!liveAnalysis && connection === 'reconnecting' && (
          <div className="cc-flag cc-flag-signal">⚠ SIGNAL LOST — RECONNECTING…</div>
        )}
        {!liveAnalysis && !modelOnline && <div className="cc-flag cc-flag-standby">AI MODEL STANDBY · DETECTION PAUSED</div>}
=======
        {!liveAnalysis && !modelOnline && <div className="cc-flag cc-flag-standby">AWAITING MODEL INFERENCE · OVERLAYS HIDDEN</div>}
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
      </div>

      <div className="cc-bottombar">
        {liveAnalysis ? (
          <>
<<<<<<< HEAD
            <span>BREACHES <b>{liveAnalysis.breaches ?? 0}</b></span>
            <span>PLATES <b>{Object.keys(liveAnalysis.plates || {}).length}</b></span>
            <span className={(liveAnalysis.alerts?.length || 0) > 0 ? 'cc-alert-flash' : ''}>
              ALERTS <b>{liveAnalysis.alerts?.length || 0}</b>
            </span>
          </>
        ) : (
          <>
            <span>FPS <b>{playing && modelOnline ? fps : '--'}</b></span>
            <span>Latency <b>{playing && modelOnline ? `${latency}ms` : '--'}</b></span>
            <span>TRACKS <b>{pad2(visibleTracks.length)}</b></span>
            <span className={activeAlertCount > 0 ? 'cc-alert-flash' : ''}>ALERT <b>{activeAlertCount}</b></span>
=======
            <span>PERIMETER EVENTS <b>{liveAnalysis.breaches ?? 0}</b></span>
            <span>ALERTS <b>{liveAnalysis.alerts?.length || 0}</b></span>
            <span>SOURCE <b>Inference run</b></span>
          </>
        ) : (
          <>
            <span>DETECTED PERSONS <b>Sample · 02</b></span>
            <span>ACTIVE TRACKS <b>Sample · 02</b></span>
            <span>PERIMETER EVENTS <b>Sample</b></span>
            <span>HUD <b>Demo inference</b></span>
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
          </>
        )}
      </div>

      <div className="cc-controls">
        <div className="cc-mode-tabs">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={mode === m.id ? 'active' : ''}
              onClick={() => setMode(m.id)}
            >
              <span>{m.icon}</span> {m.label}
            </button>
          ))}
        </div>
        <div className="cc-playback">
          <button type="button" onClick={togglePlaying}>
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
          <button type="button" onClick={handleReplay}>⟲ Replay</button>
          <button type="button" onClick={toggleFullscreen}>
            {fullscreen ? '⤡ Exit Full-Screen' : '⤢ Full-Screen'}
          </button>
        </div>
        {liveAnalysis ? (
          <div className="cc-system">
<<<<<<< HEAD
            <Link href="/demo" className="cc-run-new">Run New Analysis ↗</Link>
=======
            <Link href="/demo" className="cc-run-new">Run AI Analysis ↗</Link>
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
          </div>
        ) : (
          <div className="cc-system">
            <button
              type="button"
              className={`cc-model-toggle ${modelOnline ? 'on' : 'off'}`}
              onClick={() => setModelOnline((o) => !o)}
            >
<<<<<<< HEAD
              <i /> AI Model · {modelOnline ? 'ONLINE' : 'STANDBY'}
            </button>
            <select value={activeCam} onChange={(e) => setActiveCam(Number(e.target.value))}>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>Drone Cam {pad2(n)}</option>
              ))}
            </select>
            <button type="button" onClick={simulateSignalLoss}>Test Signal Loss</button>
=======
              <i /> Overlay · {modelOnline ? 'SAMPLE ON' : 'HIDDEN'}
            </button>
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
          </div>
        )}
      </div>

      <div className="cc-lower-grid">
        <div className="cc-telemetry">
<<<<<<< HEAD
          <p className="eyebrow">{liveAnalysis ? 'Run Parameters' : 'Flight Telemetry'}</p>
          {liveAnalysis ? (
            <div className="cc-telem-grid">
              <div><span>Gateway</span><b>{(liveAnalysis.gatewayUrl || '').replace(/^https?:\/\//, '').split('/')[0] || '—'}</b></div>
              <div><span>Pipeline</span><b>{liveAnalysis.mode === 'anpr' ? 'ANPR Checkpoint' : 'Master Defense'}</b></div>
              <div><span>Native Res.</span><b>{liveAnalysis.nativeRes ? `${liveAnalysis.nativeRes.width}×${liveAnalysis.nativeRes.height}` : '—'}</b></div>
              <div><span>Generated</span><b>{liveAnalysis.timestamp}</b></div>
              <div><span>Model</span><b>YOLO11n + ByteTrack</b></div>
              <div><span>Source</span><b>Real edge inference</b></div>
            </div>
          ) : (
            <div className="cc-telem-grid">
              <div><span>Altitude</span><b>{altitude} m AGL</b></div>
              <div><span>Battery</span><b>{battery}%</b></div>
              <div><span>Heading</span><b>{Math.round(heading)}°</b></div>
              <div><span>Signal</span><b>{connection === 'connected' ? '●●●●' : '●○○○'}</b></div>
              <div><span>GPS Fix</span><b>{gps}</b></div>
              <div><span>Model</span><b>YOLOv11-Track</b></div>
=======
          <p className="eyebrow">{liveAnalysis ? 'AI detection telemetry' : 'CV analysis metrics'}</p>
          {liveAnalysis ? (
            <div className="cc-telem-grid">
              <div><span>Video source</span><b>Uploaded drone clip</b></div>
              <div><span>Inference mode</span><b>{(liveAnalysis.videoMode || mode).toUpperCase()}</b></div>
              <div><span>Native res.</span><b>{liveAnalysis.nativeRes ? `${liveAnalysis.nativeRes.width}×${liveAnalysis.nativeRes.height}` : '—'}</b></div>
              <div><span>Perimeter events</span><b>{liveAnalysis.breaches ?? 0}</b></div>
              <div><span>Suspicious events</span><b>{liveAnalysis.alerts?.length ?? 0}</b></div>
              <div><span>Model</span><b>YOLO11n + ByteTrack</b></div>
            </div>
          ) : (
            <div className="cc-telem-grid">
              <div><span>Video source</span><b>Sample aerial frame</b></div>
              <div><span>Frame rate</span><b>Awaiting inference</b></div>
              <div><span>Processing latency</span><b>Awaiting inference</b></div>
              <div><span>Detected persons</span><b>Sample · 2</b></div>
              <div><span>Active tracks</span><b>Sample · 2</b></div>
              <div><span>Model</span><b>YOLO11n + ByteTrack</b></div>
              <div><span>Inference mode</span><b>{MODES.find((m) => m.id === mode)?.label}</b></div>
              <div><span>Clip time</span><b>{durationLabel}</b></div>
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
            </div>
          )}
        </div>
        <div className="cc-incidents">
<<<<<<< HEAD
          <p className="eyebrow">Incident Feed</p>
=======
          <p className="eyebrow">AI Detection &amp; Alert Feed</p>
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
          {liveAnalysis ? (
            liveAnalysis.alerts?.length > 0 ? (
              <ul>
                {liveAnalysis.alerts.map((a, i) => (
                  <li key={i}>
                    <b>{a.timestamp || `Frame ${a.frame ?? i}`}</b>
<<<<<<< HEAD
                    <span>{a.message || `Track #${a.track_id || a.id || 'N/A'} triggered a perimeter rule (${a.type || 'alert'}).`}</span>
=======
                    <span>{explainAlert(a)}</span>
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
                  </li>
                ))}
              </ul>
            ) : (
<<<<<<< HEAD
              <p className="muted">No breach or tripwire incidents in this run. Perimeter was secure.</p>
            )
          ) : alerts.length > 0 ? (
            <ul>
              {alerts.map((a) => (
                <li key={a.id}><b>{a.time}</b><span>{a.msg}</span></li>
              ))}
            </ul>
          ) : (
            <p className="muted">No active alerts. Perimeter nominal.</p>
=======
              <p className="muted">No perimeter events in this run. Review tracks in the annotated video.</p>
            )
          ) : (
            <ul>
              {sampleAlerts.map((a) => (
                <li key={a.id}><b>{a.time} · sample</b><span>{a.title} {a.detail}</span></li>
              ))}
            </ul>
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
          )}
        </div>
      </div>

      <p className="cc-disclaimer">
        {liveAnalysis
<<<<<<< HEAD
          ? 'This panel is rendering the actual response (video, breach count, plates, alerts) from your last live IBVAP edge-analytics run.'
          : <>No live run yet — this is a simulated preview. <Link href="/demo" className="cc-inline-link">Run a real analysis on the Demo Platform →</Link></>}
=======
          ? 'Rendering the last workbench inference (annotated video, perimeter events, alerts).'
          : <>Demo inference overlays — not live model output. <Link href="/demo" className="cc-inline-link">Upload drone footage to run analysis →</Link></>}
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
      </p>
    </div>
  );
}
<<<<<<< HEAD

function tierColor(tier) {
  if (tier === 'high') return '#ff5c7a';
  if (tier === 'mid') return '#ffcc78';
  return '#58d68d';
}
=======
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
