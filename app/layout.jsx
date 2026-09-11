import './globals.css';
import { Shell } from './components/Shell';

export const metadata = {
  title: 'SentryX — Autonomous AI Command Center',
  description: 'Turn existing CCTV into an autonomous AI command center.'
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><Shell>{children}</Shell></body></html>;
}
