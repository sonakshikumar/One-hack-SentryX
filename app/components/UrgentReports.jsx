import { Reveal } from './Reveal';

const notes = [
  ['VISION', 'THERMAL / LOW-LIGHT', 'Why aerial IR and night video matter', 'Human silhouettes remain visible when RGB collapses. SentryX is built around that footage — not a wall of ordinary daytime cameras.', 'Explore Detection', '/demo'],
  ['TRACKING', 'TEMPORAL IDS', 'People across frames, not single boxes', 'Detection alone is a snapshot. Multi-object tracking keeps identities so dwell, speed, and path can be measured.', 'See the pipeline', '/demo#pipeline'],
  ['PERIMETER', 'ZONES + TRIPWIRES', 'Context turns motion into an incident', 'The same walk is different inside a restricted polygon. Operators get zone context with each flag.', 'View Alerts', '/solutions']
];

export function UrgentReports() {
  return (
    <>
      <section className="page-hero section">
        <p className="eyebrow">Problem framing</p>
        <h1>Suspicious movement inside a <i>defined perimeter.</i></h1>
        <p className="lead">Thermal and low-light drone video, human tracks, and zone geometry — distinguished from ordinary non-threat activity.</p>
      </section>
      <Reveal className="section editorial-grid">
        {notes.map(([type, tag, title, copy, linkText, href]) => (
          <article className="article-card" key={title}>
            <div>
              <p className="eyebrow">{type} · {tag}</p>
              <h2>{title}</h2>
              <p>{copy}</p>
              <a className="text-link" href={href}>{linkText} <b>→</b></a>
            </div>
          </article>
        ))}
      </Reveal>
    </>
  );
}
