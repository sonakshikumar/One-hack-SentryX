import Link from 'next/link';
import { AlertFeed } from '../components/AlertFeed';

export default function AlertsPage() {
  return (
    <div className="page">
      <section className="page-hero section" style={{ paddingBottom: 20 }}>
        <div className="breadcrumbs"><span>SentryX</span><span>/</span><span>Alerts</span></div>
        <p className="eyebrow">Investigation</p>
        <h1>AI Detection &amp; <i>Alert Feed</i></h1>
        <p className="lead">Review why a track was flagged: movement, zone context, and contributing signals — not a percentage alone.</p>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <AlertFeed />
        <p className="muted-note">Demo incidents are shown until a connected analysis run provides live events. <Link href="/drone-surveillance">Run AI Analysis →</Link></p>
      </section>
    </div>
  );
}
