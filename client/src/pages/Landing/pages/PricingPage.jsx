import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Tag } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TopBanner from '../components/TopBanner';
import PricingTierCard from '../components/PricingTierCard';
import '../landing.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Map admin stepsCount → tab name shown on the pricing page.
const STEP_TO_TAB = { 0: 'Instant', 1: '1-Step', 2: '2-Step' };
const TAB_TO_STEP = { 'Instant': 0, '1-Step': 1, '2-Step': 2 };

// Static plan-level features per type — these describe the *experience* (KYC,
// payouts, support) rather than per-tier numbers, so they don't live in the
// admin Challenge schema. Edit here if marketing copy changes.
const FEATURES_BY_TAB = {
  'Instant': [
    'No evaluation. Account is live from day one.',
    'NIFTY, BANKNIFTY and SENSEX — that\'s it. No unnecessary clutter.',
    'Same risk rules across all account sizes.',
    'Payouts go straight to your bank after KYC.',
    'WhatsApp support. We actually reply.'
  ],
  '1-Step': [
    'Single phase — no second round.',
    'Same instruments — NIFTY, BANKNIFTY, SENSEX.',
    'Targets and limits are written clearly. No surprises later.',
    'Pass once and your fee is credited back on first payout.',
    'Take your time. No deadline pressure.'
  ],
  '2-Step': [
    'Two phases — Qualifier first, then Validator.',
    'Cheapest entry point if you\'re testing the waters.',
    'Same NIFTY, BANKNIFTY and SENSEX trading.',
    'Phase 2 has slightly easier targets — you earned it.',
    'Fee credited back when you receive your first payout.'
  ]
};

const DESC_BY_TAB = {
  'Instant': 'Skip the evaluation. Pay the fee, get your account, start trading the same day. Simple.',
  '1-Step': 'One evaluation phase. Hit the target without breaking the rules and you\'re funded. Most traders pick this one.',
  '2-Step': 'Two phases, lowest cost. Built for traders who want to prove themselves without paying upfront for instant access.'
};

const formatINR = (n) => {
  if (n == null || isNaN(n)) return '';
  return '₹' + Number(n).toLocaleString('en-IN');
};

export default function PricingPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Instant');
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/prop/challenges`)
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.challenges)) {
          setChallenges(data.challenges);
        }
      })
      .catch(() => { /* ignored — tabs render with empty tiers as a fallback */ })
      .finally(() => setLoading(false));
  }, []);

  // Pull WELCOME10 = 10% off from the top banner for the discounted price line
  // shown on each card. Coupon code text is intentionally hard-coded here so the
  // marketing card matches the banner copy without needing another admin field.
  const PROMO_CODE = 'WELCOME10';
  const PROMO_DISCOUNT = 0.10;

  // Build { tabName: { description, tiers: [{ fundSize, challengeFee, popular, label, rules }], features } }
  // from live admin challenges. Each tier card needs both pricing (for the top
  // block) and the rule snapshot (for the quick rules list under the price), so
  // we attach the parent challenge's rules onto every tier — same plan, same rules.
  const plans = useMemo(() => {
    const out = {};
    for (const c of challenges) {
      const tabName = STEP_TO_TAB[c.stepsCount];
      if (!tabName) continue;
      const r = c.rules || {};
      const target = c.stepsCount === 0
        ? r.profitTargetInstantPercent
        : r.profitTargetPhase1Percent;
      const cardRules = [
        target != null && { key: 'Profit Target', value: `${target}%` },
        r.maxDailyDrawdownPercent != null && { key: 'Daily Drawdown', value: `${r.maxDailyDrawdownPercent}%` },
        r.maxOverallDrawdownPercent != null && { key: 'Max Drawdown', value: `${r.maxOverallDrawdownPercent}%` },
        r.tradingDaysRequired != null && { key: 'Min Trading Days', value: `${r.tradingDaysRequired} days` }
      ].filter(Boolean);

      const rawTiers = (c.tiers && c.tiers.length > 0)
        ? c.tiers
        : [{ fundSize: c.fundSize, challengeFee: c.challengeFee, isPopular: true, label: '' }];

      const tiers = rawTiers.map(t => ({
        fundSize: t.fundSize,
        challengeFee: t.challengeFee,
        capital: formatINR(t.fundSize),
        price: formatINR(t.challengeFee),
        discountedPrice: formatINR(Math.round(t.challengeFee * (1 - PROMO_DISCOUNT))),
        popular: !!t.isPopular,
        label: t.label || '',
        rules: cardRules
      }));

      out[tabName] = {
        description: c.description || DESC_BY_TAB[tabName],
        tiers,
        features: FEATURES_BY_TAB[tabName]
      };
    }
    return out;
  }, [challenges]);

  const applyCoupon = () => {
    if (coupon.trim()) {
      setCouponApplied(true);
      setTimeout(() => setCouponApplied(false), 3000);
    }
  };

  // Always show all three tabs so users can see every plan type, even if the
  // admin hasn't published a challenge for one yet (we render an empty-state
  // message in that case instead of hiding the tab).
  const tabOrder = ['Instant', '1-Step', '2-Step'];
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
          {loading && (
            <div className="text-center text-[#6B7080] py-10">Loading pricing…</div>
          )}

          {!loading && (
            <>
              {/* Tabs — always render all three */}
              <div className="flex justify-center mb-8 md:mb-10">
                <div className="inline-flex bg-[#F0F2F8] border border-[#E8EAF0] rounded-full p-1 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                  {tabOrder.map((t) => (
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
                {activePlan?.description || DESC_BY_TAB[tab]}
              </p>

              {activePlan ? (
                <>
                  {/* Tier Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {activePlan.tiers.map((tier) => (
                      <PricingTierCard key={tier.capital + '-' + tier.price} tier={tier} plan={tab} />
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
                </>
              ) : (
                <div className="text-center bg-[#FAFBFD] border border-[#E8EAF0] rounded-2xl p-10 max-w-xl mx-auto">
                  <h3 className="text-lg font-bold text-[#0D0F1A] mb-2">{tab} plans coming soon</h3>
                  <p className="text-sm text-[#6B7080]">
                    Our team is finalising the {tab} challenges. In the meantime, check the other plans above.
                  </p>
                </div>
              )}
            </>
          )}
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
