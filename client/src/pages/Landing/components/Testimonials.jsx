import { useState } from 'react';
import { useScrollAnimation, useStaggerAnimation } from '../hooks/useScrollAnimation';

const markets = [
  {
    name: 'NIFTY 50',
    exchange: 'NSE',
    type: 'Index Futures & Options',
    lotSize: '25 units',
    description: 'India\'s benchmark index tracking the top 50 companies. The most liquid derivative in India — ideal for intraday scalping and momentum strategies.',
    highlight: true,
  },
  {
    name: 'BANKNIFTY',
    exchange: 'NSE',
    type: 'Index Futures & Options',
    lotSize: '15 units',
    description: 'Tracks 12 most liquid banking stocks. Known for higher volatility and wider intraday ranges — favoured by experienced traders who thrive on fast moves.',
    highlight: false,
  },
  {
    name: 'SENSEX',
    exchange: 'BSE',
    type: 'Index Futures & Options',
    lotSize: '10 units',
    description: 'India\'s oldest index representing 30 well-established companies. Lower lot size makes it accessible for tighter risk management and smaller positions.',
    highlight: false,
  },
];

export default function Testimonials() {
  const { ref: headerRef } = useScrollAnimation(0.1);
  // removed stagger animation to prevent cards disappearing
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="bg-[#0C0C1D] py-14 md:py-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div ref={headerRef} className="scroll-reveal mb-10 md:mb-16 text-center max-w-3xl mx-auto">
          <h2
            className="font-extrabold text-white tracking-[-0.02em] font-manrope mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            Trade India's Top{' '}
            <span className="text-[#2B4EFF]">Indices</span>
          </h2>
          <p className="text-base sm:text-lg text-[#9AA0B4] font-light">
            We focus on what Indian intraday traders know best — NIFTY, BANKNIFTY, and SENSEX. No forex, no crypto, no distractions.
          </p>
        </div>

        {/* Market Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {markets.map((m, index) => {
            const isActive = index === activeIndex;
            return (
              <div
                key={m.name}
                onMouseEnter={() => setActiveIndex(index)}
                className={`rounded-2xl p-6 sm:p-8 flex flex-col gap-4 cursor-pointer transition-all duration-300 ${
                  isActive
                    ? 'bg-[#2B4EFF] text-white border border-[rgba(255,255,255,0.15)] scale-[1.02]'
                    : 'bg-[#141428] text-white border border-[rgba(255,255,255,0.08)]'
                }`}
              >
                {/* Exchange badge + type */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    isActive ? 'bg-[rgba(255,255,255,0.2)] text-white' : 'bg-[rgba(43,78,255,0.15)] text-[#2B4EFF]'
                  }`}>
                    {m.exchange}
                  </span>
                  <span className={`text-xs ${isActive ? 'text-[rgba(255,255,255,0.7)]' : 'text-[#9AA0B4]'}`}>
                    {m.type}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                  {m.name}
                </h3>

                {/* Description */}
                <p className={`text-sm sm:text-base leading-relaxed flex-1 ${
                  isActive ? 'text-[rgba(255,255,255,0.85)]' : 'text-[#9AA0B4]'
                }`}>
                  {m.description}
                </p>

                {/* Lot size */}
                <div className={`pt-4 border-t ${isActive ? 'border-[rgba(255,255,255,0.15)]' : 'border-[rgba(255,255,255,0.08)]'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className={`text-xs ${isActive ? 'text-[rgba(255,255,255,0.6)]' : 'text-[#9AA0B4]'}`}>Lot Size</p>
                      <p className="text-sm font-bold">{m.lotSize}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isActive ? 'text-[rgba(255,255,255,0.6)]' : 'text-[#9AA0B4]'}`}>Allowed</p>
                      <p className="text-sm font-bold">Futures & Options Buy</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
