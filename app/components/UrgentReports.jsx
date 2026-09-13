import { Reveal } from './Reveal';

// The editorial block keeps the original card DOM/classes so its visual treatment is unchanged.
const reports = [
  ['FIELD NOTE', 'WEST BENGAL • JAN 2025', 'Where an unfenced river leaves communities exposed', 'Along the Sonai River, an unfenced stretch of the India-Bangladesh border has become a corridor for smuggling, infiltration, and human trafficking. Officers describe poor roads, low visibility, and people vanishing into the crowd—conditions where continuous AI detection can protect both patrols and vulnerable families.', 'Read the report - The Indian Express', 'https://indianexpress.com/article/cities/kolkata/riverine-unfenced-border-bangladesh-bsf-smugglers-infiltrators-9770889/', 'sentryx-article-1'],
  ['OPERATIONS', 'WEST BENGAL • JAN 2025', 'When darkness becomes a smuggler’s ally', 'On unfenced border sections, smugglers use winter fog and brief changeovers between patrols to disappear. BSF teams have resorted to night-vision cameras, motion detectors, tripwires, and alarms—an urgent reminder that every feed needs automated movement and intrusion intelligence.', 'Read the report - The Indian Express', 'https://indianexpress.com/article/cities/kolkata/night-vision-cameras-alarms-deployed-along-unfenced-border-with-bangladesh-9768039/', 'sentryx-article-2'],
  ['TECHNOLOGY', 'TRIPURA • JUL 2024', 'AI cameras arrive where every crossing matters', 'After contraband seizures worth ₹29 crore and the detention of 210 foreign nationals, BSF deployed AI-enabled cameras and facial-recognition tools along the Tripura frontier. The field response shows why operators need searchable identities, real-time alerts, and evidence—not another wall of passive video.', 'Read the report - The Indian Express', 'https://indianexpress.com/article/north-east-india/tripura/bsf-deploys-ai-enabled-cameras-nab-infiltrators-india-bangladesh-border-9438905/lite/', 'sentryx-article-3']
];

export function UrgentReports() {
  const reportImages = [
    'https://www.thedailystar.net/sites/default/files/styles/big_1/public/feature/images/14._bsf_bop-ht-zaid-wb.jpg',
    'https://api.pixuate.com/api/media/serve/blog/ai-perimeter-intrusion-detection.png',
    'https://api.pixuate.com/static/media/heroes/optimized/solution-perimeter-monitoring-hero-1600.webp'
  ];
  return <><section className="page-hero section"><p className="eyebrow">Real-world border incidents</p><h1>The urgent need for <i>intelligent borders</i></h1><p className="lead">Real incidents of smuggling, trafficking, and infiltration demonstrating why passive CCTV is no longer enough.</p></section><Reveal className="section editorial-grid">{reports.map(([type, tag, title, copy, linkText, href], i) => <article className="article-card" key={title}><img src={reportImages[i]} alt="Border surveillance camera infrastructure" /><div><p className="eyebrow">{type} · {tag}</p><h2>{title}</h2><p>{copy}</p><a className="text-link" href={href} target="_blank" rel="noreferrer">{linkText} <b>↗</b></a></div></article>)}</Reveal></>;
}
