const COMPACT = ['Video', 'Detection', 'Tracking', 'Behavior', 'Perimeter', 'Alert'];

const DETAILED = [
  ['01', 'Video input', 'Thermal, low-light, or RGB drone footage.'],
  ['02', 'Detection', 'Person localization in processed frames.'],
  ['03', 'Tracking', 'Multi-object tracking with temporal identities.'],
  ['04', 'Temporal analysis', 'Speed, direction, trajectory, dwell.'],
  ['05', 'Behavior classification', 'Suspicious movement vs non-threat activity.'],
  ['06', 'Perimeter context', 'Restricted zones and tripwire crossings.'],
  ['07', 'Risk assessment', 'Combine signals for operator review.'],
  ['08', 'Explainable alert', 'Track, location, duration, and contributing signals.']
];

export function Pipeline({ compact = false }) {
  if (compact) {
    return (
      <div className="pipeline-compact" aria-label="How SentryX works">
        {COMPACT.map((step, i) => (
          <span key={step} className="pipeline-chip">
            {step}
            {i < COMPACT.length - 1 && <b aria-hidden="true">→</b>}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="pipeline-rail">
      {DETAILED.map(([n, title, copy], i) => (
        <article className="pipeline-stage" key={n}>
          <span>{n}</span>
          <h3>{title}</h3>
          <p>{copy}</p>
          {i < DETAILED.length - 1 && <b aria-hidden="true">↓</b>}
        </article>
      ))}
    </div>
  );
}
