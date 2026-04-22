import { Star } from 'lucide-react';
import { useScrollAnimation, useStaggerAnimation } from '../hooks/useScrollAnimation';

const experts = [
  {
    name: 'Rajesh Sharma',
    role: 'Equity & Derivatives Trader',
    avatar: 'RS',
    followers: '48.2K',
    rating: 4.9,
    color: 'bg-blue-600',
  },
  {
    name: 'Priya Mehta',
    role: 'Forex & Crypto Analyst',
    avatar: 'PM',
    followers: '31.7K',
    rating: 4.8,
    color: 'bg-violet-600',
  },
  {
    name: 'Arjun Kapoor',
    role: 'Commodity & Index Trader',
    avatar: 'AK',
    followers: '22.5K',
    rating: 4.7,
    color: 'bg-amber-600',
  },
  {
    name: 'Sneha Patel',
    role: 'US Stocks & ETF Specialist',
    avatar: 'SP',
    followers: '19.3K',
    rating: 4.9,
    color: 'bg-emerald-600',
  },
];

export default function Community() {
  const { ref: headerRef } = useScrollAnimation();
  const cardsRef = useStaggerAnimation(0.08, 90);

  return (
    <section className="bg-white py-24 px-6 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-[rgba(43,78,255,0.04)] rounded-full blur-[100px] pointer-events-none" />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div ref={headerRef} className="scroll-reveal mb-16 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(43,78,255,0.08)] border border-[rgba(43,78,255,0.15)] mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2B4EFF]" />
            <span className="text-xs font-semibold text-[#2B4EFF] uppercase tracking-widest">Community</span>
          </div>
          <h2
            className="font-manrope font-[800] tracking-[-0.02em] text-[#0D0F1A] mb-4"
            style={{ fontSize: 'clamp(1.875rem, 4vw, 3rem)' }}
          >
            Learn from Top Trading{' '}
            <span className="text-[#2B4EFF]">Experts</span>
          </h2>
          <p className="text-base sm:text-lg text-[#6B7080] font-light">
            Join a growing community of professional traders and financial educators who trust our platform.
          </p>
        </div>

        {/* Expert Cards */}
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {experts.map((expert) => (
            <div
              key={expert.name}
              className="stagger-child group p-6 flex flex-col gap-4 rounded-2xl bg-white border border-[#E8EAF0] shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:border-[#2B4EFF] transition-all"
            >
              {/* Avatar & Name */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full ${expert.color} flex items-center justify-center text-white font-bold text-sm font-manrope shrink-0`}
                >
                  {expert.avatar}
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0D0F1A] font-manrope">{expert.name}</div>
                  <div className="text-xs text-[#6B7080]">{expert.role}</div>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={
                      i < Math.floor(expert.rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-[#E8EAF0] fill-[#E8EAF0]'
                    }
                  />
                ))}
                <span className="text-xs text-[#6B7080] ml-1">{expert.rating}</span>
              </div>

              {/* Followers */}
              <div className="text-xs text-[#6B7080]">
                <span className="font-bold text-[#0D0F1A]">{expert.followers}</span> followers
              </div>

              {/* Follow Button */}
              <button className="w-full py-2 rounded-full border border-[rgba(43,78,255,0.2)] text-[#2B4EFF] text-xs font-bold uppercase tracking-wider hover:bg-[#2B4EFF] hover:text-white transition-all group-hover:border-[#2B4EFF]">
                Follow Expert
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
