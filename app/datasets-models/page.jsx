import { Reveal } from '../components/Reveal';
import { Pipeline } from '../components/Pipeline';

const datasets = [
  ['HIT-UAV', 'Thermal aerial detection', 'Planned'],
  ['RGBTDronePerson', 'RGB + thermal person detection', 'Planned'],
  ['VTUAV', 'UAV thermal / RGB detection', 'Planned'],
  ['BIRDSAI', 'Thermal aerial video', 'Planned'],
  ['Custom Behavior Dataset', 'Movement-pattern annotations', 'Planned']
];

const models = [
  ['Thermal Person Detector', 'v1.0', 'Development'],
  ['RGB Person Detector', 'v1.0', 'Development'],
  ['Behavior Classifier', 'v0.1', 'Development'],
  ['ByteTrack', '—', 'Active'],
  ['Risk Engine', 'v0.1', 'Development']
];

const evalGroups = [
  ['Detection', ['Precision', 'Recall', 'mAP@50', 'F1']],
  ['Tracking', ['IDF1', 'MOTA']],
  ['Behavior', ['Precision', 'Recall', 'F1']],
  ['System', ['Inference FPS', 'Processing latency', 'Alert latency', 'False alarm rate']]
];

export default function DatasetsModelsPage() {
  return (
    <div className="page">
      <section className="page-hero section">
        <div className="breadcrumbs"><span>SentryX</span><span>/</span><span>Datasets &amp; Models</span></div>
        <p className="eyebrow">Technical registry</p>
        <h1>How the AI is <i>built and evaluated.</i></h1>
        <p className="lead">Public thermal and low-light sources, model inventory, and evaluation slots. Named datasets remain planned until training actually uses them. Metrics stay empty until measured.</p>
      </section>

      <Reveal className="section">
        <div className="section-heading"><p className="eyebrow">A · Dataset registry</p><h2>Sources for thermal and aerial person detection.</h2></div>
        <div className="cap-grid cap-grid-4">{datasets.map(([title, copy, status]) => <article className="cap-card" key={title}><span className="demo-chip">{status}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </Reveal>

      <Reveal className="section">
        <div className="section-heading"><p className="eyebrow">B · Model registry</p><h2>Detectors, tracker, behavior, risk engine.</h2></div>
        <div className="cap-grid cap-grid-4">{models.map(([title, version, status]) => <article className="cap-card" key={title}><span className="demo-chip">{status}</span><h3>{title}</h3><p>Version: {version}</p></article>)}</div>
      </Reveal>

      <Reveal className="section">
        <div className="section-heading"><p className="eyebrow">C · Evaluation</p><h2>Measured when the models are scored.</h2></div>
        <div className="eval-table-wrap"><table className="headers-table"><thead><tr><th>Group</th><th>Metric</th><th>Value</th></tr></thead><tbody>{evalGroups.flatMap(([group, metrics]) => metrics.map((metric) => <tr key={`${group}-${metric}`}><td>{group}</td><td>{metric}</td><td><span className="demo-chip">Awaiting evaluation</span></td></tr>))}</tbody></table></div>
      </Reveal>

      <Reveal className="section architecture" id="pipeline">
        <div className="section-heading"><p className="eyebrow">D · Pipeline</p><h2>Computer vision path from video to alert.</h2></div>
        <Pipeline />
      </Reveal>
    </div>
  );
}
