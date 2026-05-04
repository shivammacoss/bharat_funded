import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TopBanner from '../components/TopBanner';
import '../landing.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Map admin-defined Challenge docs into the phase/rule structure this page
// renders. stepsCount drives the layout: 0 = Instant (single phase), 1 = single
// qualifier, 2 = qualifier + validator.
function buildPhases(c) {
  const r = c.rules || {};
  const fmtPct = (v) => (v == null || v === '' ? null : `${v}%`);
  const fmtDays = (v) => (v == null || v === '' ? null : `${v} days`);
  const fmtBool = (v) => (v ? 'Allowed' : 'Not allowed');

  // Common rules shown on every phase block
  const baseRules = (target) => [
    target ? { key: 'Profit Target', value: target } : null,
    fmtPct(r.maxDailyDrawdownPercent) && { key: 'Daily Drawdown', value: fmtPct(r.maxDailyDrawdownPercent) },
    fmtPct(r.maxOverallDrawdownPercent) && { key: 'Max Drawdown', value: fmtPct(r.maxOverallDrawdownPercent) },
    r.maxOneDayProfitPercentOfTarget != null && { key: 'Max one-day profit', value: `${r.maxOneDayProfitPercentOfTarget}% of target` },
    fmtDays(r.tradingDaysRequired) && { key: 'Min Trading Days', value: fmtDays(r.tradingDaysRequired) },
    fmtDays(r.challengeExpiryDays) && { key: 'Challenge Expiry', value: fmtDays(r.challengeExpiryDays) },
    { key: 'News trading', value: fmtBool(r.allowNewsTrading) }
  ].filter(Boolean);

  if (c.stepsCount === 2) {
    return [
      { label: 'Phase 1 — Qualifier', rules: baseRules(fmtPct(r.profitTargetPhase1Percent)) },
      { label: 'Phase 2 — Validator', rules: baseRules(fmtPct(r.profitTargetPhase2Percent)) }
    ];
  }
  if (c.stepsCount === 1) {
    return [{ label: 'Single phase', rules: baseRules(fmtPct(r.profitTargetPhase1Percent)) }];
  }
  // Instant (0-step)
  return [{ label: 'Funded from day one', rules: baseRules(fmtPct(r.profitTargetInstantPercent)) }];
}

function challengeTagline(c) {
  if (c.stepsCount === 0) return 'No evaluation. Get the account, start trading.';
  if (c.stepsCount === 1) return 'One phase. Pass once and you\'re funded.';
  return 'Two phases, lower entry fee. Built for steady traders.';
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/prop/challenges`)
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.challenges)) {
          // Display order: Instant, 1-Step, 2-Step (Instant first as the
          // headline product).
          const order = { 0: 0, 1: 1, 2: 2 };
          const sorted = [...data.challenges].sort((a, b) => (order[a.stepsCount] ?? 9) - (order[b.stepsCount] ?? 9));
          setChallenges(sorted);
        }
      })
      .catch(() => { /* network/API failure leaves the list empty — we render an empty state */ })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="landing-page min-h-screen bg-white">
      <TopBanner />
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 md:pt-44 md:pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-[#2B4EFF] uppercase tracking-widest mb-4">Challenges</p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em' }} className="text-[#0D0F1A] mb-6">
            Pick the path that <span className="text-[#2B4EFF]">fits your style</span>
          </h1>
          <p className="text-base sm:text-lg text-[#6B7080] max-w-2xl mx-auto leading-relaxed">
            Three challenges, one goal — get you funded. The rules are short, the numbers are
            published, and there are no hidden conditions.
          </p>
        </div>
      </section>

      {/* Challenges */}
      <section className="pb-16 md:pb-24 px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {loading && (
            <div className="text-center text-[#6B7080] py-10">Loading challenges…</div>
          )}
          {!loading && challenges.length === 0 && (
            <div className="text-center text-[#6B7080] py-10">No challenges available right now. Please check back soon.</div>
          )}
          {!loading && challenges.map((c, idx) => {
            const phases = buildPhases(c);
            return (
              <div
                key={c._id || c.name}
                className={`rounded-2xl overflow-hidden border ${
                  idx === 0 ? 'border-[#2B4EFF] shadow-[0_8px_40px_rgba(43,78,255,0.12)]' : 'border-[#E8EAF0] shadow-[0_2px_16px_rgba(0,0,0,0.04)]'
                }`}
              >
                {/* Header */}
                <div className="px-6 sm:px-10 py-8 bg-[#FAFBFD] border-b border-[#E8EAF0]">
                  <div className="flex flex-wrap items-baseline gap-3 mb-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0D0F1A]" style={{ letterSpacing: '-0.02em' }}>{c.name}</h2>
                    <span className="text-sm text-[#2B4EFF] font-medium">{challengeTagline(c)}</span>
                  </div>
                  <p className="text-sm sm:text-base text-[#6B7080] leading-relaxed max-w-3xl">
                    {c.description || 'Trade with our capital. Follow the rules, hit the target, get paid.'}
                  </p>
                </div>

                {/* Phases */}
                <div className="divide-y divide-[#E8EAF0]">
                  {phases.map((phase) => (
                    <div key={phase.label} className="px-6 sm:px-10 py-6">
                      <p className="text-xs font-bold text-[#2B4EFF] uppercase tracking-widest mb-4">{phase.label}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                        {phase.rules.map((rule) => (
                          <div key={rule.key}>
                            <p className="text-xs text-[#6B7080] mb-1">{rule.key}</p>
                            <p className="text-sm sm:text-base font-bold text-[#0D0F1A]">{rule.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="px-6 sm:px-10 py-5 bg-[#FAFBFD] border-t border-[#E8EAF0] flex flex-wrap gap-4 items-center justify-between">
                  <p className="text-sm text-[#6B7080]">Ready to take the {c.name.toLowerCase()}?</p>
                  <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#2B4EFF] text-white text-sm font-semibold hover:bg-[#4B6AFF] transition-all">
                    See pricing <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Notes */}
      <section className="py-14 md:py-20 px-6 bg-[#0C0C1D]">
        <div className="max-w-4xl mx-auto">
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }} className="text-white mb-8 text-center">
            A few things you should know
          </h2>
          <div className="space-y-5 max-w-3xl mx-auto">
            {[
              {
                t: 'Daily DD vs Max DD',
                d: 'Daily Drawdown resets every trading day at 9:15 AM. Max Drawdown is the total loss limit from your peak — it never resets until you pass.',
              },
              {
                t: 'Why minimum trading days?',
                d: 'We want consistency, not luck. Five days proves the strategy is repeatable. One lucky session does not make you a trader.',
              },
              {
                t: 'Max one-day profit rule',
                d: 'No single day can contribute more than 40% of your total target. This stops people from passing on one massive trade.',
              },
              {
                t: 'Consistency rule (Instant only)',
                d: 'Your best trading day cannot be more than 30% of total profits. Keeps the playing field fair for funded traders.',
              },
              {
                t: 'News trading',
                d: 'Allowed on the 1-Step. Restricted on Instant accounts to manage risk. Trade RBI policy, budget day, results — all fair game on 1-Step.',
              },
            ].map((item) => (
              <div key={item.t} className="border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 sm:p-6 bg-[#141428]">
                <h3 className="text-base font-bold text-white mb-2">{item.t}</h3>
                <p className="text-sm text-[#9AA0B4] leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 md:py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }} className="text-[#0D0F1A] mb-6">
            Made up your mind?
          </h2>
          <p className="text-base sm:text-lg text-[#6B7080] mb-8">Head over to pricing, pick an account size, and let's get started.</p>
          <Link to="/pricing" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#2B4EFF] text-white font-semibold text-sm shadow-[0_6px_20px_rgba(43,78,255,0.3)] hover:bg-[#4B6AFF] transition-all">
            View Pricing <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
