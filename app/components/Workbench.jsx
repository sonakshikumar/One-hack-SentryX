'use client';

<<<<<<< HEAD
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useApiConfig, decodeAlertsHeader } from '../lib/apiConfig';
import { saveLastAnalysis } from '../lib/liveFeed';
=======
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useApiConfig, decodeAlertsHeader } from '../lib/apiConfig';
import { saveLastAnalysis } from '../lib/liveFeed';
import { loadSurveillanceConfig, CONFIG_EVENT } from '../lib/surveillanceConfig';
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98

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
<<<<<<< HEAD

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
=======
const SUPPORTED_OBJECT_CLASSES = ['person', 'car', 'truck', 'bus', 'motorcycle', 'bicycle'];
const ANALYSIS_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_AI_ANALYSIS_TIMEOUT_MS || 10 * 60 * 1000);

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
  const [fenceClosed, setFenceClosed] = useState(false);
  const [tripwire, setTripwire] = useState(null);
  const [tripwireFlipped, setTripwireFlipped] = useState(false);
  const [draggingHandle, setDraggingHandle] = useState(null);

  const [maxDuration, setMaxDuration] = useState(15);

  const [processing, setProcessing] = useState(false);
  const [progressPhase, setProgressPhase] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const canvasPointToNative = useCallback((point) => ({
    x: Math.round(point.x * nativeRes.width / 800),
    y: Math.round(point.y * nativeRes.height / 450)
  }), [nativeRes]);

  const nativePointToCanvas = useCallback((point) => ({
    x: point.x * 800 / nativeRes.width,
    y: point.y * 450 / nativeRes.height
  }), [nativeRes]);

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

>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
  useEffect(() => {
    if (!file) {
      setFramePreviewUrl('');
      setNativeRes(DEFAULT_NATIVE_VIDEO);
<<<<<<< HEAD
=======
      setDurationSec(null);
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
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
<<<<<<< HEAD
=======
      if (Number.isFinite(video.duration)) setDurationSec(video.duration);
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
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

<<<<<<< HEAD
  // Phased tactical progress timer
  useEffect(() => {
    if (!processing) {
      setElapsedSec(0);
=======
  useEffect(() => {
    if (!processing) {
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
      setProgressPhase('');
      return;
    }

<<<<<<< HEAD
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
=======
    setProgressPhase('Analysis request sent to the inference service…');
  }, [processing]);

>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = (imgElement) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

<<<<<<< HEAD
      // 1. Render Video Backdrop
=======
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

>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
      if (imgElement && imgElement.complete && imgElement.naturalWidth !== 0) {
        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = '#16232b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

<<<<<<< HEAD
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
=======
      ctx.fillStyle = 'rgba(12, 25, 33, 0.22)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const canvasFence = fence?.map(nativePointToCanvas) || [];
      if (canvasFence.length > 0) {
        ctx.beginPath();
        ctx.moveTo(canvasFence[0].x, canvasFence[0].y);
        for (let i = 1; i < canvasFence.length; i++) {
          ctx.lineTo(canvasFence[i].x, canvasFence[i].y);
        }
        if (fenceClosed && canvasFence.length >= 3) {
          ctx.closePath();
          ctx.fillStyle = 'rgba(255, 0, 50, 0.25)';
          ctx.fill();
        }
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
        ctx.strokeStyle = '#ff0033';
        ctx.lineWidth = 2;
        ctx.stroke();

<<<<<<< HEAD
        // Draggable Vertex Handles
        fence.forEach((pt, i) => {
=======
        canvasFence.forEach((pt, i) => {
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, HANDLE_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = '#ff0033';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
<<<<<<< HEAD

          // Vertex label
=======
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px Inter';
          ctx.fillText(String(i + 1), pt.x - 3, pt.y + 3);
        });

<<<<<<< HEAD
        // Edge Midpoint Insertion Handles ("+")
        for (let i = 0; i < fence.length; i++) {
          const p1 = fence[i];
          const p2 = fence[(i + 1) % fence.length];
=======
        const edgeCount = fenceClosed ? canvasFence.length : canvasFence.length - 1;
        for (let i = 0; i < edgeCount; i++) {
          const p1 = canvasFence[i];
          const p2 = canvasFence[(i + 1) % canvasFence.length];
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
          const mx = (p1.x + p2.x) / 2;
          const my = (p1.y + p2.y) / 2;

          ctx.beginPath();
          ctx.arc(mx, my, MIDPOINT_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = '#22272b';
          ctx.fill();
          ctx.strokeStyle = '#00ffc8';
          ctx.lineWidth = 1.5;
          ctx.stroke();

<<<<<<< HEAD
          // Draw "+" sign
=======
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
          ctx.strokeStyle = '#00ffc8';
          ctx.beginPath();
          ctx.moveTo(mx - 3, my);
          ctx.lineTo(mx + 3, my);
          ctx.moveTo(mx, my - 3);
          ctx.lineTo(mx, my + 3);
          ctx.stroke();
        }
      }

<<<<<<< HEAD
      // 3. Render Tripwire (Yellow Directional Line)
      if (tripwire && tripwire.length === 2) {
        const [p1, p2] = tripwire;
=======
      if (tripwire && tripwire.length > 0) {
        const canvasTripwire = tripwire.map(nativePointToCanvas);
        const [p1, p2] = canvasTripwire;
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
        if (p2) {
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = '#ffea00';
        ctx.lineWidth = 3;
        ctx.stroke();

<<<<<<< HEAD
        // Directional arrow perpendicular to the line
=======
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
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

<<<<<<< HEAD
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
=======
          drawTripHandle(p1, 'A');
          if (p2) drawTripHandle(p2, 'B');
        } else {
          drawTripHandle(p1, 'A');
        }
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
      }
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
<<<<<<< HEAD
    img.src = framePreviewUrl || defaultBackground;
    img.onload = () => render(img);
    if (img.complete) render(img);
  }, [fence, tripwire, tripwireFlipped, framePreviewUrl, defaultBackground, pipelineMode]);
=======
    if (file && framePreviewUrl) {
      img.src = framePreviewUrl;
      img.onload = () => render(img);
      if (img.complete) render(img);
    } else {
      render(null);
    }
  }, [fence, fenceClosed, tripwire, tripwireFlipped, framePreviewUrl, file, videoMode, nativePointToCanvas]);
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

<<<<<<< HEAD
  // Pointer & Dragging Events with Midpoint Insertion
=======
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
  function getCanvasCoords(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 450 / rect.height;
    return {
      x: Math.max(0, Math.min(800, (e.clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(450, (e.clientY - rect.top) * scaleY)),
    };
  }

<<<<<<< HEAD
  function handlePointerDown(e) {
    if (pipelineMode === 'anpr') return;
    const { x, y } = getCanvasCoords(e);

    // 1. Check existing fence vertices
    if (fence) {
      for (let i = 0; i < fence.length; i++) {
        if (Math.hypot(fence[i].x - x, fence[i].y - y) <= HANDLE_RADIUS + 5) {
=======
  function getNativeCoords(e) {
    return canvasPointToNative(getCanvasCoords(e));
  }

  function handlePointerDown(e) {
    const { x, y } = getCanvasCoords(e);
    e.currentTarget.setPointerCapture?.(e.pointerId);

    if (tool === 'fence' && !fence) {
      setFence([getNativeCoords(e)]);
      setFenceClosed(false);
      return;
    }

    if (tool === 'fence' && fence) {
      const canvasFence = fence.map(nativePointToCanvas);
      for (let i = 0; i < canvasFence.length; i++) {
        if (Math.hypot(canvasFence[i].x - x, canvasFence[i].y - y) <= HANDLE_RADIUS + 5) {
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
          setDraggingHandle({ shape: 'fence', index: i });
          return;
        }
      }

<<<<<<< HEAD
      // 2. Check edge midpoints for vertex insertion!
      for (let i = 0; i < fence.length; i++) {
        const p1 = fence[i];
        const p2 = fence[(i + 1) % fence.length];
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        if (Math.hypot(mx - x, my - y) <= MIDPOINT_RADIUS + 5) {
          // Insert new vertex into fence between i and i+1
          const newPoint = { x: Math.round(x), y: Math.round(y) };
=======
      const edgeCount = fenceClosed ? canvasFence.length : canvasFence.length - 1;
      for (let i = 0; i < edgeCount; i++) {
        const p1 = canvasFence[i];
        const p2 = canvasFence[(i + 1) % canvasFence.length];
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        if (Math.hypot(mx - x, my - y) <= MIDPOINT_RADIUS + 5) {
          const newPoint = getNativeCoords(e);
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
          const updated = [...fence];
          updated.splice(i + 1, 0, newPoint);
          setFence(updated);
          setDraggingHandle({ shape: 'fence', index: i + 1 });
          return;
        }
      }
<<<<<<< HEAD
    }

    // 3. Check tripwire vertices
    if (tripwire) {
      for (let i = 0; i < tripwire.length; i++) {
        if (Math.hypot(tripwire[i].x - x, tripwire[i].y - y) <= HANDLE_RADIUS + 5) {
=======

      if (!fenceClosed) {
        setFence((points) => [...(points || []), getNativeCoords(e)]);
        return;
      }
    }

    if (tool === 'tripwire' && !tripwire) {
      setTripwire([getNativeCoords(e)]);
      return;
    }

    if (tool === 'tripwire' && tripwire) {
      const canvasTripwire = tripwire.map(nativePointToCanvas);
      for (let i = 0; i < canvasTripwire.length; i++) {
        if (Math.hypot(canvasTripwire[i].x - x, canvasTripwire[i].y - y) <= HANDLE_RADIUS + 5) {
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
          setDraggingHandle({ shape: 'tripwire', index: i });
          return;
        }
      }
<<<<<<< HEAD
=======
      if (tripwire.length < 2) {
        setTripwire((points) => [...(points || []), getNativeCoords(e)]);
      }
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
    }
  }

  function handlePointerMove(e) {
    if (!draggingHandle) return;
<<<<<<< HEAD
    const { x, y } = getCanvasCoords(e);

    if (draggingHandle.shape === 'fence') {
      setFence((points) => points?.map((p, i) => (i === draggingHandle.index ? { x, y } : p)));
    } else if (draggingHandle.shape === 'tripwire') {
      setTripwire((points) => points?.map((p, i) => (i === draggingHandle.index ? { x, y } : p)));
=======
    const point = getNativeCoords(e);

    if (draggingHandle.shape === 'fence') {
      setFence((points) => points?.map((p, i) => (i === draggingHandle.index ? point : p)));
    } else if (draggingHandle.shape === 'tripwire') {
      setTripwire((points) => points?.map((p, i) => (i === draggingHandle.index ? point : p)));
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
    }
  }

  function handlePointerUp() {
    setDraggingHandle(null);
  }

<<<<<<< HEAD
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
=======
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
    } else if (fence && fence.length > 1) {
      setFence(fence.filter((_, i) => i !== index));
      setFenceClosed(false);
    }
  }

  function exportPayload() {
    const payload = {};

    if (fence && fenceClosed && fence.length >= 3) {
      payload.fence_polygon = JSON.stringify(fence.map((pt) => [pt.x, pt.y]));
    }
    if (tripwire && tripwire.length === 2) {
      payload.tripwire_line = JSON.stringify(tripwire.map((pt) => [pt.x, pt.y]));
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
    }
    return payload;
  }

<<<<<<< HEAD
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
=======
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
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
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

<<<<<<< HEAD
  // Download Annotated MP4 Video
=======
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
  function downloadAnnotatedVideo() {
    if (!result?.videoUrl) return;
    const a = document.createElement('a');
    a.href = result.videoUrl;
<<<<<<< HEAD
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
=======
    a.download = `sentryx_annotated_${Date.now()}.mp4`;
    a.click();
  }

>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
  async function runAnalytics(e) {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!file) {
<<<<<<< HEAD
      setError('Please select or drop a surveillance video file (.mp4, .avi, .mov) to run edge analytics.');
=======
      setError('Upload a drone video file (.mp4, .avi, .mov) before running analysis.');
      return;
    }
    if (!baseUrl) {
      setError('AI engine is offline. Set NEXT_PUBLIC_AI_SERVICE_URL and restart the app.');
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
      return;
    }

    const form = new FormData();
<<<<<<< HEAD

    // Required Video File
    form.append('video_file', file);

    // Optional Geometries (omitted if unconfigured)
=======
    form.append('video_file', file);

>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
    const zones = exportPayload();
    if (zones.fence_polygon) form.append('fence_polygon', zones.fence_polygon);
    if (zones.tripwire_line) form.append('tripwire_line', zones.tripwire_line);

<<<<<<< HEAD
    // Max processing duration (capped at 60s for ultra-low latency)
    form.append('max_duration', String(Math.min(60, maxDuration)));

    const targetEndpoint = `${baseUrl}/api/v1/analytics/full`;

=======
    form.append('max_duration', String(Math.min(60, maxDuration)));
    form.append('enabled_classes', JSON.stringify(SUPPORTED_OBJECT_CLASSES));
    form.append('video_mode', videoMode === 'lowlight' ? 'low-light' : videoMode);
    if (videoMode !== 'rgb') form.append('night_mode', 'true');

    const targetEndpoint = `${baseUrl}/api/v1/analytics/full`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
    setProcessing(true);

    try {
      const response = await fetch(targetEndpoint, {
        method: 'POST',
        body: form,
<<<<<<< HEAD
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
=======
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const contentType = response.headers.get('content-type') || '(missing)';

      if (!response.ok) {
        const responseText = (await response.text()).slice(0, 2000) || '(empty response)';
        const error = new Error(`AI request failed: HTTP ${response.status} ${response.statusText || ''}; content-type=${contentType}; response=${responseText}`);
        error.code = 'HTTP_ERROR';
        throw error;
      }

      if (!contentType.toLowerCase().includes('video/mp4')) {
        const responseText = (await response.text()).slice(0, 2000) || '(empty response)';
        throw new Error(`AI request returned an unexpected content type: ${contentType}; response=${responseText}`);
      }

      const rawBreaches = response.headers.get('X-SentryX-Breach-Count');
      const breaches = rawBreaches ? parseInt(rawBreaches, 10) : 0;
      const rawBase64Alerts = response.headers.get('X-SentryX-Alerts-JSON');
      const alerts = decodeAlertsHeader(rawBase64Alerts);

>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
      const videoBlob = await response.blob();
      const videoUrl = URL.createObjectURL(videoBlob);

      const analysis = {
        videoUrl,
        breaches,
<<<<<<< HEAD
        plates,
        alerts,
        mode: pipelineMode,
        videoMode: viewingMode,
=======
        alerts,
        videoMode,
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
        nativeRes,
        timestamp: new Date().toLocaleTimeString(),
      };
      setResult(analysis);
<<<<<<< HEAD
      // Publish so the homepage Dashboard can show this real detection
      // result (breach count, alerts, suspicion %) instead of a placeholder.
      saveLastAnalysis(analysis);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('502')) {
        setError(msg || 'HTTP 502 Bad Gateway: Kaggle backend timed out (>100s) or Uvicorn is still loading EasyOCR/YOLO. Please wait 30s after running the cell, set Max Duration to 15s, and try again.');
      } else {
        setError(err.message || 'Failed to communicate with the IBVAP analytics gateway.');
=======
      saveLastAnalysis(analysis);
    } catch (err) {
      clearTimeout(timeoutId);
      const msg = err.message || '';
      if (err.name === 'AbortError') {
        setError(`AI analysis timed out after ${Math.round(ANALYSIS_TIMEOUT_MS / 60000)} minutes. The 4K upload or inference may still be processing; try a shorter clip if the service did not complete.`);
      } else if (err.code === 'HTTP_ERROR') {
        setError(msg);
      } else if (err.name === 'TypeError' || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setError(`AI request could not be completed: network or CORS failure. URL: ${targetEndpoint}. Browser error: ${msg || 'Failed to fetch'}`);
      } else {
        setError(`AI analysis failed for ${targetEndpoint}: ${msg || 'Unknown client error'}`);
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
      }
    } finally {
      setProcessing(false);
    }
  }

  const payloadPreview = exportPayload();

  return (
    <section className="workbench section" id="workbench">
<<<<<<< HEAD
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
=======
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
                  setFenceClosed(false);
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
                onClick={() => { setFence(INITIAL_FENCE.map(canvasPointToNative)); setFenceClosed(true); }}
              >
                + Add preset zone
              </button>
            )}

            {tool === 'tripwire' && (
              <>
                <button
                  type="button"
                  className="tool preset"
                  onClick={() => setTripwire(INITIAL_TRIPWIRE.map(canvasPointToNative))}
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
              className={draggingHandle ? 'drawing-canvas is-dragging' : 'drawing-canvas'}
              width="800"
              height="450"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
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
                    <div className="geometry-actions">
                      {!fenceClosed && fence.length >= 3 && <button type="button" className="remove-vert-btn" onClick={() => setFenceClosed(true)}>Close restricted zone</button>}
                      {fenceClosed && <span className="zone-active-tag">ZONE ACTIVE</span>}
                      <button type="button" className="remove-vert-btn" onClick={() => removeVertex(fence.length - 1)} disabled={fence.length <= 1}>Remove last vertex ({fence.length} pts)</button>
                    </div>
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
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
<<<<<<< HEAD
          </label>

          <label className="range-label">
            <span>Max Analysis Duration (15–30s optimal)</span>
=======
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
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
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
<<<<<<< HEAD

          {error && <div className="error-message">⚠️ {error}</div>}

          {/* Tactical Progress Loader (Checklist Item 2) */}
=======
          </div>

          <div className="workbench-subsection pipeline-status">
            <p className="eyebrow">Pipeline</p>
            <div><span>Detection</span><b>Configured object classes</b></div>
            <div><span>Tracking</span><b>ByteTrack</b></div>
            <div><span>Behavior</span><b>Awaiting inference</b></div>
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}

>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
          {processing ? (
            <div className="tactical-loader">
              <div className="loader-top">
                <div className="radar-sweep" />
                <div>
<<<<<<< HEAD
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
=======
                  <b className="loader-phase">ANALYZING FOOTAGE…</b>
                  <div className="loader-sub">{progressPhase}</div>
                </div>
              </div>
              <div className="loader-steps"><span>Uploading video ✓</span><span>Inference request active</span><span>Results pending</span></div>
            </div>
          ) : (
            <button className="button dark run-button" type="submit" disabled={!file || !baseUrl}>
              <span>Run AI Analysis</span>
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
              <b>↗</b>
            </button>
          )}

<<<<<<< HEAD
          <div className="settings-link-prompt">
            Need to change backend endpoint?{' '}
            <Link href="/settings">Configure in Settings →</Link>
=======
          {!baseUrl && <div className="engine-notice"><b>AI ENGINE NOT CONNECTED</b><span>Analysis requires the SentryX inference service.</span><Link href="/settings">Open Settings →</Link></div>}

          <div className="settings-link-prompt">
            Detection / behavior thresholds live in{' '}
            <Link href="/settings">Settings →</Link>
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
          </div>
        </div>
      </form>

<<<<<<< HEAD
      {/* Panel 3: Results & Security Telemetry Display */}
=======
      {!result && !processing && (
        <div className="results empty-results panel">
          <p className="eyebrow">Analysis results</p>
          <h3>No analysis has been run.</h3>
          <p className="muted">Run a connected analysis to view detections, tracks, movement events, and perimeter alerts.</p>
        </div>
      )}

>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
      {result && (
        <div className="results panel">
          <div className="results-head">
            <div>
<<<<<<< HEAD
              <p className="eyebrow">03 · Intelligence & Defense Telemetry</p>
              <h3>Annotated Surveillance Feed · {result.timestamp}</h3>
=======
              <p className="eyebrow">05–07 · Detection, movement, alerts</p>
              <h3>Annotated feed · {result.timestamp}</h3>
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
            </div>
            <div className="result-actions">
              <div className="breach-pill">
                <b>{result.breaches}</b>
<<<<<<< HEAD
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
=======
                <small>Perimeter events</small>
              </div>
              <button type="button" className="button outline" onClick={downloadAnnotatedVideo}>
                Download MP4 ↧
              </button>
              <button type="button" className="button light" onClick={downloadAuditReport}>
                Download JSON ↧
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
              </button>
            </div>
          </div>

<<<<<<< HEAD
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
=======
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
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
              </div>

              {result.alerts && result.alerts.length > 0 ? (
                <div className="alerts-timeline">
                  {result.alerts.map((alert, i) => (
                    <div className="alert-card" key={i}>
                      <div className="alert-meta">
<<<<<<< HEAD
                        <span className={`alert-type ${(alert.type || '').includes('breach') ? 'danger' : 'warning'}`}>
                          {alert.type ? alert.type.replace(/_/g, ' ') : 'Perimeter Alert'}
=======
                        <span className={`alert-type ${alert.type === 'breach' ? 'danger' : 'warning'}`}>
                          {alert.type || 'Perimeter event'}
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
                        </span>
                        <small className="alert-time">
                          {alert.timestamp || `Frame ${alert.frame || i}`}
                        </small>
                      </div>
                      <p className="alert-msg">
<<<<<<< HEAD
                        {alert.message || `Track #${alert.track_id || alert.id || 'N/A'} triggered perimeter crossing rule.`}
=======
                        {alert.message || `Track #${alert.track_id || alert.id || 'N/A'} triggered a perimeter rule. Review zone context and track history.`}
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
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
<<<<<<< HEAD
                  No breach or tripwire incidents reported. Perimeter is secure.
=======
                  No perimeter events in the decoded alert list. Check the annotated video for tracks.
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
