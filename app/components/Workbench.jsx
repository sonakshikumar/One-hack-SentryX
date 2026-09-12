'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useApiConfig, decodeAlertsHeader } from '../lib/apiConfig';
import { saveLastAnalysis } from '../lib/liveFeed';
import { loadSurveillanceConfig, CONFIG_EVENT } from '../lib/surveillanceConfig';

const DEFAULT_NATIVE_VIDEO = { width: 1920, height: 1080 };
const INITIAL_FENCE = [
  { x: 100, y: 150 },
  { x: 300, y: 150 },
  { x: 260, y: 400 },
  { x: 80,  y: 400 }
];
const INITIAL_TRIPWIRE = [
  { x: 250, y: 300 },
  { x: 650, y: 310 }
];

const HANDLE_RADIUS = 7;
const MIDPOINT_RADIUS = 5;

export function Workbench() {
  const { baseUrl } = useApiConfig();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [videoMode, setVideoMode] = useState('thermal');
  const [file, setFile] = useState(null);
  const [framePreviewUrl, setFramePreviewUrl] = useState('');
  const [nativeRes, setNativeRes] = useState(DEFAULT_NATIVE_VIDEO);
  const [durationSec, setDurationSec] = useState(null);

  const [tool, setTool] = useState('fence');
  const [fence, setFence] = useState(null);
  const [tripwire, setTripwire] = useState(null);
  const [tripwireFlipped, setTripwireFlipped] = useState(false);
  const [draggingHandle, setDraggingHandle] = useState(null);

  const [maxDuration, setMaxDuration] = useState(15);

  const [processing, setProcessing] = useState(false);
  const [progressPhase, setProgressPhase] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const apply = (cfg) => {
      if (cfg.maxDuration) setMaxDuration(Number(cfg.maxDuration));
      if (cfg.videoMode) setVideoMode(cfg.videoMode);
    };
    apply(loadSurveillanceConfig());
    const onPresetsChanged = (e) => { if (e?.detail) apply(e.detail); };
    window.addEventListener(CONFIG_EVENT, onPresetsChanged);
    return () => window.removeEventListener(CONFIG_EVENT, onPresetsChanged);
  }, []);

  useEffect(() => {
    if (!file) {
      setFramePreviewUrl('');
      setNativeRes(DEFAULT_NATIVE_VIDEO);
      setDurationSec(null);
      return;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const onLoadedMetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        setNativeRes({ width: video.videoWidth, height: video.videoHeight });
      }
      if (Number.isFinite(video.duration)) setDurationSec(video.duration);
      video.currentTime = Math.min(1.0, (video.duration || 1) / 2);
    };

    const onSeeked = () => {
      try {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = 800;
        offCanvas.height = 450;
        const ctx = offCanvas.getContext('2d');
        ctx.drawImage(video, 0, 0, 800, 450);
        const dataUrl = offCanvas.toDataURL('image/jpeg', 0.85);
        setFramePreviewUrl(dataUrl);
      } catch (e) {
        console.warn('Could not extract video frame for canvas backdrop:', e);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('seeked', onSeeked);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('seeked', onSeeked);
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  useEffect(() => {
    if (!processing) {
      setProgressPhase('');
      return;
    }

    setProgressPhase('Analysis request sent to the inference service…');
  }, [processing]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = (imgElement) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!file) {
        ctx.fillStyle = '#16232b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#9fb2b7';
        ctx.textAlign = 'center';
        ctx.font = '600 16px Space Grotesk';
        ctx.fillText(`${videoMode.toUpperCase()} MODE`, canvas.width / 2, canvas.height / 2 - 18);
        ctx.font = '12px Inter';
        ctx.fillStyle = '#c6d5d6';
        ctx.fillText(`No ${videoMode === 'rgb' ? 'RGB' : videoMode === 'lowlight' ? 'low-light' : 'thermal'} footage loaded.`, canvas.width / 2, canvas.height / 2 + 12);
        ctx.textAlign = 'start';
        return;
      }

      if (imgElement && imgElement.complete && imgElement.naturalWidth !== 0) {
        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = '#16232b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.fillStyle = 'rgba(12, 25, 33, 0.22)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (fence && fence.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(fence[0].x, fence[0].y);
        for (let i = 1; i < fence.length; i++) {
          ctx.lineTo(fence[i].x, fence[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 0, 50, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#ff0033';
        ctx.lineWidth = 2;
        ctx.stroke();

        fence.forEach((pt, i) => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, HANDLE_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = '#ff0033';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px Inter';
          ctx.fillText(String(i + 1), pt.x - 3, pt.y + 3);
        });

        for (let i = 0; i < fence.length; i++) {
          const p1 = fence[i];
          const p2 = fence[(i + 1) % fence.length];
          const mx = (p1.x + p2.x) / 2;
          const my = (p1.y + p2.y) / 2;

          ctx.beginPath();
          ctx.arc(mx, my, MIDPOINT_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = '#22272b';
          ctx.fill();
          ctx.strokeStyle = '#00ffc8';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.strokeStyle = '#00ffc8';
          ctx.beginPath();
          ctx.moveTo(mx - 3, my);
          ctx.lineTo(mx + 3, my);
          ctx.moveTo(mx, my - 3);
          ctx.lineTo(mx, my + 3);
          ctx.stroke();
        }
      }

      if (tripwire && tripwire.length === 2) {
        const [p1, p2] = tripwire;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = '#ffea00';
        ctx.lineWidth = 3;
        ctx.stroke();

        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        let angle = Math.atan2(dy, dx) + Math.PI / 2;
        if (tripwireFlipped) angle += Math.PI;

        const arrowLen = 22;
        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -arrowLen);
        ctx.lineTo(-6, -arrowLen + 7);
        ctx.moveTo(0, -arrowLen);
        ctx.lineTo(6, -arrowLen + 7);
        ctx.strokeStyle = '#ffea00';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#ffea00';
        ctx.font = '600 9px Space Grotesk';
        ctx.fillText('CROSSING VECTOR', -42, -arrowLen - 5);
        ctx.restore();

        const drawTripHandle = (p, label) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, HANDLE_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = '#ffea00';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#17242d';
          ctx.font = 'bold 9px Inter';
          ctx.fillText(label, p.x - 3, p.y + 3);
        };

        drawTripHandle(p1, 'A');
        drawTripHandle(p2, 'B');
      }
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    if (file && framePreviewUrl) {
      img.src = framePreviewUrl;
      img.onload = () => render(img);
      if (img.complete) render(img);
    } else {
      render(null);
    }
  }, [fence, tripwire, tripwireFlipped, framePreviewUrl, file, videoMode]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  function getCanvasCoords(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 450 / rect.height;
    return {
      x: Math.max(0, Math.min(800, (e.clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(450, (e.clientY - rect.top) * scaleY)),
    };
  }

  function handlePointerDown(e) {
    const { x, y } = getCanvasCoords(e);

    if (fence) {
      for (let i = 0; i < fence.length; i++) {
        if (Math.hypot(fence[i].x - x, fence[i].y - y) <= HANDLE_RADIUS + 5) {
          setDraggingHandle({ shape: 'fence', index: i });
          return;
        }
      }

      for (let i = 0; i < fence.length; i++) {
        const p1 = fence[i];
        const p2 = fence[(i + 1) % fence.length];
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        if (Math.hypot(mx - x, my - y) <= MIDPOINT_RADIUS + 5) {
          const newPoint = { x: Math.round(x), y: Math.round(y) };
          const updated = [...fence];
          updated.splice(i + 1, 0, newPoint);
          setFence(updated);
          setDraggingHandle({ shape: 'fence', index: i + 1 });
          return;
        }
      }
    }

    if (tripwire) {
      for (let i = 0; i < tripwire.length; i++) {
        if (Math.hypot(tripwire[i].x - x, tripwire[i].y - y) <= HANDLE_RADIUS + 5) {
          setDraggingHandle({ shape: 'tripwire', index: i });
          return;
        }
      }
    }
  }

  function handlePointerMove(e) {
    if (!draggingHandle) return;
    const { x, y } = getCanvasCoords(e);

    if (draggingHandle.shape === 'fence') {
      setFence((points) => points?.map((p, i) => (i === draggingHandle.index ? { x, y } : p)));
    } else if (draggingHandle.shape === 'tripwire') {
      setTripwire((points) => points?.map((p, i) => (i === draggingHandle.index ? { x, y } : p)));
    }
  }

  function handlePointerUp() {
    setDraggingHandle(null);
  }

  function formatDuration(seconds) {
    if (!Number.isFinite(seconds)) return 'Duration unavailable';
    const total = Math.round(seconds);
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  function removeVideo() {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeVertex(index) {
    if (fence && fence.length > 3) {
      setFence(fence.filter((_, i) => i !== index));
    }
  }

  function exportPayload() {
    const scaleX = nativeRes.width / 800;
    const scaleY = nativeRes.height / 450;
    const payload = {};

    if (fence && fence.length >= 3) {
      payload.fence_polygon = JSON.stringify(
        fence.map((pt) => [Math.round(pt.x * scaleX), Math.round(pt.y * scaleY)])
      );
    }
    if (tripwire && tripwire.length === 2) {
      payload.tripwire_line = JSON.stringify(
        tripwire.map((pt) => [Math.round(pt.x * scaleX), Math.round(pt.y * scaleY)])
      );
    }
    return payload;
  }

  function downloadAuditReport() {
    if (!result) return;
    const auditData = {
      report_id: `SENTRYX-${Date.now()}`,
      generated_at: new Date().toISOString(),
      platform: 'SentryX drone surveillance analysis',
      inference_base_url: baseUrl,
      endpoint_called: '/api/v1/analytics/full',
      native_resolution: nativeRes,
      parameters: {
        max_duration: maxDuration,
        video_mode: videoMode,
      },
      telemetry: {
        perimeter_events: Number(result.breaches) || 0,
        alert_count: result.alerts?.length || 0,
      },
      incident_alerts: result.alerts || [],
    };

    const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadAnnotatedVideo() {
    if (!result?.videoUrl) return;
    const a = document.createElement('a');
    a.href = result.videoUrl;
    a.download = `sentryx_annotated_${Date.now()}.mp4`;
    a.click();
  }

  async function runAnalytics(e) {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!file) {
      setError('Upload a drone video file (.mp4, .avi, .mov) before running analysis.');
      return;
    }
    if (!baseUrl) {
      setError('AI engine is offline. Set NEXT_PUBLIC_AI_SERVICE_URL and restart the app.');
      return;
    }

    const form = new FormData();
    form.append('video_file', file);

    const zones = exportPayload();
    if (zones.fence_polygon) form.append('fence_polygon', zones.fence_polygon);
    if (zones.tripwire_line) form.append('tripwire_line', zones.tripwire_line);

    form.append('max_duration', String(Math.min(60, maxDuration)));
    if (videoMode !== 'rgb') {
      form.append('night_mode', 'true');
    }

    const targetEndpoint = `${baseUrl}/api/v1/analytics/full`;
    setProcessing(true);

    try {
      const response = await fetch(targetEndpoint, {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        if (response.status === 502 || response.status === 524) {
          throw new Error(`HTTP ${response.status}: Inference host timed out. Try a shorter clip or a lower max duration.`);
        }
        throw new Error(`Inference pipeline returned HTTP ${response.status} (${response.statusText || 'Error'})`);
      }

      const rawBreaches = response.headers.get('X-SentryX-Breach-Count');
      const breaches = rawBreaches ? parseInt(rawBreaches, 10) : 0;
      const rawBase64Alerts = response.headers.get('X-SentryX-Alerts-JSON');
      const alerts = decodeAlertsHeader(rawBase64Alerts);

      const videoBlob = await response.blob();
      const videoUrl = URL.createObjectURL(videoBlob);

      const analysis = {
        videoUrl,
        breaches,
        alerts,
        videoMode,
        nativeRes,
        timestamp: new Date().toLocaleTimeString(),
      };
      setResult(analysis);
      saveLastAnalysis(analysis);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('502')) {
        setError(msg || 'Could not reach the inference host. Check Settings or use a shorter clip.');
      } else {
        setError(err.message || 'Failed to run analysis.');
      }
    } finally {
      setProcessing(false);
    }
  }

  const payloadPreview = exportPayload();

  return (
    <section className="workbench section" id="workbench">
      <div className="section-heading inline workbench-top">
        <div>
          <p className="eyebrow">Drone surveillance workbench</p>
          <h2>Upload footage. Define a perimeter. Run analysis.</h2>
        </div>
        <Link href="/settings" className="gateway-settings-link">Settings ⚙</Link>
      </div>

      <form className="workbench-grid" onSubmit={runAnalytics}>
        <div className="calibrator panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">02 · Perimeter configuration</p>
              <h3>Restricted zones &amp; tripwires</h3>
            </div>
            <div className="zone-actions">
              <button
                type="button"
                className="clear-btn"
                onClick={() => {
                  setFence(null);
                  setTripwire(null);
                }}
              >
                Clear All Zones
              </button>
            </div>
          </div>

          <div className="tool-row">
            <button
              type="button"
              className={tool === 'fence' ? 'tool active' : 'tool'}
              onClick={() => setTool('fence')}
            >
              ◈ Restricted zone
            </button>
            <button
              type="button"
              className={tool === 'tripwire' ? 'tool active' : 'tool'}
              onClick={() => setTool('tripwire')}
            >
              ⌁ Perimeter tripwire
            </button>

            {tool === 'fence' && (
              <button
                type="button"
                className="tool preset"
                onClick={() => setFence(INITIAL_FENCE)}
              >
                + Add preset zone
              </button>
            )}

            {tool === 'tripwire' && (
              <>
                <button
                  type="button"
                  className="tool preset"
                  onClick={() => setTripwire(INITIAL_TRIPWIRE)}
                >
                  + Add preset tripwire
                </button>
                {tripwire && (
                  <button
                    type="button"
                    className="tool"
                    onClick={() => setTripwireFlipped(!tripwireFlipped)}
                    title="Reverse crossing direction"
                  >
                    ⇄ Reverse Direction
                  </button>
                )}
              </>
            )}
          </div>

          <div className="calibration-frame">
            <canvas
              ref={canvasRef}
              width="800"
              height="450"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
            <div className="frame-meta">
              <span className="frame-label">
                {file ? `NATIVE: ${nativeRes.width} × ${nativeRes.height} · CANVAS: 800 × 450` : 'NO SOURCE FRAME · CANVAS: 800 × 450'}
              </span>
              {file && <span className="frame-file-tag">● Source frame extracted</span>}
            </div>
          </div>

          <div className="zone-helper-bar">
            <span>
              Drag any vertex. Click the <b>&quot;+&quot; handle</b> on an edge to add vertices for complex perimeters.
            </span>
          </div>

          <div className="zone-readout">
            {fence || tripwire ? (
              <>
                <div className="readout-header">
                  <span>Geometry scaled to {nativeRes.width}×{nativeRes.height}</span>
                  {fence && (
                    <button
                      type="button"
                      className="remove-vert-btn"
                      onClick={() => removeVertex(fence.length - 1)}
                      disabled={fence.length <= 3}
                    >
                      Remove last vertex ({fence.length} pts)
                    </button>
                  )}
                </div>
                <code>{JSON.stringify(payloadPreview, null, 2)}</code>
              </>
            ) : (
              <span>No perimeter configured. Add a restricted zone or tripwire before analysis if the backend requires one.</span>
            )}
          </div>
        </div>

        <div className="analysis panel">
          <p className="eyebrow">01 · Video input</p>
          <h3>Upload drone footage</h3>

          <div className={`source-drop ${file ? 'has-file' : ''}`}>
            {file ? (
              <div className="drop-file-info">
                <b>DRONE FOOTAGE</b>
                <strong>{file.name}</strong>
                <small>
                  {nativeRes.width} × {nativeRes.height} · {formatDuration(durationSec)} · {(file.size / 1024 / 1024).toFixed(1)} MB
                </small>
                <div className="upload-actions">
                  <button type="button" className="text-link" onClick={() => fileInputRef.current?.click()}>Replace Video</button>
                  <button type="button" className="text-link" onClick={removeVideo}>Remove</button>
                </div>
              </div>
            ) : (
              <>
                <b>Upload Drone Footage</b>
                <small>MP4, AVI or MOV · thermal, low-light, or RGB</small>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {!file && <button type="button" className="button light upload-trigger" onClick={() => fileInputRef.current?.click()}>Upload Drone Footage</button>}
          </div>

          <div className="workbench-subsection">
          <p className="eyebrow">Viewing mode</p>
          <div className="mode-pills">
            {[
              ['thermal', 'Thermal'],
              ['lowlight', 'Low-light'],
              ['rgb', 'RGB (reference)']
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={videoMode === id ? 'tool active' : 'tool'}
                onClick={() => setVideoMode(id)}
              >
                {label}
              </button>
            ))}
          </div>
          </div>

          <div className="workbench-subsection">
          <p className="eyebrow">Analysis</p>
          <label className="range-label">
            <span>Max analysis duration</span>
            <output>{maxDuration}s</output>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={maxDuration}
              onChange={(e) => setMaxDuration(Number(e.target.value))}
            />
          </label>
          </div>

          <div className="workbench-subsection pipeline-status">
            <p className="eyebrow">Pipeline</p>
            <div><span>Detection</span><b>Person</b></div>
            <div><span>Tracking</span><b>ByteTrack</b></div>
            <div><span>Behavior</span><b>Awaiting inference</b></div>
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}

          {processing ? (
            <div className="tactical-loader">
              <div className="loader-top">
                <div className="radar-sweep" />
                <div>
                  <b className="loader-phase">ANALYZING FOOTAGE…</b>
                  <div className="loader-sub">{progressPhase}</div>
                </div>
              </div>
              <div className="loader-steps"><span>Uploading video ✓</span><span>Inference request active</span><span>Results pending</span></div>
            </div>
          ) : (
            <button className="button dark run-button" type="submit" disabled={!file || !baseUrl}>
              <span>Run AI Analysis</span>
              <b>↗</b>
            </button>
          )}

          {!baseUrl && <div className="engine-notice"><b>AI ENGINE NOT CONNECTED</b><span>Analysis requires the SentryX inference service.</span><Link href="/settings">Open Settings →</Link></div>}

          <div className="settings-link-prompt">
            Detection / behavior thresholds live in{' '}
            <Link href="/settings">Settings →</Link>
          </div>
        </div>
      </form>

      {!result && !processing && (
        <div className="results empty-results panel">
          <p className="eyebrow">Analysis results</p>
          <h3>No analysis has been run.</h3>
          <p className="muted">Run a connected analysis to view detections, tracks, movement events, and perimeter alerts.</p>
        </div>
      )}

      {result && (
        <div className="results panel">
          <div className="results-head">
            <div>
              <p className="eyebrow">05–07 · Detection, movement, alerts</p>
              <h3>Annotated feed · {result.timestamp}</h3>
            </div>
            <div className="result-actions">
              <div className="breach-pill">
                <b>{result.breaches}</b>
                <small>Perimeter events</small>
              </div>
              <button type="button" className="button outline" onClick={downloadAnnotatedVideo}>
                Download MP4 ↧
              </button>
              <button type="button" className="button light" onClick={downloadAuditReport}>
                Download JSON ↧
              </button>
            </div>
          </div>

          <div className="result-video-container">
            <video className="result-video" controls autoPlay src={result.videoUrl} />
            <div className="video-stream-badge">
              ● Annotated output · {result.videoMode} mode
            </div>
          </div>

          <div className="result-grid">
            <div className="result-subpanel">
              <div className="subpanel-head">
                <p className="eyebrow">Movement / behavior</p>
                <span className="count-tag">Development</span>
              </div>
              <p className="muted">
                Behavior classification is a pipeline stage. This run reports perimeter events from detection + tracking + zone geometry. Dwell, speed, and heading labels appear here when the behavior model is connected.
              </p>
            </div>

            <div className="result-subpanel">
              <div className="subpanel-head">
                <p className="eyebrow">AI Detection &amp; Alert Feed</p>
                <span className="count-tag">{result.alerts?.length || 0} Events</span>
              </div>

              {result.alerts && result.alerts.length > 0 ? (
                <div className="alerts-timeline">
                  {result.alerts.map((alert, i) => (
                    <div className="alert-card" key={i}>
                      <div className="alert-meta">
                        <span className={`alert-type ${alert.type === 'breach' ? 'danger' : 'warning'}`}>
                          {alert.type || 'Perimeter event'}
                        </span>
                        <small className="alert-time">
                          {alert.timestamp || `Frame ${alert.frame || i}`}
                        </small>
                      </div>
                      <p className="alert-msg">
                        {alert.message || `Track #${alert.track_id || alert.id || 'N/A'} triggered a perimeter rule. Review zone context and track history.`}
                      </p>
                      {alert.track_id && (
                        <div className="alert-track-id">
                          Associated Track: <b>#{alert.track_id}</b>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">
                  No perimeter events in the decoded alert list. Check the annotated video for tracks.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
