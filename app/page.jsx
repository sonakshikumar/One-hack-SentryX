import Link from 'next/link';
import { Pipeline } from './components/Pipeline';
import { SystemStatus } from './components/SystemStatus';

export default function Home() {
  return (
    <div className="page home">
      <section className="hero hero-compact section">
        <div className="hero-copy">
          <p className="eyebrow">Drone perimeter intelligence</p>
          <h1>Turn drone video into <i>AI-powered</i> perimeter intelligence.</h1>
          <p className="lead">
            SentryX analyzes thermal and low-light drone footage to detect human movement, track behavior over time, evaluate defined perimeters, and generate explainable alerts for operator review.
          </p>
          <div className="hero-actions">
            <Link className="button dark" href="/drone-surveillance">Run AI Analysis <b>↗</b></Link>
            <Link className="button light" href="/drone-surveillance">Upload Drone Footage <b>↑</b></Link>
          </div>
        </div>
        <div className="hero-meta">
          <span>Drone video · Thermal / low-light · Human movement</span>
          <span>Defined perimeter → explainable alert</span>
        </div>
      </section>

      <SystemStatus />

      <section className="section how-compact">
        <p className="eyebrow">How SentryX works</p>
        <Pipeline compact />
      </section>

      <section className="cta-panel section">
        <p className="eyebrow">Start analysis</p>
        <h2>Upload drone footage and run analysis.</h2>
        <Link href="/drone-surveillance" className="button light">Upload Drone Footage <b>↗</b></Link>
      </section>
    </div>
  );
}
