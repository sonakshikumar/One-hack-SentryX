'use client';
import { useEffect, useRef, useState } from 'react';
export function Counter({ to, suffix = '' }) { const ref=useRef(); const [n,setN]=useState(0); useEffect(()=>{let started=false; const io=new IntersectionObserver(([e])=>{if(!e.isIntersecting||started)return;started=true;let st; const tick=t=>{st??=t; const p=Math.min((t-st)/1200,1);setN(Math.round(to*(1-Math.pow(1-p,3))));if(p<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)});io.observe(ref.current);return()=>io.disconnect()},[to]); return <span ref={ref}>{n}{suffix}</span> }
