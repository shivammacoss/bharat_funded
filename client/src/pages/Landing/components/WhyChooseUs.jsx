import {
  BadgeIndianRupee, BarChart2, Zap, Layers, ShieldCheck,
  HeadphonesIcon, LayoutDashboard, BookOpen, Wallet
} from 'lucide-react';
import { useScrollAnimation, useStaggerAnimation } from '../hooks/useScrollAnimation';

const features = [
  { icon: BarChart2,       title: 'Live Market Data',             desc: 'Real-time NIFTY & BANKNIFTY feeds with fast tick updates inside a clean trading terminal.' },
  { icon: ShieldCheck,     title: 'Built-in Risk Rules',          desc: 'Max Daily Loss and Max Drawdown enforced automatically — trade with discipline by design.' },
  { icon: Zap,             title: 'Instant Order Execution',      desc: 'Fast simulated order execution with live PnL tracking and open position monitoring.' },
  { icon: BadgeIndianRupee,title: 'India-First Platform',         desc: 'INR payments, Indian market hours, and instruments designed for Indian index traders.' },
  { icon: LayoutDashboard, title: 'Performance Analytics',        desc: 'Daily session reports, behavior tracking, and consistency scores to help you improve.' },
  { icon: Wallet,          title: 'Transparent Payouts',          desc: 'Clear reward eligibility, public proof of payouts, and no hidden conditions.' },
  { icon: Layers,          title: 'Multiple Evaluation Plans',    desc: '1-Step and 2-Step evaluation options designed for different trading styles.' },
  { icon: HeadphonesIcon,  title: 'Dedicated Support',            desc: 'Expert assistance available via chat and email for all your queries.' },
  { icon: BookOpen,        title: 'Structured Rules',             desc: 'Clear profit targets, drawdown limits, and intraday square-off rules for every plan.' },
];

export default function WhyChooseUs() {
  const { ref: headerRef } = useScrollAnimation();
  const cardsRef = useStaggerAnimation(0.08, 70);

  return (
    <section id="tools" className="bg-[#0C0C1D] py-14 md:py-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div ref={headerRef} className="scroll-reveal mb-10 md:mb-16 max-w-2xl">
          <h2
            className="text-white font-manrope mb-5"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            Why Traders Choose{' '}
            <span className="text-[#2B4EFF]">Bharath Funded Trader</span>
          </h2>
          <p className="text-base sm:text-lg text-[#9AA0B4]" style={{ lineHeight: 1.7 }}>
            Everything you need to prove your trading skills — built into one powerful platform.
          </p>
        </div>

        {/* Feature rows */}
        <div ref={cardsRef}>
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="stagger-child border-t border-[rgba(255,255,255,0.08)] py-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-[rgba(43,78,255,0.1)] flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-[#2B4EFF]" />
                </div>

                {/* Title */}
                <h3 className="text-white text-lg sm:text-xl font-bold font-manrope sm:w-64 shrink-0">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-[#9AA0B4] text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            );
          })}
          {/* Bottom border for last row */}
          <div className="border-t border-[rgba(255,255,255,0.08)]" />
        </div>

      </div>
    </section>
  );
}
