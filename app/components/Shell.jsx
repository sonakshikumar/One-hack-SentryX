'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Footer } from './Footer';

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

  useEffect(() => { setOpen(false); }, [path]);
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <Link href="/" className="brand">
          <span className="brand-mark">S</span>
          <span>Sentry<span>X</span></span>
        </Link>
        <p className="eyebrow nav-label">Drone → Alert</p>
        <nav>
          {links.map(([label, href], index) => (
            <Link key={href} href={href} className={isActive(path, href) ? 'active' : ''}>
              <span className="nav-number">0{index + 1}</span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="secure-dot" /> SENTRYX AI · DEVELOPMENT
        </div>
      </aside>
      <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
        <i /><i /><i />
      </button>
      <main>{children}<Footer /></main>
    </div>
  );
}
