'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Footer } from './Footer';
<<<<<<< HEAD
import { useApiConfig } from '../lib/apiConfig';

const links = [
  ['Overview', '/'],
  ['Live Demo', '/demo'],
  ['Platform', '/platform'],
  ['Solutions', '/solutions'],
  ['Pricing', '/pricing'],
  ['Resources', '/resources'],
  ['Settings', '/settings']
];

// Persistent shell intentionally owns navigation state so every page feels like one product.
export function Shell({ children }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { baseUrl } = useApiConfig();
  const shortHost = baseUrl ? baseUrl.replace(/^https?:\/\//, '').split('/')[0] : 'trycloudflare.com';
=======

const links = [
  ['Overview', '/'],
  ['Drone Surveillance', '/drone-surveillance'],
  ['Alerts & Incidents', '/alerts'],
  ['Datasets & Models', '/datasets-models'],
  ['Settings', '/settings']
];

function isActive(path, href) {
  if (path === href) return true;
  if (href === '/' && path === '/overview') return true;
  return false;
}

export function Shell({ children }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98

  useEffect(() => { setOpen(false); }, [path]);
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <Link href="/" className="brand">
<<<<<<< HEAD
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 36" width="18" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 1L30 6.5V16.5C30 25 24 31.5 16 35C8 31.5 2 25 2 16.5V6.5L16 1Z" fill="#101c22" stroke="#e195ab" strokeWidth="1.6"/>
              <circle cx="16" cy="17" r="2.3" fill="#e195ab"/>
              <circle cx="16" cy="9" r="1.4" fill="#e195ab"/>
              <circle cx="16" cy="25" r="1.4" fill="#e195ab"/>
              <circle cx="8" cy="17" r="1.4" fill="#e195ab"/>
              <circle cx="24" cy="17" r="1.4" fill="#e195ab"/>
              <path d="M16 9V25M8 17H24" stroke="#e195ab" strokeWidth="1.3"/>
            </svg>
          </span>
          <span>Sky<span>Sentinel</span></span>
        </Link>
        <p className="eyebrow nav-label">Command Center</p>
        <nav>
          {links.map(([label, href], index) => (
            <Link key={href} href={href} className={path === href ? 'active' : ''}>
=======
          <span className="brand-mark">S</span>
          <span>Sentry<span>X</span></span>
        </Link>
        <p className="eyebrow nav-label">Drone → Alert</p>
        <nav>
          {links.map(([label, href], index) => (
            <Link key={href} href={href} className={isActive(path, href) ? 'active' : ''}>
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
              <span className="nav-number">0{index + 1}</span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="side-bottom">
<<<<<<< HEAD
          <div className="secure-dot" /> All systems operational
          <br />
          <Link href="/settings" className="side-gateway-link" title="Configure IBVAP Edge Gateway">
            <span className="side-gateway-badge">IBVAP Edge</span>
            <small className="side-gateway-host" title={baseUrl}>{shortHost}</small>
            <span className="side-gear-icon">⚙</span>
          </Link>
=======
          <div className="secure-dot" /> SENTRYX AI · DEVELOPMENT
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
        </div>
      </aside>
      <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
        <i /><i /><i />
      </button>
      <main>{children}<Footer /></main>
<<<<<<< HEAD
      <Link href="/pricing#contact" className="sticky-cta">Book a briefing <span>↗</span></Link>
    </div>
  );
}

=======
    </div>
  );
}
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
