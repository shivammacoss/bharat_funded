import { TrendingUp, IndianRupee, BarChart2, Landmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScrollAnimation, useStaggerAnimation } from '../hooks/useScrollAnimation';

const markets = [
  {
    icon: TrendingUp,
    title: 'NIFTY 50',
    desc: 'Trade NIFTY futures and options in a simulated environment with real-time data feeds.',
    tag: 'NIFTY FUT · NIFTY CE · NIFTY PE',
    stats: [{ label: 'Type', value: 'F&O' }, { label: 'Mode', value: 'Simulated' }],
  },
  {
    icon: BarChart2,
    title: 'BANKNIFTY',
    desc: 'Access BANKNIFTY futures and options with fast tick updates and live PnL tracking.',
    tag: 'BANKNIFTY FUT · CE · PE',
    stats: [{ label: 'Type', value: 'F&O' }, { label: 'Mode', value: 'Simulated' }],
  },
  {
    icon: Landmark,
    title: 'SENSEX',
    desc: 'Trade SENSEX futures and options on the simulated evaluation platform.',
    tag: 'SENSEX FUT · CE · PE',
    stats: [{ label: 'Type', value: 'F&O' }, { label: 'Mode', value: 'Simulated' }],
  },
  {
    icon: IndianRupee,
    title: 'INR-Only Platform',
    desc: 'All payments, evaluations, and payouts in Indian Rupees — no FX conversion needed.',
    tag: '₹ INR Only',
    stats: [{ label: 'Currency', value: '₹ INR' }, { label: 'Settlement', value: 'Direct' }],
  },
];

export default function MarketAccess() {
  const { ref: headerRef } = useScrollAnimation();
  const cardsRef = useStaggerAnimation(0.1, 100);

  return (
    <section id="markets" className="bg-white py-14 md:py-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">

          {/* Left column — heading + description */}
          <div ref={headerRef} className="scroll-reveal lg:w-5/12 lg:sticky lg:top-32">
            <h2
              className="text-[#0D0F1A] font-manrope mb-5"
              style={{
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              Trade Indian Indices on{' '}
              <span className="text-[#2B4EFF]">One Platform</span>
            </h2>
            <p className="text-base sm:text-lg text-[#6B7080]" style={{ lineHeight: 1.7 }}>
              NIFTY, BANKNIFTY & SENSEX — all in one simulated evaluation platform.
            </p>

            {/* CTA */}
            <div className="mt-10">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#2B4EFF] text-white font-semibold text-sm shadow-[0_6px_20px_rgba(43,78,255,0.3)] hover:bg-[#4B6AFF] hover:shadow-[0_8px_28px_rgba(43,78,255,0.4)] transition-all font-manrope"
              >
                Start Your Evaluation
                <span className="w-5 h-5 rounded-full bg-[rgba(255,255,255,0.2)] flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5h6M5 2l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>

          {/* Right column — 2x2 cards grid */}
          <div ref={cardsRef} className="lg:w-7/12 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {markets.map((market) => {
              const Icon = market.icon;
              return (
                <div
                  key={market.title}
                  className="stagger-child group bg-white border border-[#E8EAF0] rounded-2xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:border-[#2B4EFF] hover:shadow-[0_8px_30px_rgba(43,78,255,0.08)] transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-[rgba(43,78,255,0.08)] flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-[#2B4EFF]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#0D0F1A] font-manrope leading-tight">{market.title}</h3>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#2B4EFF]">{market.tag}</span>
                    </div>
                  </div>

                  <p className="text-sm text-[#6B7080] leading-relaxed mb-3">
                    {market.desc}
                  </p>

                  <div className="flex gap-6 border-t border-[#E8EAF0] pt-3">
                    {market.stats.map((s) => (
                      <div key={s.label}>
                        <div className="text-xs font-bold text-[#0D0F1A] font-manrope">{s.value}</div>
                        <div className="text-[10px] text-[#6B7080]">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
