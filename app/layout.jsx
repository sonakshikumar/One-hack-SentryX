import './globals.css';
import { Shell } from './components/Shell';

export const metadata = {
<<<<<<< HEAD
  title: 'SkySentinel — Autonomous AI Command Center',
  description: 'Turn existing CCTV into an autonomous AI command center.'
=======
  title: 'SentryX — AI-Powered Drone Surveillance',
  description: 'Analyze thermal and low-light drone footage to detect suspicious human movement within a defined perimeter.'
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><Shell>{children}</Shell></body></html>;
}
