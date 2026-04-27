import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TopBanner from '../components/TopBanner';
import '../landing.css';

const challenges = [
  {
    name: '1 Step Challenge',
    tagline: 'One phase. Pass once and you\'re funded.',
    description: 'A single evaluation round for traders who already know what they\'re doing. Hit the target, respect the rules, get the account.',
    phases: [
      {
        label: 'Single phase',
        rules: [
          { key: 'Profit Target', value: '10%' },
          { key: 'Daily Drawdown', value: '4%' },
          { key: 'Max Drawdown', value: '8%' },
          { key: 'Minimum Trading Days', value: '5 days' },
          { key: 'Max one-day profit', value: '40% of target' },
          { key: 'News trading', value: 'Allowed' },
        ],
      },
    ],
  },
  {
    name: '2 Step Challenge',
    tagline: 'Two phases, lower entry fee. Built for steady traders.',
    description: 'Split the target across two rounds. Easier daily numbers, more breathing room. The cheapest way to get funded.',
    phases: [
      {
        label: 'Phase 1 — Qualifier',
        rules: [
          { key: 'Profit Target', value: '8%' },
          { key: 'Daily Drawdown', value: '4%' },
          { key: 'Max Drawdown', value: '8%' },
          { key: 'Minimum Trading Days', value: '5 days' },
          { key: 'Max one-day profit', value: '40% of target' },
        ],
      },
      {
        label: 'Phase 2 — Validator',
        rules: [
          { key: 'Profit Target', value: '5%' },
          { key: 'Daily Drawdown', value: '4%' },
          { key: 'Max Drawdown', value: '8%' },
          { key: 'Minimum Trading Days', value: '5 days' },
          { key: 'Max one-day profit', value: '40% of target' },
        ],
      },
    ],
  },
  {
    name: 'Instant',
    tagline: 'No evaluation. Get the account, start trading.',
    description: 'Skip the testing phase entirely. Pay the fee and your funded account is live the same day. Tighter rules, instant access.',
    phases: [
      {
        label: 'Funded from day one',
        rules: [
          { key: 'Profit Target', value: '8%' },
          { key: 'Daily Drawdown', value: '3%' },
          { key: 'Max Drawdown', value: '6%' },
          { key: 'Minimum Trading Days', value: '5 days' },
          { key: 'Consistency Rule', value: '30%' },
        ],
      },
    ],
  },
];

export default function ChallengesPage() {
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
          {challenges.map((c, idx) => (
            <div
              key={c.name}
              className={`rounded-2xl overflow-hidden border ${
                idx === 0 ? 'border-[#2B4EFF] shadow-[0_8px_40px_rgba(43,78,255,0.12)]' : 'border-[#E8EAF0] shadow-[0_2px_16px_rgba(0,0,0,0.04)]'
              }`}
            >
              {/* Header */}
              <div className="px-6 sm:px-10 py-8 bg-[#FAFBFD] border-b border-[#E8EAF0]">
                <div className="flex flex-wrap items-baseline gap-3 mb-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0D0F1A]" style={{ letterSpacing: '-0.02em' }}>{c.name}</h2>
                  <span className="text-sm text-[#2B4EFF] font-medium">{c.tagline}</span>
                </div>
                <p className="text-sm sm:text-base text-[#6B7080] leading-relaxed max-w-3xl">
                  {c.description}
                </p>
              </div>

              {/* Phases */}
              <div className="divide-y divide-[#E8EAF0]">
                {c.phases.map((phase) => (
                  <div key={phase.label} className="px-6 sm:px-10 py-6">
                    <p className="text-xs font-bold text-[#2B4EFF] uppercase tracking-widest mb-4">{phase.label}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                      {phase.rules.map((r) => (
                        <div key={r.key}>
                          <p className="text-xs text-[#6B7080] mb-1">{r.key}</p>
                          <p className="text-sm sm:text-base font-bold text-[#0D0F1A]">{r.value}</p>
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
          ))}
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
          <p className="text-base sm:text-lg text-[#6B7080] mb-8">Head over to pricing, pick an account size, and let\'s get started.</p>
          <Link to="/pricing" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#2B4EFF] text-white font-semibold text-sm shadow-[0_6px_20px_rgba(43,78,255,0.3)] hover:bg-[#4B6AFF] transition-all">
            View Pricing <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
