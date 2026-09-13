'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApiConfig, checkApiHealth, DEFAULT_API_BASE } from '../lib/apiConfig';

export default function SettingsPage() {
  const { baseUrl, setBaseUrl, resetBaseUrl, swaggerUrl, fullPipelineEndpoint, anprEndpoint } = useApiConfig();
  const [inputUrl, setInputUrl] = useState(baseUrl);
  const [healthStatus, setHealthStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState('');

  // Surveillance presets
  const [defaultDuration, setDefaultDuration] = useState(120);
  const [defaultAnpr, setDefaultAnpr] = useState(true);
  const [defaultNight, setDefaultNight] = useState(false);
  const [presetSaved, setPresetSaved] = useState(false);

  useEffect(() => {
    setInputUrl(baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    try {
      const savedDuration = localStorage.getItem('ibvap_default_duration');
      const savedAnpr = localStorage.getItem('ibvap_default_anpr');
      const savedNight = localStorage.getItem('ibvap_default_night');
      if (savedDuration) setDefaultDuration(Number(savedDuration));
      if (savedAnpr !== null) setDefaultAnpr(savedAnpr === 'true');
      if (savedNight !== null) setDefaultNight(savedNight === 'true');
    } catch {
      // ignore
    }
  }, []);

  const handleSaveUrl = (e) => {
    e?.preventDefault();
    const updated = setBaseUrl(inputUrl);
    setInputUrl(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetUrl = () => {
    const updated = resetBaseUrl();
    setInputUrl(updated);
    setSaveSuccess(true);
    setHealthStatus(null);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setHealthStatus(null);
    const result = await checkApiHealth(inputUrl);
    setHealthStatus(result);
    setTesting(false);
  };

  const handleSavePresets = () => {
    try {
      localStorage.setItem('ibvap_default_duration', String(defaultDuration));
      localStorage.setItem('ibvap_default_anpr', String(defaultAnpr));
      localStorage.setItem('ibvap_default_night', String(defaultNight));
      window.dispatchEvent(new CustomEvent('ibvap_presets_changed', {
        detail: { duration: defaultDuration, anpr: defaultAnpr, night: defaultNight }
      }));
      setPresetSaved(true);
      setTimeout(() => setPresetSaved(false), 3000);
    } catch {
      // ignore
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard?.writeText(text);
    setCopiedEndpoint(label);
    setTimeout(() => setCopiedEndpoint(''), 2500);
  };

  const isDefault = inputUrl.trim().replace(/\/+$/, '') === DEFAULT_API_BASE;

  return (
    <div className="page settings-page">
      <section className="section">
        <div className="settings-header">
          <div>
            <div className="breadcrumbs">
              <Link href="/">Overview</Link>
              <span>/</span>
              <span>Settings</span>
            </div>
            <p className="eyebrow">Tactical Platform Configuration</p>
            <h1>IBVAP Gateway & System Settings</h1>
            <p className="lead">
              Configure Intelligent Border Video Analytics Platform (SSB / MHA) gateway endpoints, verify edge latency, and customize pipeline defaults.
            </p>
          </div>
          <div className="header-badge-wrap">
            <span className={`status-pill ${healthStatus?.ok ? 'active' : healthStatus ? 'error' : ''}`}>
              <span className="dot" />
              {healthStatus?.ok
                ? `Online · ${healthStatus.latency}ms`
                : healthStatus
                ? 'Check Gateway'
                : 'Gateway Configured'}
            </span>
          </div>
        </div>

        <div className="settings-grid">
          {/* Card 1: Base URL Gateway */}
          <div className="panel settings-card">
            <div className="card-top">
              <div>
                <p className="eyebrow">01 · Edge Gateway</p>
                <h3>API Gateway Base URL</h3>
              </div>
              <a
                href={swaggerUrl}
                target="_blank"
                rel="noreferrer"
                className="swagger-btn"
                title="Open Interactive Swagger Documentation"
              >
                Swagger Docs ↗
              </a>
            </div>
            <p className="card-desc">
              All master surveillance and ANPR requests route to this host. Custom deployment tunnels, on-prem edge appliances, or staging gateways can be specified here.
            </p>

            <form onSubmit={handleSaveUrl} className="gateway-form">
              <label className="input-group">
                <span className="input-label">Gateway Base URL</span>
                <div className="input-wrap">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://..."
                    className="text-input font-mono"
                    required
                  />
                  {isDefault && <span className="default-tag">Default (Cloudflare Tunnel)</span>}
                </div>
              </label>

              <div className="btn-row">
                <button type="submit" className="button dark">
                  Save Gateway URL
                </button>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="button outline"
                >
                  {testing ? 'Probing Gateway…' : 'Test Connection ⚡'}
                </button>
                {!isDefault && (
                  <button
                    type="button"
                    onClick={handleResetUrl}
                    className="button light reset-btn"
                  >
                    Reset to Default
                  </button>
                )}
              </div>

              {saveSuccess && (
                <div className="notification success">
                  ✓ Base URL saved successfully. Connected components updated in real-time.
                </div>
              )}

              {healthStatus && (
                <div className={`notification ${healthStatus.ok ? 'success' : 'error'}`}>
                  <b>{healthStatus.ok ? 'Connection Verified' : 'Gateway Unreachable'}:</b> {healthStatus.message}
                  {healthStatus.ok && <span> (HTTP {healthStatus.status})</span>}
                </div>
              )}
            </form>
          </div>

          {/* Card 2: Active Pipeline Endpoints */}
          <div className="panel settings-card">
            <div className="card-top">
              <div>
                <p className="eyebrow">02 · Pipeline Endpoints</p>
                <h3>Integrated Analytics Interfaces</h3>
              </div>
            </div>
            <p className="card-desc">
              Direct endpoints mounted for edge processing. Video feeds are streamed via <code>multipart/form-data</code> and return binary MP4 streams with telemetry headers.
            </p>

            <div className="endpoints-list">
              <div className="endpoint-item">
                <div className="endpoint-badge post">POST</div>
                <div className="endpoint-details">
                  <div className="endpoint-header">
                    <b>/api/v1/analytics/full</b>
                    <span className="tag">Master Pipeline v2.0</span>
                  </div>
                  <div className="endpoint-url font-mono">{fullPipelineEndpoint}</div>
                  <p className="endpoint-sub">
                    YOLO11n lightweight multi-class tracking, ByteTrack temporal identities, virtual fence polygon & demarcation tripwire vector geometry checks with 2x frame stride and ultrafast H.264 streaming.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(fullPipelineEndpoint, 'full')}
                  className="copy-btn"
                  title="Copy Full URL"
                >
                  {copiedEndpoint === 'full' ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Telemetry & Response Headers Protocol */}
          <div className="panel settings-card">
            <div className="card-top">
              <div>
                <p className="eyebrow">03 · Protocol Reference</p>
                <h3>Telemetry & Response Headers</h3>
              </div>
            </div>
            <p className="card-desc">
              IBVAP outputs real-time threat telemetry and alert logs directly in the HTTP response headers alongside the annotated binary video stream:
            </p>

            <div className="headers-table-wrap">
              <table className="headers-table">
                <thead>
                  <tr>
                    <th>Header</th>
                    <th>Format</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>X-IBVAP-Breach-Count</code></td>
                    <td><code>Integer</code></td>
                    <td>Total perimeter breaches and tripwire crossings recorded.</td>
                  </tr>
                  <tr>
                    <td><code>X-IBVAP-Plates-Detected</code></td>
                    <td><code>JSON Object</code></td>
                    <td>Track ID to detected license plate string mapping (e.g. <code>&#123;&quot;2&quot;: &quot;UP16AX1234&quot;&#125;</code>).</td>
                  </tr>
                  <tr>
                    <td><code>X-IBVAP-Alerts-JSON</code></td>
                    <td><code>Base64 String</code></td>
                    <td>Base64-encoded array of detailed tactical incident alert objects with timestamps and track IDs.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 4: Default Operational Presets */}
          <div className="panel settings-card">
            <div className="card-top">
              <div>
                <p className="eyebrow">04 · Defaults</p>
                <h3>Surveillance Processing Presets</h3>
              </div>
            </div>
            <p className="card-desc">
              Define operational default parameters automatically populated in the Tactical Workbench.
            </p>

            <div className="presets-form">
              <label className="range-label">
                <span>Default Max Duration (seconds)</span>
                <output>{defaultDuration}s</output>
                <input
                  type="range"
                  min="10"
                  max="480"
                  step="10"
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(Number(e.target.value))}
                />
              </label>

              <div className="switches preset-switches">
                <label>
                  <input
                    type="checkbox"
                    checked={defaultAnpr}
                    onChange={(e) => setDefaultAnpr(e.target.checked)}
                  />
                  <span />
                  Automatic ANPR recognition enabled by default
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={defaultNight}
                    onChange={(e) => setDefaultNight(e.target.checked)}
                  />
                  <span />
                  Night mode / Dynamic CLAHE enhancement enabled by default
                </label>
              </div>

              <div className="btn-row" style={{ marginTop: '18px' }}>
                <button type="button" onClick={handleSavePresets} className="button dark">
                  Save Operational Defaults
                </button>
                <Link href="/" className="button outline">
                  Return to Tactical Workbench →
                </Link>
              </div>

              {presetSaved && (
                <div className="notification success">
                  ✓ Operational presets saved and synced.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
