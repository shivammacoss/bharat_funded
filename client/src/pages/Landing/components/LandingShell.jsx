import { useEffect } from 'react';

export default function LandingShell({ children }) {
  useEffect(() => {
    document.body.classList.add('allow-scroll');
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.overflowX = 'hidden';
    document.documentElement.style.height = 'auto';
    return () => {
      document.body.classList.remove('allow-scroll');
      document.documentElement.style.overflow = '';
      document.documentElement.style.overflowX = '';
      document.documentElement.style.height = '';
    };
  }, []);

  return (
    <div className="landing-page min-h-screen bg-white">
      {children}
    </div>
  );
}
