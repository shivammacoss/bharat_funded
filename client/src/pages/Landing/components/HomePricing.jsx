import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const plans = {
  'Instant': {
    description: 'Skip the evaluation. Pay the fee, get your account, start trading the same day. Simple.',
    tiers: [
      { capital: '₹1,00,000',  price: '₹6,000'  },
      { capital: '₹2,00,000',  price: '₹10,000' },
      { capital: '₹5,00,000',  price: '₹18,000', popular: true },
      { capital: '₹10,00,000', price: '₹29,000' },
      { capital: '₹25,00,000', price: '₹50,000' },
    ],
  },
  '1-Step': {
    description: 'One evaluation phase. Hit the target without breaking the rules and you\'re funded. Most traders pick this one.',
    tiers: [
      { capital: '₹1,00,000',  price: '₹4,600'  },
      { capital: '₹2,00,000',  price: '₹7,600'  },
      { capital: '₹5,00,000',  price: '₹12,600', popular: true },
      { capital: '₹10,00,000', price: '₹19,600' },
      { capital: '₹25,00,000', price: '₹35,000' },
      { capital: '₹50,00,000', price: '₹55,000' },
    ],
  },
  '2-Step': {
    description: 'Two phases, lowest cost. Built for traders who want to prove themselves without paying upfront for instant access.',
    tiers: [
      { capital: '₹1,00,000',  price: '₹3,000'  },
      { capital: '₹2,00,000',  price: '₹5,000'  },
      { capital: '₹5,00,000',  price: '₹8,000', popular: true },
      { capital: '₹10,00,000', price: '₹13,000' },
      { capital: '₹25,00,000', price: '₹22,000' },
      { capital: '₹50,00,000', price: '₹36,000' },
    ],
  },
};

export default function HomePricing() {
  const [tab, setTab] = useState('Instant');
  const activePlan = plans[tab];

  return (
    <section className="bg-white py-14 md:py-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-10 md:mb-14 max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-[#2B4EFF] uppercase tracking-widest mb-4">Pricing</p>
          <h2
            className="font-extrabold text-[#0D0F1A] tracking-[-0.02em] font-manrope mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            Pick your <span className="text-[#2B4EFF]">funded account</span>
          </h2>
          <p className="text-base sm:text-lg text-[#6B7080]">
            One fee. No monthly charges. The fee comes back to you on your first payout.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8 md:mb-10">
          <div className="inline-flex bg-[#F0F2F8] rounded-full p-1 flex-wrap">
            {Object.keys(plans).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 sm:px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  tab === t
                    ? 'bg-[#2B4EFF] text-white shadow-[0_4px_12px_rgba(43,78,255,0.3)]'
                    : 'text-[#6B7080] hover:text-[#0D0F1A]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <p className="text-center text-base text-[#6B7080] max-w-2xl mx-auto mb-10 md:mb-12">
          {activePlan.description}
        </p>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {activePlan.tiers.map((tier) => (
            <div
              key={tier.capital}
              className={`rounded-2xl p-6 sm:p-8 transition-all relative ${
                tier.popular
                  ? 'bg-[#0C0C1D] text-white border-2 border-[#2B4EFF] shadow-[0_8px_40px_rgba(43,78,255,0.2)]'
                  : 'bg-white border border-[#E8EAF0] shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:border-[#2B4EFF] hover:shadow-[0_8px_32px_rgba(43,78,255,0.08)]'
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2B4EFF] text-white text-xs font-bold px-4 py-1 rounded-full">
                  Most chosen
                </span>
              )}

              <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${tier.popular ? 'text-[#9AA0B4]' : 'text-[#6B7080]'}`}>
                Account Size
              </p>
              <div className={`text-3xl sm:text-4xl font-extrabold mb-4 ${tier.popular ? 'text-white' : 'text-[#0D0F1A]'}`} style={{ letterSpacing: '-0.03em' }}>
                {tier.capital}
              </div>

              <div className={`pb-5 mb-5 border-b ${tier.popular ? 'border-[rgba(255,255,255,0.1)]' : 'border-[#E8EAF0]'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${tier.popular ? 'text-[#9AA0B4]' : 'text-[#6B7080]'}`}>
                  One-time fee
                </p>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#2B4EFF]">{tier.price}</span>
              </div>

              <Link
                to="/register"
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold transition-all ${
                  tier.popular
                    ? 'bg-[#2B4EFF] text-white hover:bg-[#4B6AFF]'
                    : 'border border-[#E8EAF0] text-[#0D0F1A] hover:border-[#2B4EFF] hover:text-[#2B4EFF]'
                }`}
              >
                Get this plan <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>

        {/* See full pricing CTA */}
        <div className="text-center">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#2B4EFF] hover:gap-3 transition-all"
          >
            See full pricing details <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
