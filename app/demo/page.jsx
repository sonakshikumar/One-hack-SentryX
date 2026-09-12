'use client';

import { Workbench } from '../components/Workbench';

const steps = [
  ['01', 'Select drone feed / upload video'],
  ['02', 'Select video mode'],
  ['03', 'Define perimeter'],
  ['04', 'Run AI analysis'],
  ['05', 'Review detection + tracking'],
  ['06', 'Review movement / behavior'],
  ['07', 'Review alerts']
];

export default function DemoPage() {
  return (
    <div className="page demo-page">
      <section className="section" style={{ paddingBottom: '12px' }}>
        <div className="demo-header">
          <div className="breadcrumbs">
            <span>SentryX</span>
            <span>/</span>
            <span>Drone Surveillance</span>
          </div>
          <p className="eyebrow">Core product</p>
          <h1>Drone Surveillance</h1>
          <p className="lead">
            Upload thermal or low-light aerial footage, define a perimeter, and run AI analysis.
          </p>
          <ol className="workflow-steps">
            {steps.map(([n, label]) => (
              <li key={n}><span>{n}</span>{label}</li>
            ))}
          </ol>
        </div>
      </section>
      <Workbench />
    </div>
  );
}
