'use client';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useLastAnalysis } from '../lib/liveFeed';

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
}

export function Dashboard() {
  const liveAnalysis = useLastAnalysis();
  const containerRef = useRef(null);
  const mediaRef = useRef(null);
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

  useEffect(() => {
    const clock = setInterval(() => {
      setClockStr(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    if (liveAnalysis || !playing) return;
    const runtime = setInterval(() => setRuntimeSec((s) => s + 1), 1000);
    return () => clearInterval(runtime);
  }, [playing, liveAnalysis]);

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
    setTick(0);
    setRuntimeSec(0);
    setPlaying(true);
    setTracks(TRACK_DEFS.map((d) => buildTrack(d, 0)));
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

  const durationLabel = useMemo(() => {
    const m = Math.floor(runtimeSec / 60), s = runtimeSec % 60;
    return `${pad2(m)}:${pad2(s)}`;
  }, [runtimeSec]);

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

  return (
    <div
      ref={containerRef}
      className={`command-center mode-${mode} ${fullscreen ? 'is-fullscreen' : ''} ${!playing ? 'is-paused' : ''}`}
    >
      <div className="cc-topbar">
        <div className="cc-topleft">
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
            </>
          )}
        </div>
        <div className="cc-topright">
          <span>{liveAnalysis ? (liveAnalysis.nativeRes ? `${liveAnalysis.nativeRes.width} × ${liveAnalysis.nativeRes.height}` : 'Native video') : 'Sample aerial frame'}</span>
          <span>{liveAnalysis ? liveAnalysis.timestamp : `${clockStr} IST`}</span>
        </div>
      </div>

      <div className="cc-stage">
        {liveAnalysis && !videoError ? (
          mode === 'split' ? (
            <div className="cc-split">
              <div className="cc-pane">
                <video src={liveAnalysis.videoUrl} muted loop playsInline onError={() => setVideoError(true)} />
                <span className="pane-tag">RGB REF</span>
              </div>
              <div className="cc-pane thermal-filter">
                <video src={liveAnalysis.videoUrl} muted loop playsInline />
                <span className="pane-tag">THERMAL VIEW</span>
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
              <img src={BASE_IMAGE} alt="RGB reference drone frame" />
              <span className="pane-tag">RGB REF</span>
            </div>
            <div className="cc-pane thermal-filter">
              <img src={BASE_IMAGE} alt="Thermal-style drone frame" />
              <span className="pane-tag">THERMAL VIEW</span>
            </div>
          </div>
        ) : (
          <div className={`cc-media cc-filter-${mode}`}>
            <img src={BASE_IMAGE} alt="Sample aerial surveillance frame" />
          </div>
        )}

        <div className="cc-scanlines" aria-hidden="true" />
        <div className="cc-grid-overlay" aria-hidden="true" />
        <div className="cc-vignette" aria-hidden="true" />

        {liveAnalysis && videoError && (
          <div className="cc-flag cc-flag-standby">
            SESSION VIDEO EXPIRED · COUNTS BELOW ARE FROM THE LAST RUN
          </div>
        )}

        {!liveAnalysis && mode !== 'split' &&
          visibleTracks.map((t) => (
            <div
              className="cc-track"
              key={t.id}
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
              </div>
            </div>
          ))}

        {!playing && <div className="cc-flag cc-flag-pause">⏸ FEED PAUSED</div>}
        {!liveAnalysis && !modelOnline && <div className="cc-flag cc-flag-standby">AWAITING MODEL INFERENCE · OVERLAYS HIDDEN</div>}
      </div>

      <div className="cc-bottombar">
        {liveAnalysis ? (
          <>
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
            <Link href="/demo" className="cc-run-new">Run AI Analysis ↗</Link>
          </div>
        ) : (
          <div className="cc-system">
            <button
              type="button"
              className={`cc-model-toggle ${modelOnline ? 'on' : 'off'}`}
              onClick={() => setModelOnline((o) => !o)}
            >
              <i /> Overlay · {modelOnline ? 'SAMPLE ON' : 'HIDDEN'}
            </button>
          </div>
        )}
      </div>

      <div className="cc-lower-grid">
        <div className="cc-telemetry">
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
            </div>
          )}
        </div>
        <div className="cc-incidents">
          <p className="eyebrow">AI Detection &amp; Alert Feed</p>
          {liveAnalysis ? (
            liveAnalysis.alerts?.length > 0 ? (
              <ul>
                {liveAnalysis.alerts.map((a, i) => (
                  <li key={i}>
                    <b>{a.timestamp || `Frame ${a.frame ?? i}`}</b>
                    <span>{explainAlert(a)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No perimeter events in this run. Review tracks in the annotated video.</p>
            )
          ) : (
            <ul>
              {sampleAlerts.map((a) => (
                <li key={a.id}><b>{a.time} · sample</b><span>{a.title} {a.detail}</span></li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="cc-disclaimer">
        {liveAnalysis
          ? 'Rendering the last workbench inference (annotated video, perimeter events, alerts).'
          : <>Demo inference overlays — not live model output. <Link href="/demo" className="cc-inline-link">Upload drone footage to run analysis →</Link></>}
      </p>
    </div>
  );
}
