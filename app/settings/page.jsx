'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { checkApiHealth, getApiBaseUrl } from '../lib/apiConfig';
import { DEFAULT_SURVEILLANCE_CONFIG, loadSurveillanceConfig, saveSurveillanceConfig } from '../lib/surveillanceConfig';

export default function SettingsPage() {
  const [config, setConfig] = useState(DEFAULT_SURVEILLANCE_CONFIG);
  const [presetSaved, setPresetSaved] = useState(false);
  const [engine, setEngine] = useState({ ok: false, message: 'Not connected' });

  useEffect(() => {
    setConfig(loadSurveillanceConfig());
    const url = getApiBaseUrl();
    if (!url) {
      setEngine({ ok: false, message: 'Offline' });
      return;
    }
    checkApiHealth(url).then((r) => setEngine({ ok: r.ok, message: r.ok ? 'Connected' : 'Offline' }));
  }, []);

  const update = (key, value) => setConfig((c) => ({ ...c, [key]: value }));

  const handleSave = () => {
    saveSurveillanceConfig(config);
    setPresetSaved(true);
    setTimeout(() => setPresetSaved(false), 3000);
  };

  return (
    <div className="page settings-page">
      <section className="section">
        <div className="settings-header">
          <div>
            <div className="breadcrumbs">
              <span>SentryX</span>
              <span>/</span>
              <span>Settings</span>
            </div>
            <p className="eyebrow">Configuration</p>
            <h1>SentryX AI Surveillance Settings</h1>
            <p className="lead">
              Video, perimeter, detection, behavior, alerts, and models. Saved in this browser until a database is connected.
            </p>
          </div>
        </div>

        <div className="settings-grid">
          <div className="panel settings-card">
            <div className="card-top">
              <div>
                <p className="eyebrow">01 · Video Input</p>
                <h3>Drone feed source &amp; mode</h3>
              </div>
            </div>
            <div className="presets-form">
              <label className="input-group">
                <span className="input-label">Source</span>
                <select className="text-input" value={config.inputSource} onChange={(e) => update('inputSource', e.target.value)}>
                  <option value="upload">Uploaded video</option>
                  <option value="drone">Drone feed</option>
                </select>
              </label>
              <label className="input-group">
                <span className="input-label">Video mode</span>
                <select className="text-input" value={config.videoMode} onChange={(e) => update('videoMode', e.target.value)}>
                  <option value="thermal">Thermal</option>
                  <option value="lowlight">Low-light</option>
                  <option value="rgb">RGB (optional reference)</option>
                </select>
              </label>
              <label className="range-label">
                <span>Maximum analysis duration</span>
                <output>{config.maxDuration}s</output>
                <input type="range" min="5" max="60" step="5" value={config.maxDuration} onChange={(e) => update('maxDuration', Number(e.target.value))} />
              </label>
            </div>
          </div>

          <div className="panel settings-card">
            <div className="card-top">
              <div>
                <p className="eyebrow">02 · Perimeter Configuration</p>
                <h3>Restricted zones &amp; tripwires</h3>
              </div>
            </div>
            <p className="card-desc">Geometry is drawn on Drone Surveillance. Sensitivity applies to later scoring.</p>
            <div className="presets-form">
              <label className="input-group">
                <span className="input-label">Zone sensitivity</span>
                <select className="text-input" value={config.zoneSensitivity} onChange={(e) => update('zoneSensitivity', e.target.value)}>
                  <option value="low">Low</option>
                  <option value="standard">Standard</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>
          </div>

          <div className="panel settings-card">
            <div className="card-top">
              <div>
                <p className="eyebrow">03 · Detection Settings</p>
                <h3>Confidence &amp; classes</h3>
              </div>
            </div>
            <div className="presets-form">
              <label className="range-label">
                <span>Confidence threshold</span>
                <output>{Number(config.confThreshold).toFixed(2)}</output>
                <input type="range" min="0.1" max="0.9" step="0.05" value={config.confThreshold} onChange={(e) => update('confThreshold', Number(e.target.value))} />
              </label>
              <label className="input-group">
                <span className="input-label">Detection class</span>
                <select className="text-input" value={config.detectionClass} onChange={(e) => update('detectionClass', e.target.value)}>
                  <option value="person">Person</option>
                </select>
              </label>
            </div>
          </div>

          <div className="panel settings-card">
            <div className="card-top">
              <div>
                <p className="eyebrow">04 · Behavior Settings</p>
                <h3>Motion thresholds</h3>
              </div>
            </div>
            <div className="presets-form">
              <label className="range-label">
                <span>Dwell threshold (seconds)</span>
                <output>{config.dwellThreshold}s</output>
                <input type="range" min="2" max="30" step="1" value={config.dwellThreshold} onChange={(e) => update('dwellThreshold', Number(e.target.value))} />
              </label>
              <label className="range-label">
                <span>Low-speed threshold (m/s)</span>
                <output>{Number(config.speedThreshold).toFixed(1)}</output>
                <input type="range" min="0.2" max="3" step="0.1" value={config.speedThreshold} onChange={(e) => update('speedThreshold', Number(e.target.value))} />
              </label>
              <label className="range-label">
                <span>Boundary approach (px, canvas)</span>
                <output>{config.approachThreshold}</output>
                <input type="range" min="4" max="40" step="1" value={config.approachThreshold} onChange={(e) => update('approachThreshold', Number(e.target.value))} />
              </label>
            </div>
          </div>

          <div className="panel settings-card">
            <div className="card-top">
              <div>
                <p className="eyebrow">05 · Alert Settings</p>
                <h3>Risk threshold &amp; severity</h3>
              </div>
            </div>
            <div className="presets-form">
              <label className="range-label">
                <span>Risk threshold</span>
                <output>{config.riskThreshold}</output>
                <input type="range" min="10" max="95" step="5" value={config.riskThreshold} onChange={(e) => update('riskThreshold', Number(e.target.value))} />
              </label>
              <label className="input-group">
                <span className="input-label">Minimum alert severity</span>
                <select className="text-input" value={config.alertSeverity} onChange={(e) => update('alertSeverity', e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>
          </div>

          <div className="panel settings-card">
            <div className="card-top">
              <div>
                <p className="eyebrow">06 · Model</p>
                <h3>Detection, tracking, behavior</h3>
              </div>
            </div>
            <div className="presets-form">
              <label className="input-group">
                <span className="input-label">Detection model</span>
                <select className="text-input" value={config.detectionModel} onChange={(e) => update('detectionModel', e.target.value)}>
                  <option value="thermal-person-v1">Thermal Person Detector</option>
                  <option value="yolo11n">YOLO11n (person)</option>
                </select>
              </label>
              <label className="input-group">
                <span className="input-label">Tracking model</span>
                <select className="text-input" value={config.trackingModel} onChange={(e) => update('trackingModel', e.target.value)}>
                  <option value="bytetrack">ByteTrack</option>
                </select>
              </label>
              <label className="input-group">
                <span className="input-label">Behavior model</span>
                <select className="text-input" value={config.behaviorModel} onChange={(e) => update('behaviorModel', e.target.value)}>
                  <option value="behavior-v0.1">Behavior Classifier v0.1</option>
                </select>
              </label>
              <label className="input-group">
                <span className="input-label">Model version</span>
                <input className="text-input font-mono" value={config.modelVersion} onChange={(e) => update('modelVersion', e.target.value)} />
              </label>
            </div>
          </div>

          <div className="panel settings-card">
            <div className="card-top">
              <div>
                <p className="eyebrow">AI inference engine</p>
                <h3>SentryX Vision</h3>
              </div>
              <span className={`status-pill ${engine.ok ? 'active' : 'error'}`}>
                <span className="dot" />
                {engine.ok ? 'Connected' : engine.message}
              </span>
            </div>
            <div className="kv-grid">
              <div><span>Engine</span><b>SentryX Vision</b></div>
              <div><span>Version</span><b>0.1.0</b></div>
              <div><span>Mode</span><b>GPU inference</b></div>
              <div><span>Status</span><b>{engine.ok ? 'Connected' : 'Offline'}</b></div>
            </div>
            <p className="card-desc">The service URL is read from the environment. It is not shown in the operator UI.</p>
          </div>
        </div>

        <div className="btn-row" style={{ marginTop: '18px' }}>
          <button type="button" onClick={handleSave} className="button dark">Save surveillance settings</button>
          <Link href="/drone-surveillance" className="button outline">Return to analysis →</Link>
        </div>
        {presetSaved && <div className="notification success" style={{ marginTop: 12 }}>✓ Settings saved for this browser.</div>}
      </section>
    </div>
  );
}
