import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PricingTierCard from './PricingTierCard';

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
          <div className="inline-flex bg-[#F0F2F8] border border-[#E8EAF0] rounded-full p-1 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            {Object.keys(plans).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 sm:px-7 py-2.5 rounded-full text-sm font-bold transition-all ${
                  tab === t
                    ? 'bg-[#2B4EFF] text-white shadow-[0_4px_12px_rgba(43,78,255,0.35)]'
                    : 'text-[#0D0F1A] hover:text-[#2B4EFF]'
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
            <PricingTierCard key={tier.capital} tier={tier} plan={tab} />
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
