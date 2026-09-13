'use client';
import { useState } from 'react';
<<<<<<< HEAD
const data=[['Will SkySentinel work with our existing cameras?','Yes. SkySentinel ingests standard ONVIF/RTSP IP camera streams, so organizations can retain compatible cameras and their existing network investment.'],['How is data protected?','Video processing can run at the edge. Alerts, audit records, and access controls are encrypted in transit and at rest.'],['What happens if connectivity drops?','The local edge appliance continues detecting and queuing events. It synchronizes automatically once the link returns.'],['Can we start with one site?','Absolutely. Our deployment model is designed for a focused pilot and expands from one outpost to a national command network.']];
export function FAQ(){const [active,setActive]=useState(0);return <div className="faq">{data.map(([q,a],i)=><div className={active===i?'faq-item open':'faq-item'} key={q}><button onClick={()=>setActive(active===i?-1:i)}><span>{q}</span><b>+</b></button><div className="faq-answer">{a}</div></div>)}</div>}
=======

const data = [
  ['What video does SentryX analyze?', 'Thermal and low-light drone footage, with optional RGB as a reference. The workbench accepts uploaded MP4, AVI, or MOV clips.'],
  ['What does it detect?', 'People and their movement over time — tracks, motion features, and perimeter context. Identity matching and vehicle reading are out of scope.'],
  ['How is a perimeter defined?', 'Operators draw restricted zones and tripwires on a calibration frame. Coordinates are scaled to the native video resolution before inference.'],
  ['Is behavior classification live?', 'It is a prototype pipeline stage. The UI shows sample or awaiting-inference states unless a real model run provides those labels.'],
  ['Are risk scores live AI output?', 'Only when they come from an inference run. Homepage HUD values are labeled demo/sample until then.']
];

export function FAQ() {
  const [active, setActive] = useState(0);
  return (
    <div className="faq">
      {data.map(([q, a], i) => (
        <div className={active === i ? 'faq-item open' : 'faq-item'} key={q}>
          <button type="button" onClick={() => setActive(active === i ? -1 : i)}>
            <span>{q}</span><b>+</b>
          </button>
          <div className="faq-answer">{a}</div>
        </div>
      ))}
    </div>
  );
}
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
