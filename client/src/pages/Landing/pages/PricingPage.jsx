import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Tag } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TopBanner from '../components/TopBanner';
import PricingTierCard from '../components/PricingTierCard';
import '../landing.css';

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
    features: [
      'No evaluation. Account is live from day one.',
      'NIFTY, BANKNIFTY and SENSEX — that\'s it. No unnecessary clutter.',
      'Same risk rules across all account sizes.',
      'Payouts go straight to your bank after KYC.',
      'WhatsApp support. We actually reply.',
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
    features: [
      'Single phase — no second round.',
      'Same instruments — NIFTY, BANKNIFTY, SENSEX.',
      'Targets and limits are written clearly. No surprises later.',
      'Pass once and your fee is credited back on first payout.',
      'Take your time. No deadline pressure.',
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
    features: [
      'Two phases — Qualifier first, then Validator.',
      'Cheapest entry point if you\'re testing the waters.',
      'Same NIFTY, BANKNIFTY and SENSEX trading.',
      'Phase 2 has slightly easier targets — you earned it.',
      'Fee credited back when you receive your first payout.',
    ],
  },
};

export default function PricingPage() {
  const [tab, setTab] = useState('Instant');
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  const applyCoupon = () => {
    if (coupon.trim()) {
      setCouponApplied(true);
      setTimeout(() => setCouponApplied(false), 3000);
    }
  };

  const activePlan = plans[tab];

  return (
    <div className="landing-page min-h-screen bg-white">
      <TopBanner />
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 md:pt-44 md:pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-[#2B4EFF] uppercase tracking-widest mb-4">Pricing</p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em' }} className="text-[#0D0F1A] mb-6">
            One fee. <span className="text-[#2B4EFF]">No monthly charges.</span>
          </h1>
          <p className="text-base sm:text-lg text-[#6B7080] max-w-2xl mx-auto leading-relaxed">
            We kept it simple. Pick a plan, pay once, trade. Account sizes from ₹1 Lakh
            up to ₹50 Lakhs. The fee comes back to you on your first payout.
          </p>
        </div>
      </section>

      {/* Tab switcher + Pricing */}
      <section className="px-6 pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto">

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {activePlan.tiers.map((tier) => (
              <PricingTierCard key={tier.capital} tier={tier} plan={tab} />
            ))}
          </div>

          {/* What's included */}
          <div className="bg-[#FAFBFD] border border-[#E8EAF0] rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto">
            <h3 className="text-lg font-bold text-[#0D0F1A] mb-2">
              What you get with {tab}
            </h3>
            <p className="text-sm text-[#6B7080] mb-5">Same across every account size in this plan.</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activePlan.features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check size={16} className="text-[#2B4EFF] shrink-0 mt-0.5" />
                  <span className="text-sm text-[#6B7080]">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Coupon / Referral Section */}
      <section className="py-14 md:py-20 px-6 bg-[#0C0C1D]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(43,78,255,0.15)] border border-[rgba(43,78,255,0.3)] mb-5">
            <Tag size={14} className="text-[#2B4EFF]" />
            <span className="text-xs font-semibold text-[#2B4EFF] uppercase tracking-widest">Coupon code</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }} className="text-white mb-4">
            Got a code from someone? <span className="text-[#2B4EFF]">Use it here.</span>
          </h2>
          <p className="text-base text-[#9AA0B4] mb-8 max-w-2xl mx-auto">
            If a YouTuber, mentor or trader friend shared their code, drop it in.
            You save on the fee, they get credited for the referral. Fair on both sides.
          </p>

          <div className="max-w-md mx-auto">
            <div className="flex gap-3">
              <input
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="ENTER CODE (e.g. RAJESH10)"
                className="flex-1 px-5 py-3.5 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] text-white text-sm placeholder-[#9AA0B4] focus:outline-none focus:border-[#2B4EFF] transition-all uppercase tracking-wider"
              />
              <button
                onClick={applyCoupon}
                className="px-6 py-3.5 rounded-full bg-[#2B4EFF] text-white font-semibold text-sm hover:bg-[#4B6AFF] transition-all shrink-0"
              >
                Apply
              </button>
            </div>
            {couponApplied && (
              <p className="text-sm text-emerald-400 mt-3">
                Got it. "{coupon}" will show up at checkout.
              </p>
            )}
            <p className="text-xs text-[#9AA0B4] mt-4">
              Codes are checked at checkout. We pay our partners every month, on time.
            </p>
          </div>
        </div>
      </section>

      {/* Become an Affiliate / Influencer */}
      <section className="py-14 md:py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }} className="text-[#0D0F1A] mb-6">
            Run a trading channel or mentor traders?
          </h2>
          <p className="text-base sm:text-lg text-[#6B7080] mb-8 max-w-2xl mx-auto">
            We work with creators and educators across India. You get your own code, a dashboard
            to see who signed up, and a payout every month. No paperwork drama.
          </p>
          <Link to="/contact-us" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#2B4EFF] text-white font-semibold text-sm shadow-[0_6px_20px_rgba(43,78,255,0.3)] hover:bg-[#4B6AFF] transition-all">
            Talk to us <ArrowRight size={16} />
          </Link>
          <p className="text-xs text-[#6B7080] mt-4">Usually replies within a day.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
