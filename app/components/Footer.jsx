import Link from 'next/link';
<<<<<<< HEAD
export function Footer(){return <footer><span>© 2026 SkySentinel Systems</span><span>Built for vigilant operations</span><div><Link href="/resources">LinkedIn</Link><Link href="/resources">X / Twitter</Link><Link href="/pricing">Contact</Link></div></footer>}
=======
export function Footer(){
  return (
    <footer>
      <span>© 2026 SentryX</span>
      <span>AI-powered drone surveillance · thermal / low-light CV</span>
      <div>
        <Link href="/drone-surveillance">Run AI Analysis</Link>
        <Link href="/datasets-models">Datasets</Link>
        <Link href="/settings">Settings</Link>
      </div>
    </footer>
  );
}
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
