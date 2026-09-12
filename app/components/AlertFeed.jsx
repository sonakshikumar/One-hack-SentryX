'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { SAMPLE_ALERTS } from '../lib/alerts';
import { useLastAnalysis } from '../lib/liveFeed';

const FILTERS = ['All', 'High', 'Medium', 'Low'];

function Trajectory({ path }) {
  const d = path.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return (
    <svg className="traj-svg" viewBox="0 0 100 100" aria-label="Sample trajectory">
      <rect width="100" height="100" fill="#0d171d" />
      <path d={d} fill="none" stroke="#0d9e91" strokeWidth="1.6" />
      {path.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === path.length - 1 ? 2.4 : 1.4} fill={i === path.length - 1 ? '#ff5c7a' : '#eef4f5'} />
      ))}
    </svg>
  );
}

export function AlertFeed() {
  const [filter, setFilter] = useState('All');
  const [statuses, setStatuses] = useState({});
  const [activeId, setActiveId] = useState(null);
  const liveAnalysis = useLastAnalysis();

  const liveAlerts = useMemo(() => (liveAnalysis?.alerts || []).map((a, index) => ({
    id: String(a.id || a.track_id || `live-${index}`),
    severity: String(a.severity || (a.type === 'breach' ? 'HIGH' : 'MEDIUM')).toUpperCase(),
    time: a.timestamp || `Frame ${a.frame || index}`,
    track: String(a.track_id || a.track || 'N/A'),
    title: a.message || `Track #${a.track_id || 'N/A'} triggered a perimeter rule`,
    behavior: a.behavior || 'Awaiting behavior classification',
    zone: a.zone || 'Perimeter context',
    duration: a.duration || 'Awaiting data',
    movement: a.movement || 'Awaiting data',
    source: `${liveAnalysis.videoMode || 'Selected'} drone footage`,
    model: 'Connected inference service',
    signals: a.signals || ['Perimeter event'],
    status: 'Open',
    sample: false,
    path: a.path || [{ x: 12, y: 78 }, { x: 52, y: 40 }]
  })), [liveAnalysis]);

  const alerts = useMemo(() => (liveAlerts.length ? liveAlerts : SAMPLE_ALERTS).map((a) => ({
    ...a,
    status: statuses[a.id] || a.status
  })), [liveAlerts, statuses]);

  const visible = alerts.filter((a) => filter === 'All' || a.severity === filter.toUpperCase());
  const active = alerts.find((a) => a.id === activeId) || null;

  const setStatus = (id, status) => {
    setStatuses((prev) => ({ ...prev, [id]: status }));
  };

  return (
    <>
      <div className="alert-toolbar">
        <div className="alert-filters">
          {FILTERS.map((f) => (
            <button key={f} type="button" className={filter === f ? 'tool active' : 'tool'} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
        <span className="demo-chip">{liveAlerts.length ? 'Connected analysis' : 'Demo output'}</span>
      </div>

      <div className="alert-feed">
        {visible.map((a) => (
          <article className={`alert-story risk-${a.severity.toLowerCase()}`} key={a.id}>
            <header>
              <time>{a.time}</time>
              <b className={`risk-tag ${a.severity.toLowerCase()}`}>{a.severity}</b>
              <span className="status-pill">{a.status}</span>
            </header>
            <h3>{a.title}</h3>
            <p>Behavior: {a.behavior}</p>
            <p>Context: {a.zone}</p>
            <ul>
              {a.signals.map((s) => <li key={s}>{s}</li>)}
            </ul>
            <button type="button" className="button outline" onClick={() => setActiveId(a.id)}>
              View Track
            </button>
          </article>
        ))}
      </div>

      {active && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-labelledby="incident-title">
          <div className="lightbox-card incident-card">
            <button type="button" onClick={() => setActiveId(null)} aria-label="Close">×</button>
            <p className="eyebrow">Incident #{active.id} · {active.sample ? 'Demo output' : 'Connected analysis'}</p>
            <h2 id="incident-title">{active.title}</h2>
            <div className="kv-grid">
              <div><span>Severity</span><b>{active.severity}</b></div>
              <div><span>Track</span><b>#{active.track}</b></div>
              <div><span>Status</span><b>{active.status}</b></div>
              <div><span>Behavior</span><b>{active.behavior}</b></div>
              <div><span>Zone</span><b>{active.zone}</b></div>
              <div><span>Duration</span><b>{active.duration}</b></div>
              <div><span>Movement</span><b>{active.movement}</b></div>
              <div><span>Source</span><b>{active.source}</b></div>
              <div><span>Model</span><b>{active.model}</b></div>
            </div>
            <h3>Contributing signals</h3>
            <ul className="signal-check">
              {active.signals.map((s) => <li key={s}>✓ {s}</li>)}
            </ul>
            <h3>Trajectory</h3>
            <Trajectory path={active.path} />
            <div className="btn-row" style={{ marginTop: 18 }}>
              <button type="button" className="button dark" onClick={() => { setStatus(active.id, 'Reviewed'); setActiveId(null); }}>
                Mark Reviewed
              </button>
              <button type="button" className="button outline" onClick={() => { setStatus(active.id, 'False Positive'); setActiveId(null); }}>
                False Positive
              </button>
              <Link href="/demo" className="button light">Open analysis</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
