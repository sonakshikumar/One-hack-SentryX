'use client';

import { useLastAnalysis } from '../lib/liveFeed';

export function SystemStatus() {
  const analysis = useLastAnalysis();
  const videos = analysis ? '1 this session' : '—';
  const events = analysis ? String(analysis.breaches ?? '—') : '—';
  const alerts = analysis ? String(analysis.alerts?.length ?? '—') : '—';

  const items = [
    ['Videos analyzed', videos],
    ['Active tracks', 'Awaiting data'],
    ['Perimeter events', events === '—' ? 'Awaiting data' : events],
    ['Open alerts', alerts === '—' ? 'Awaiting data' : alerts]
  ];

  return (
    <section className="section status-strip">
      <p className="eyebrow">System status</p>
      <div className="status-grid">
        {items.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <b>{value}</b>
          </div>
        ))}
      </div>
    </section>
  );
}
