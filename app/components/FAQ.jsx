'use client';
import { useState } from 'react';

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
