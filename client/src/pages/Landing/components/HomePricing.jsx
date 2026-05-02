import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PricingTierCard from './PricingTierCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// admin stepsCount → tab label
const STEP_TO_TAB = { 0: 'Instant', 1: '1-Step', 2: '2-Step' };

const DESC_BY_TAB = {
  'Instant': 'Skip the evaluation. Pay the fee, get your account, start trading the same day. Simple.',
  '1-Step': 'One evaluation phase. Hit the target without breaking the rules and you\'re funded. Most traders pick this one.',
  '2-Step': 'Two phases, lowest cost. Built for traders who want to prove themselves without paying upfront for instant access.'
};

function formatINR(n) {
  const v = Number(n) || 0;
  return `₹${v.toLocaleString('en-IN')}`;
}

export default function HomePricing() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Instant');

  useEffect(() => {
    fetch(`${API_URL}/api/prop/challenges`)
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.challenges)) setChallenges(data.challenges);
      })
      .catch(() => { /* network failure → render empty state */ })
      .finally(() => setLoading(false));
  }, []);

  // Build live plans dictionary keyed by tab name. Each tier card pulls
  // pricing from the admin's published challenge tiers.
  const plans = useMemo(() => {
    const out = {};
    for (const c of challenges) {
      const tabName = STEP_TO_TAB[c.stepsCount];
      if (!tabName) continue;
      const rawTiers = (c.tiers && c.tiers.length > 0)
        ? c.tiers
        : [{ fundSize: c.fundSize, challengeFee: c.challengeFee, isPopular: true, label: '' }];
      const tiers = rawTiers.map(t => ({
        capital: formatINR(t.fundSize),
        price: formatINR(t.challengeFee),
        popular: !!t.isPopular,
        label: t.label || ''
      }));
      out[tabName] = {
        description: c.description || DESC_BY_TAB[tabName],
        tiers
      };
    }
    return out;
  }, [challenges]);

  const tabOrder = ['Instant', '1-Step', '2-Step'];
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

        {/* Tier Cards / Loading / Empty state */}
        {loading ? (
          <div className="text-center text-[#6B7080] py-10">Loading pricing…</div>
        ) : activePlan && activePlan.tiers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {activePlan.tiers.map((tier, i) => (
              <PricingTierCard key={tier.capital + '-' + tier.price + '-' + i} tier={tier} plan={tab} />
            ))}
          </div>
        ) : (
          <div className="text-center bg-[#FAFBFD] border border-[#E8EAF0] rounded-2xl p-10 max-w-xl mx-auto mb-10">
            <h3 className="text-lg font-bold text-[#0D0F1A] mb-2">{tab} plans coming soon</h3>
            <p className="text-sm text-[#6B7080]">
              Our team is finalising the {tab} challenges. In the meantime, check the other plans above.
            </p>
          </div>
        )}

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
