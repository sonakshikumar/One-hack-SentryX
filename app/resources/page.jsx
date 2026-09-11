'use client';
import { useState } from 'react';
import { NewsCarousel } from '../components/NewsCarousel';
export default function Resources(){const [done,setDone]=useState(false);return <div className="page"><NewsCarousel /><section className="newsletter section"><div><p className="eyebrow">Signal, not noise</p><h2>A considered monthly dispatch.</h2><p>Practical intelligence for security and operations leaders. No sales clutter.</p></div>{done?<p className="form-success">You’re on the list. Welcome to the signal. <b>✓</b></p>:<form onSubmit={e=>{e.preventDefault();setDone(true)}}><input type="email" aria-label="Email address" required placeholder="Email address"/><button className="button dark">Subscribe <b>↗</b></button></form>}</section></div>}
