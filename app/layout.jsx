import './globals.css';
import { Shell } from './components/Shell';

export const metadata = {
  title: 'SentryX — AI-Powered Drone Surveillance',
  description: 'Analyze thermal and low-light drone footage to detect suspicious human movement within a defined perimeter.'
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><Shell>{children}</Shell></body></html>;
}
