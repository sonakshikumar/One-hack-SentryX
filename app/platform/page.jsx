import Link from 'next/link';
import { Reveal } from '../components/Reveal';
import { Workbench } from '../components/Workbench';

const steps=[['01','RTSP streams','Your existing cameras deliver secure feeds to the local SentryX edge node.'],['02','YOLO server','Computer vision models identify people, vehicles, plates, and movement.'],['03','WebSocket events','Only meaningful, metadata-rich events move instantly through the network.'],['04','Mobile app','Teams receive a usable alert with context, location, and a video clip.']];

export default function Platform(){
  return (
    <div className="page">
      <section className="page-hero section">
        <p className="eyebrow">The SentryX platform</p>
        <h1>Intelligence that fits <i>around</i> your infrastructure.</h1>
        <p className="lead">
          An open, edge-first architecture that turns video into operational clarity without replacing your camera estate.
        </p>
        <div style={{ marginTop: '24px', display: 'flex', gap: '14px' }}>
          <Link href="/demo" className="button dark">
            Open Dedicated Demo Platform <b>↗</b>
          </Link>
          <Link href="/settings" className="button outline">
            Gateway Settings <b>⚙</b>
          </Link>
        </div>
      </section>

      {/* Live Interactive Engine Section */}
      <section className="section" style={{ paddingTop: '0' }}>
        <div className="section-heading inline">
          <div>
            <p className="eyebrow">Live Edge Demo</p>
            <h2>Interactive IBVAP Inference Platform</h2>
          </div>
          <Link href="/demo" className="text-link">Full Screen Command Center <b>→</b></Link>
        </div>
        <Workbench />
      </section>

      <Reveal className="section architecture">
        <div className="section-heading">
          <p className="eyebrow">System architecture</p>
          <h2>From pixel to decision—without the wait.</h2>
        </div>
        <div className="flowchart">
          {steps.map((s,i)=>(
            <div className="flow-step" key={s[0]}>
              <span>{s[0]}</span>
              <div className="flow-icon">{['◉','✦','⌁','◫'][i]}</div>
              <h3>{s[1]}</h3>
              <p>{s[2]}</p>
              {i<3&&<b className="flow-arrow">→</b>}
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal className="section feature-split">
        <div className="soft-card">
          <p className="eyebrow">Edge-first by design</p>
          <h2>Keep latency low and control close.</h2>
          <p>Detection runs at the outpost, minimizing bandwidth and retaining mission-critical operation even where connectivity is intermittent.</p>
          <div className="metric">42<span>ms</span><small>average edge response</small></div>
        </div>
        <div className="feature-list">
          <article><b>01</b><div><h3>Model orchestration</h3><p>Route the right model to the right camera, zone, and operating condition.</p></div></article>
          <article><b>02</b><div><h3>Event intelligence</h3><p>Unify detections into an auditable timeline rather than a stack of clips.</p></div></article>
          <article><b>03</b><div><h3>Role-ready alerts</h3><p>Escalate every verified event to the operator who can act on it.</p></div></article>
        </div>
      </Reveal>
    </div>
  );
}

