'use client';
import { useEffect, useRef, useState } from 'react';
export function Reveal({ children, className = '' }) {
  const ref = useRef(null); const [visible, setVisible] = useState(false);
  // IntersectionObserver keeps the animation lightweight and lets each section reveal independently.
  useEffect(() => { const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { threshold: .12 }); if (ref.current) observer.observe(ref.current); return () => observer.disconnect(); }, []);
  return <div ref={ref} className={`reveal ${visible ? 'visible' : ''} ${className}`}>{children}</div>;
}
