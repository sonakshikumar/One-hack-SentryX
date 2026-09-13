'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useApiConfig, decodeAlertsHeader } from '../lib/apiConfig';
import { saveLastAnalysis } from '../lib/liveFeed';

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
  const { baseUrl, swaggerUrl } = useApiConfig();
  const canvasRef = useRef(null);
  const videoPreviewRef = useRef(null);

  // Pipeline mode: 'full' (Master Pipeline) or 'anpr' (Dedicated ANPR Checkpoint)
  const [pipelineMode, setPipelineMode] = useState('full');

  // Input sources
  const [file, setFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [framePreviewUrl, setFramePreviewUrl] = useState('');
  const [nativeRes, setNativeRes] = useState(DEFAULT_NATIVE_VIDEO);

  // Viewing mode is a frontend-only visual toggle (CSS filter over the
  // extracted preview frame) — it does not change what gets sent to the
  // backend or how analysis runs; it's purely for operator preview feel.
  const [viewingMode, setViewingMode] = useState('thermal'); // 'thermal' | 'lowlight' | 'rgb'

  // Zone calibration state
  const [tool, setTool] = useState('fence'); // 'fence' | 'tripwire'
  const [fence, setFence] = useState(null); // Array of {x, y}
  const [tripwire, setTripwire] = useState(null); // Array of 2 points [{x, y}, {x, y}]
  const [tripwireFlipped, setTripwireFlipped] = useState(false);
  const [draggingHandle, setDraggingHandle] = useState(null); // { shape: 'fence'|'tripwire', index: number }
  const [hoveredMidpoint, setHoveredMidpoint] = useState(null); // { edgeIndex: number, x: number, y: number }

  // Processing configuration
  const [maxDuration, setMaxDuration] = useState(15);
  const [nightMode, setNightMode] = useState(false);
  const [enableAnpr, setEnableAnpr] = useState(true);

  // Execution and telemetry state
  const [processing, setProcessing] = useState(false);
  const [progressPhase, setProgressPhase] = useState('');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copiedPlate, setCopiedPlate] = useState('');

  // Fallback realistic tactical surveillance background
  const defaultBackground = useMemo(
    () => 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f6?auto=format&fit=crop&w=1280&q=82',
    []
  );

  // Sync user presets from localStorage
  useEffect(() => {
    try {
      const savedDuration = localStorage.getItem('ibvap_default_duration');
      const savedAnpr = localStorage.getItem('ibvap_default_anpr');
      const savedNight = localStorage.getItem('ibvap_default_night');
      if (savedDuration) setMaxDuration(Number(savedDuration));
      if (savedAnpr !== null) setEnableAnpr(savedAnpr === 'true');
      if (savedNight !== null) setNightMode(savedNight === 'true');
    } catch {
      // ignore
    }

    const onPresetsChanged = (e) => {
      if (e?.detail) {
        if (e.detail.duration) setMaxDuration(e.detail.duration);
        if (e.detail.anpr !== undefined) setEnableAnpr(e.detail.anpr);
        if (e.detail.night !== undefined) setNightMode(e.detail.night);
      }
    };
    window.addEventListener('ibvap_presets_changed', onPresetsChanged);
    return () => window.removeEventListener('ibvap_presets_changed', onPresetsChanged);
  }, []);

  // Extract first frame and native dimensions when a local video file is selected
  useEffect(() => {
    if (!file) {
      setFramePreviewUrl('');
      setNativeRes(DEFAULT_NATIVE_VIDEO);
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

  // Phased tactical progress timer
  useEffect(() => {
    if (!processing) {
      setElapsedSec(0);
      setProgressPhase('');
      return;
    }

    const phases = [
      { at: 0, text: 'Uploading surveillance video to Edge Gateway…' },
      { at: 2, text: 'YOLO11n isolating human & vehicle detections (2x frame stride)…' },
      { at: 5, text: 'ByteTrack associating spatial tracking vectors…' },
      { at: 8, text: 'Spatial vector engine checking fence polygons & tripwires…' },
      { at: 12, text: 'Ultrafast H.264 rendering & decoding telemetry headers…' },
    ];

    setProgressPhase(phases[0].text);
    const interval = setInterval(() => {
      setElapsedSec((sec) => {
        const next = sec + 1;
        const currentPhase = [...phases].reverse().find((p) => next >= p.at);
        if (currentPhase) setProgressPhase(currentPhase.text);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [processing, pipelineMode]);

  // Canvas rendering: Background, Polygon, Midpoints, Tripwire & Arrow
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = (imgElement) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Render Video Backdrop
      if (imgElement && imgElement.complete && imgElement.naturalWidth !== 0) {
        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = '#16232b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Tactical grid overlay
      ctx.fillStyle = 'rgba(12, 25, 33, 0.22)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // If in ANPR mode, visually dim perimeter graphics or show checkpoint zone
      if (pipelineMode === 'anpr') {
        ctx.fillStyle = 'rgba(10, 18, 24, 0.55)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw checkpoint scanning corridor guide
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 204, 120, 0.4)';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2;
        ctx.strokeRect(150, 80, 500, 290);
        ctx.fillStyle = 'rgba(255, 204, 120, 0.04)';
        ctx.fillRect(150, 80, 500, 290);
        ctx.fillStyle = '#ffcc78';
        ctx.font = '600 11px Space Grotesk';
        ctx.fillText('ANPR VEHICLE CHECKPOINT CORRIDOR (AUTO-FOCUSED)', 165, 105);
        ctx.restore();
        return;
      }

      // 2. Render Fence (Red Translucent Polygon)
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

        // Draggable Vertex Handles
        fence.forEach((pt, i) => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, HANDLE_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = '#ff0033';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Vertex label
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px Inter';
          ctx.fillText(String(i + 1), pt.x - 3, pt.y + 3);
        });

        // Edge Midpoint Insertion Handles ("+")
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

          // Draw "+" sign
          ctx.strokeStyle = '#00ffc8';
          ctx.beginPath();
          ctx.moveTo(mx - 3, my);
          ctx.lineTo(mx + 3, my);
          ctx.moveTo(mx, my - 3);
          ctx.lineTo(mx, my + 3);
          ctx.stroke();
        }
      }

      // 3. Render Tripwire (Yellow Directional Line)
      if (tripwire && tripwire.length === 2) {
        const [p1, p2] = tripwire;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = '#ffea00';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Directional arrow perpendicular to the line
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

        // Draggable Handles
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
    img.src = framePreviewUrl || defaultBackground;
    img.onload = () => render(img);
    if (img.complete) render(img);
  }, [fence, tripwire, tripwireFlipped, framePreviewUrl, defaultBackground, pipelineMode]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Pointer & Dragging Events with Midpoint Insertion
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
    if (pipelineMode === 'anpr') return;
    const { x, y } = getCanvasCoords(e);

    // 1. Check existing fence vertices
    if (fence) {
      for (let i = 0; i < fence.length; i++) {
        if (Math.hypot(fence[i].x - x, fence[i].y - y) <= HANDLE_RADIUS + 5) {
          setDraggingHandle({ shape: 'fence', index: i });
          return;
        }
      }

      // 2. Check edge midpoints for vertex insertion!
      for (let i = 0; i < fence.length; i++) {
        const p1 = fence[i];
        const p2 = fence[(i + 1) % fence.length];
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        if (Math.hypot(mx - x, my - y) <= MIDPOINT_RADIUS + 5) {
          // Insert new vertex into fence between i and i+1
          const newPoint = { x: Math.round(x), y: Math.round(y) };
          const updated = [...fence];
          updated.splice(i + 1, 0, newPoint);
          setFence(updated);
          setDraggingHandle({ shape: 'fence', index: i + 1 });
          return;
        }
      }
    }

    // 3. Check tripwire vertices
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

  // Remove selected vertex (must maintain at least 3 vertices for polygon)
  function removeVertex(index) {
    if (fence && fence.length > 3) {
      setFence(fence.filter((_, i) => i !== index));
    }
  }

  // Resolution Decoupling: Scale coordinates from 800×450 canvas to native video (e.g. 1920×1080)
  function exportPayload() {
    const scaleX = nativeRes.width / 800;
    const scaleY = nativeRes.height / 450;
    const payload = {};

    if (pipelineMode === 'full') {
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
    }
    return payload;
  }

  // Download Audit JSON (Checklist Item 4)
  function downloadAuditReport() {
    if (!result) return;
    const auditData = {
      report_id: `IBVAP-${Date.now()}`,
      generated_at: new Date().toISOString(),
      platform: 'Intelligent Border Video Analytics Platform (SSB / MHA)',
      gateway_base_url: baseUrl,
      endpoint_called: pipelineMode === 'full' ? '/api/v1/analytics/full' : '/api/v1/analytics/anpr',
      native_resolution: nativeRes,
      parameters: {
        max_duration: maxDuration,
        night_mode: nightMode,
        enable_anpr: enableAnpr,
        pipeline_mode: pipelineMode,
      },
      telemetry: {
        total_breaches: Number(result.breaches) || 0,
        detected_plates_count: Object.keys(result.plates || {}).length,
        total_alert_incidents: result.alerts?.length || 0,
      },
      detected_plates: result.plates || {},
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

  // Download Annotated MP4 Video
  function downloadAnnotatedVideo() {
    if (!result?.videoUrl) return;
    const a = document.createElement('a');
    a.href = result.videoUrl;
    a.download = `ibvap_annotated_feed_${Date.now()}.mp4`;
    a.click();
  }

  // Copy detected plate to clipboard
  const copyPlate = (plate) => {
    navigator.clipboard?.writeText(plate);
    setCopiedPlate(plate);
    setTimeout(() => setCopiedPlate(''), 2500);
  };

  // Run Surveillance Analytics Pipeline
  async function runAnalytics(e) {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!file) {
      setError('Please select or drop a surveillance video file (.mp4, .avi, .mov) to run edge analytics.');
      return;
    }

    const form = new FormData();

    // Required Video File
    form.append('video_file', file);

    // Optional Geometries (omitted if unconfigured)
    const zones = exportPayload();
    if (zones.fence_polygon) form.append('fence_polygon', zones.fence_polygon);
    if (zones.tripwire_line) form.append('tripwire_line', zones.tripwire_line);

    // Max processing duration (capped at 60s for ultra-low latency)
    form.append('max_duration', String(Math.min(60, maxDuration)));

    const targetEndpoint = `${baseUrl}/api/v1/analytics/full`;

    setProcessing(true);

    try {
      const response = await fetch(targetEndpoint, {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        if (response.status === 502 || response.status === 524) {
          throw new Error(`HTTP ${response.status} (${response.statusText || 'Bad Gateway / Timeout'}): The backend in Kaggle took longer than Cloudflare's timeout, or Uvicorn is restarting. Try setting Max Duration to 15s or uploading a shorter clip.`);
        }
        throw new Error(`Inference pipeline returned HTTP ${response.status} (${response.statusText || 'Error'})`);
      }

      // 1. Read Security Telemetry from HTTP Response Headers
      const rawBreaches = response.headers.get('X-IBVAP-Breach-Count');
      const breaches = rawBreaches ? parseInt(rawBreaches, 10) : 0;

      let plates = {};
      try {
        const rawPlates = response.headers.get('X-IBVAP-Plates-Detected');
        if (rawPlates) plates = JSON.parse(rawPlates);
      } catch (err) {
        console.warn('Failed to parse X-IBVAP-Plates-Detected header:', err);
      }

      // Base64 decode the comprehensive incident log
      const rawBase64Alerts = response.headers.get('X-IBVAP-Alerts-JSON');
      const alerts = decodeAlertsHeader(rawBase64Alerts);

      // 2. Convert Video Stream to Blob URL for playback
      const videoBlob = await response.blob();
      const videoUrl = URL.createObjectURL(videoBlob);

      const analysis = {
        videoUrl,
        breaches,
        plates,
        alerts,
        mode: pipelineMode,
        videoMode: viewingMode,
        nativeRes,
        timestamp: new Date().toLocaleTimeString(),
      };
      setResult(analysis);
      // Publish so the homepage Dashboard can show this real detection
      // result (breach count, alerts, suspicion %) instead of a placeholder.
      saveLastAnalysis(analysis);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('502')) {
        setError(msg || 'HTTP 502 Bad Gateway: Kaggle backend timed out (>100s) or Uvicorn is still loading EasyOCR/YOLO. Please wait 30s after running the cell, set Max Duration to 15s, and try again.');
      } else {
        setError(err.message || 'Failed to communicate with the IBVAP analytics gateway.');
      }
    } finally {
      setProcessing(false);
    }
  }

  const payloadPreview = exportPayload();

  return (
    <section className="workbench section" id="workbench">
      {/* Workbench Header with Live Gateway Status Pill */}
      <div className="section-heading inline workbench-top">
        <div>
          <p className="eyebrow">Tactical Command Workspace</p>
          <h2>Calibrate perimeter. Run edge analytics.</h2>
        </div>
        <div className="gateway-status-badge">
          <span className="gateway-dot" />
          <span className="gateway-label">Gateway:</span>
          <code className="gateway-url" title={baseUrl}>
            {baseUrl.replace(/^https?:\/\//, '').split('/')[0]}
          </code>
          <Link href="/settings" className="gateway-settings-link" title="Open Settings">
            Settings ⚙
          </Link>
          <a
            href={swaggerUrl}
            target="_blank"
            rel="noreferrer"
            className="gateway-docs-link"
            title="Interactive Swagger Docs"
          >
            Docs ↗
          </a>
        </div>
      </div>

      {/* Unified Master Defense Pipeline Banner */}
      <div className="pipeline-mode-tabs" style={{ gridTemplateColumns: '1fr' }}>
        <div className="mode-tab active" style={{ cursor: 'default' }}>
          <span className="mode-icon">🛡️</span>
          <div>
            <b>Master Defense Pipeline (v2.0 Clean Edge)</b>
            <small>YOLO11n + ByteTrack Multi-Object Tracking + Spatial Fence & Tripwire Intrusion (2x Stride)</small>
          </div>
          <span className="mode-badge">POST /api/v1/analytics/full</span>
        </div>
      </div>

      <form className="workbench-grid" onSubmit={runAnalytics}>
        {/* Panel 1: Zone Calibrator Canvas */}
        <div className="calibrator panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">01 · Tactical Zone Calibration</p>
              <h3>
                {pipelineMode === 'full' ? 'Demarcate Rules of Engagement' : 'Vehicle Checkpoint Inspection'}
              </h3>
            </div>
            {pipelineMode === 'full' && (
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
            )}
          </div>

          {pipelineMode === 'full' ? (
            <>
              <div className="tool-row">
                <button
                  type="button"
                  className={tool === 'fence' ? 'tool active' : 'tool'}
                  onClick={() => setTool('fence')}
                >
                  ◈ Restricted Fence
                </button>
                <button
                  type="button"
                  className={tool === 'tripwire' ? 'tool active' : 'tool'}
                  onClick={() => setTool('tripwire')}
                >
                  ⌁ Demarcation Tripwire
                </button>

                {tool === 'fence' && (
                  <button
                    type="button"
                    className="tool preset"
                    onClick={() => setFence(INITIAL_FENCE)}
                  >
                    + Add Preset Fence
                  </button>
                )}

                {tool === 'tripwire' && (
                  <>
                    <button
                      type="button"
                      className="tool preset"
                      onClick={() => setTripwire(INITIAL_TRIPWIRE)}
                    >
                      + Add Preset Tripwire
                    </button>
                    {tripwire && (
                      <button
                        type="button"
                        className="tool"
                        onClick={() => setTripwireFlipped(!tripwireFlipped)}
                        title="Reverse Crossing Arrow Direction"
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
                  className={`viewing-mode-${viewingMode}`}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                />
                {!file && (
                  <div className="viewing-mode-placeholder">
                    <b>{viewingMode === 'rgb' ? 'RGB MODE' : `${viewingMode.toUpperCase()} MODE`}</b>
                    <span>No {viewingMode === 'rgb' ? 'RGB' : viewingMode} footage loaded.</span>
                  </div>
                )}
                <div className="frame-meta">
                  <span className="frame-label">
                    NATIVE RESOLUTION: {nativeRes.width} × {nativeRes.height} · CANVAS: 800 × 450
                  </span>
                  {file && <span className="frame-file-tag">● Source Frame Extracted</span>}
                </div>
              </div>

              <div className="viewing-mode-bar">
                <span className="viewing-mode-label">Viewing Mode</span>
                <div className="viewing-mode-tabs">
                  <button
                    type="button"
                    className={viewingMode === 'thermal' ? 'active' : ''}
                    onClick={() => setViewingMode('thermal')}
                  >
                    Thermal
                  </button>
                  <button
                    type="button"
                    className={viewingMode === 'lowlight' ? 'active' : ''}
                    onClick={() => setViewingMode('lowlight')}
                  >
                    Low-light
                  </button>
                  <button
                    type="button"
                    className={viewingMode === 'rgb' ? 'active' : ''}
                    onClick={() => setViewingMode('rgb')}
                  >
                    RGB (reference)
                  </button>
                </div>
              </div>

              {/* Instructions & Coordinate Payload Preview */}
              <div className="zone-helper-bar">
                <span>
                  💡 <b>Pro Tip:</b> Drag any vertex handle. Click the <b>&quot;+&quot; handle</b> on any polygon edge to insert new vertices for complex perimeters.
                </span>
              </div>

              <div className="zone-readout">
                {fence || tripwire ? (
                  <>
                    <div className="readout-header">
                      <span>Decoupled API Payload (Scaled to {nativeRes.width}×{nativeRes.height}):</span>
                      {fence && (
                        <button
                          type="button"
                          className="remove-vert-btn"
                          onClick={() => removeVertex(fence.length - 1)}
                          disabled={fence.length <= 3}
                          title="Remove last vertex (min 3)"
                        >
                          Remove Last Vertex ({fence.length} pts)
                        </button>
                      )}
                    </div>
                    <code>{JSON.stringify(payloadPreview, null, 2)}</code>
                  </>
                ) : (
                  <span>
                    No zones placed. Click <b>&quot;+ Add Preset Fence&quot;</b> or <b>&quot;+ Add Preset Tripwire&quot;</b> above to deploy tactical rules.
                  </span>
                )}
              </div>
            </>
          ) : (
            /* Dedicated ANPR Mode Explanatory Panel */
            <div className="anpr-mode-info">
              <div className="calibration-frame">
                <canvas ref={canvasRef} width="800" height="450" className={`viewing-mode-${viewingMode}`} />
                <span className="frame-label">
                  CHECKPOINT MODE · 100% OCR FOCUS · NATIVE: {nativeRes.width} × {nativeRes.height}
                </span>
              </div>
              <div className="anpr-info-card">
                <h4>Checkpoint Optimization Active</h4>
                <p>
                  Perimeter fence and tripwire geometries are automatically bypassed. The inference engine devotes full GPU resources to vehicle detection, tracking, and optical character recognition on license plates.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Panel 2: Video Source & Analytics Execution */}
        <div className="analysis panel">
          <p className="eyebrow">02 · Surveillance Feed Input</p>
          <h3>Run Neural Inference</h3>

          <label className="source-drop">
            {file ? (
              <div className="drop-file-info">
                <b>✓ {file.name}</b>
                <small>
                  {(file.size / 1024 / 1024).toFixed(1)} MB · {nativeRes.width}×{nativeRes.height} native · Ready
                </small>
              </div>
            ) : (
              <>
                <b>Drop a Surveillance Video File</b>
                <small>MP4, AVI or MOV · Direct Video Ingestion</small>
              </>
            )}
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          <label className="range-label">
            <span>Max Analysis Duration (15–30s optimal)</span>
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

          {error && <div className="error-message">⚠️ {error}</div>}

          {/* Tactical Progress Loader (Checklist Item 2) */}
          {processing ? (
            <div className="tactical-loader">
              <div className="loader-top">
                <div className="radar-sweep" />
                <div>
                  <b className="loader-phase">{progressPhase}</b>
                  <div className="loader-sub">Elapsed: {elapsedSec}s · Processing at Edge</div>
                </div>
              </div>
              <div className="loader-bar">
                <div
                  className="loader-fill"
                  style={{ width: `${Math.min(95, elapsedSec * 5)}%` }}
                />
              </div>
            </div>
          ) : (
            <button className="button dark run-button" type="submit">
              <span>Run {pipelineMode === 'full' ? 'Master Border Pipeline' : 'Checkpoint ANPR'}</span>
              <b>↗</b>
            </button>
          )}

          <div className="settings-link-prompt">
            Need to change backend endpoint?{' '}
            <Link href="/settings">Configure in Settings →</Link>
          </div>
        </div>
      </form>

      {/* Panel 3: Results & Security Telemetry Display */}
      {result && (
        <div className="results panel">
          <div className="results-head">
            <div>
              <p className="eyebrow">03 · Intelligence & Defense Telemetry</p>
              <h3>Annotated Surveillance Feed · {result.timestamp}</h3>
            </div>
            <div className="result-actions">
              <div className="breach-pill">
                <b>{result.breaches}</b>
                <small>Breaches Detected</small>
              </div>
              <button
                type="button"
                className="button outline"
                onClick={downloadAnnotatedVideo}
                title="Download Annotated MP4"
              >
                Download MP4 ↧
              </button>
              <button
                type="button"
                className="button light"
                onClick={downloadAuditReport}
                title="Download chain-of-custody incident_report.json"
              >
                Download Audit JSON ↧
              </button>
            </div>
          </div>

          {/* Mounted Binary MP4 Stream */}
          <div className="result-video-container">
            <video
              className="result-video"
              controls
              autoPlay
              src={result.videoUrl}
            />
            <div className="video-stream-badge">
              ● Annotated H.264 Binary Stream · Mounted
            </div>
          </div>

          {/* Plates & Incident Log Grid */}
          <div className="result-grid">
            {/* Detected License Plates Table (Checklist Item 3) */}
            <div className="result-subpanel">
              <div className="subpanel-head">
                <p className="eyebrow">Vehicle License Plates (X-IBVAP-Plates-Detected)</p>
                <span className="count-tag">
                  {Object.keys(result.plates).length} Identified
                </span>
              </div>

              {Object.keys(result.plates).length > 0 ? (
                <div className="plates-grid">
                  {Object.entries(result.plates).map(([trackId, plate]) => (
                    <div className="plate-badge" key={trackId}>
                      <div className="plate-track">
                        Track ID <b>#{trackId}</b>
                      </div>
                      <div className="plate-box">
                        <span className="plate-ind">IND</span>
                        <span className="plate-text">{plate}</span>
                      </div>
                      <button
                        type="button"
                        className="plate-copy"
                        onClick={() => copyPlate(plate)}
                        title="Copy Plate Number"
                      >
                        {copiedPlate === plate ? 'Copied ✓' : 'Copy'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">
                  No vehicle license plates recognized in this surveillance sequence.
                </p>
              )}
            </div>

            {/* Decoded Incident Alerts Log */}
            <div className="result-subpanel">
              <div className="subpanel-head">
                <p className="eyebrow">Incident Timeline (X-IBVAP-Alerts-JSON)</p>
                <span className="count-tag">
                  {result.alerts?.length || 0} Events
                </span>
              </div>

              {result.alerts && result.alerts.length > 0 ? (
                <div className="alerts-timeline">
                  {result.alerts.map((alert, i) => (
                    <div className="alert-card" key={i}>
                      <div className="alert-meta">
                        <span className={`alert-type ${(alert.type || '').includes('breach') ? 'danger' : 'warning'}`}>
                          {alert.type ? alert.type.replace(/_/g, ' ') : 'Perimeter Alert'}
                        </span>
                        <small className="alert-time">
                          {alert.timestamp || `Frame ${alert.frame || i}`}
                        </small>
                      </div>
                      <p className="alert-msg">
                        {alert.message || `Track #${alert.track_id || alert.id || 'N/A'} triggered perimeter crossing rule.`}
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
                  No breach or tripwire incidents reported. Perimeter is secure.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
