import Link from 'next/link';
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
