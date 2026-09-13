'use client';

import Link from 'next/link';
import { Workbench } from '../components/Workbench';
import { useApiConfig } from '../lib/apiConfig';

export default function DemoPage() {
  const { baseUrl, swaggerUrl } = useApiConfig();
  const shortHost = baseUrl ? baseUrl.replace(/^https?:\/\//, '').split('/')[0] : 'trycloudflare.com';

  return (
    <div className="page demo-page">
      <section className="section" style={{ paddingBottom: '30px' }}>
        <div className="demo-header">
          <div className="breadcrumbs">
            <Link href="/">Overview</Link>
            <span>/</span>
            <span>Live Demo Platform</span>
          </div>
          <p className="eyebrow">Interactive Operational Command Center</p>
          <h1>IBVAP Edge Analytics Demo Platform</h1>
          <p className="lead">
            Execute real-time edge surveillance inference against the Intelligent Border Video Analytics Platform (SSB / MHA) API. Upload a surveillance clip or supply a YouTube stream, calibrate restricted fences and directional tripwires, and review annotated H.264 streams with telemetry headers.
          </p>

          <div className="demo-gateway-bar">
            <span className="live-dot" style={{ width: '9px', height: '9px', background: '#58d68d' }} />
            <span>Connected Gateway:</span>
            <code className="gateway-url" title={baseUrl}>{shortHost}</code>
            <Link href="/settings" className="button outline" style={{ padding: '6px 12px', fontSize: '11px' }}>
              Change Gateway URL ⚙
            </Link>
            <a
              href={swaggerUrl}
              target="_blank"
              rel="noreferrer"
              className="button light"
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              Interactive Swagger Docs ↗
            </a>
          </div>
        </div>
      </section>

      {/* Embedded Tactical Workbench */}
      <Workbench />
    </div>
  );
}
