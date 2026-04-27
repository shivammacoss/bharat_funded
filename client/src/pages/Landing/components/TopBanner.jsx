import { useState } from 'react';
import { X } from 'lucide-react';

export default function TopBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-[#2B4EFF] text-white text-xs sm:text-sm font-medium">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2 sm:gap-3 relative">
        <span className="text-center leading-snug">
          🎉 Get <strong className="font-bold">10% OFF</strong> on all Challenges — use code{' '}
          <span className="inline-block bg-white text-[#2B4EFF] font-bold px-2 py-0.5 rounded tracking-wider">WELCOME10</span>
        </span>
        <button
          onClick={() => setVisible(false)}
          className="absolute right-3 sm:right-4 text-white/80 hover:text-white transition-colors"
          aria-label="Close banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
