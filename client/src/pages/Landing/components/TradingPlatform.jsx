import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const features = [
  'Real-time market data & live charts',
  'One-click order placement',
  'Advanced technical indicators',
  'Portfolio tracking & P&L reports',
  'Price alerts & push notifications',
  'Multi-account management',
];

export default function TradingPlatform() {
  const { ref: leftRef }  = useScrollAnimation(0.1);
  const { ref: rightRef } = useScrollAnimation(0.1);

  return (
    <section id="platform" className="bg-white py-14 md:py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* Left: Heading + Visual Card */}
          <div ref={leftRef} className="scroll-reveal-left">
            <h2
              className="font-manrope text-[#0D0F1A] mb-8"
              style={{
                fontSize: 'clamp(2rem, 4.5vw, 3.5rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              A Powerful Trading Platform{' '}
              <span className="text-[#2B4EFF]">Built for Performance</span>
            </h2>

            {/* Platform image */}
            <div className="rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.1)] bg-[#FAFBFD] border border-[#E8EAF0]">
              <img
                src="/landing/img/platform_img.png"
                alt="Bharath Funded Trader Platform"
                className="w-full h-auto block"
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
              <div className="hidden flex-col items-center justify-center text-[#6B7080] p-12 text-center aspect-[4/3]">
                <p className="text-sm font-semibold mb-1">Platform preview image</p>
                <p className="text-xs">Add at /landing/img/platform-preview.png</p>
              </div>
            </div>
          </div>

          {/* Right: Body text + Feature checklist */}
          <div ref={rightRef} className="scroll-reveal-right lg:pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(43,78,255,0.08)] border border-[rgba(43,78,255,0.15)] mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2B4EFF]" />
              <span className="text-xs font-semibold text-[#2B4EFF] uppercase tracking-widest">Platform</span>
            </div>

            <p className="text-base sm:text-lg text-[#6B7080] font-light mb-10 leading-relaxed">
              Trade anytime, anywhere with our fully integrated web and mobile platform.
              Monitor markets in real time and execute trades with precision.
            </p>

            {/* Feature checklist */}
            <ul className="space-y-4 mb-10">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-[#2B4EFF] shrink-0" />
                  <span className="text-sm sm:text-base text-[#6B7080]">{f}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#2B4EFF] hover:gap-3 transition-all"
            >
              Get Started Free <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
