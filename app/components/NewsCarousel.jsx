'use client';

import { useState } from 'react';
import Link from 'next/link';

const reports = [
  { region: 'DATA', source: 'Project', title: 'Thermal video sources', copy: 'Public thermal surveillance or aerial sequences used for detection under heat-signature conditions. Named datasets are listed only when evaluation uses them.', href: '/resources' },
  { region: 'DATA', source: 'Project', title: 'Low-light video sources', copy: 'Night and near-dark footage for movement analysis when RGB is unreliable.', href: '/resources' },
  { region: 'MODELS', source: 'Pipeline', title: 'Detection and tracking', copy: 'Person detection with multi-object tracking. Behavior classification remains a prototype stage.', href: '/demo' }
];

export function NewsCarousel() {
  const [start, setStart] = useState(0);
  const visible = reports.slice(start, start + 3);
  const next = () => setStart((value) => (value + 1) % reports.length);
  const previous = () => setStart((value) => (value - 1 + reports.length) % reports.length);
  return (
    <section className="field-reports section">
      <div className="reports-heading">
        <div>
          <p className="eyebrow">Technical notes</p>
          <h2>Datasets, models, evaluation</h2>
          <p>Project documentation — not news or deployment claims.</p>
        </div>
        <div className="carousel-controls">
          <button type="button" onClick={previous} aria-label="Previous">←</button>
          <span>{String(start + 1).padStart(2, '0')} — {String(Math.min(start + 3, reports.length)).padStart(2, '0')}</span>
          <button type="button" onClick={next} aria-label="Next">→</button>
        </div>
      </div>
      <div className="reports-track">
        {visible.map((report) => (
          <article className="report-card" key={report.title}>
            <div className="report-body">
              <div className="report-meta"><span>{report.region}</span><b>{report.source}</b></div>
              <h3>{report.title}</h3>
              <p>{report.copy}</p>
              <Link href={report.href}>Open <b>→</b></Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
