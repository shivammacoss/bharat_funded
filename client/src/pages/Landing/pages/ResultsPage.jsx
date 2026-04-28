import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TopBanner from '../components/TopBanner';
import '../landing.css';

const highlights = [
  { value: '₹47,00,000+', label: 'Total rewards paid to traders since launch' },
  { value: '312', label: 'Evaluations successfully completed' },
  { value: '89%', label: 'Of funded traders received payout within 7 days' },
  { value: '23 days', label: 'Average time to pass an evaluation' },
];

const recentPayouts = [
  { initials: 'VN', name: 'Vikram N.', city: 'Pune', plan: '5L Growth', amount: '₹62,400', date: 'April 2025', days: '8 days' },
  { initials: 'AS', name: 'Ananya S.', city: 'Bangalore', plan: '10L Pro', amount: '₹1,41,000', date: 'April 2025', days: '14 days' },
  { initials: 'RG', name: 'Rohit G.', city: 'Delhi', plan: '2L Starter', amount: '₹18,200', date: 'March 2025', days: '11 days' },
  { initials: 'MK', name: 'Meera K.', city: 'Chennai', plan: '5L Growth', amount: '₹54,800', date: 'March 2025', days: '19 days' },
  { initials: 'PJ', name: 'Pradeep J.', city: 'Mumbai', plan: '10L Pro', amount: '₹1,78,500', date: 'March 2025', days: '12 days' },
  { initials: 'SK', name: 'Suresh K.', city: 'Hyderabad', plan: '2L Starter', amount: '₹21,600', date: 'February 2025', days: '22 days' },
  { initials: 'NP', name: 'Neha P.', city: 'Ahmedabad', plan: '5L Growth', amount: '₹48,300', date: 'February 2025', days: '16 days' },
  { initials: 'DM', name: 'Deepak M.', city: 'Jaipur', plan: '10L Pro', amount: '₹2,04,000', date: 'February 2025', days: '9 days' },
];

const testimonials = [
  {
    initials: 'VN',
    name: 'Vikram Nair',
    role: 'Intraday Trader, Pune',
    quote: 'I was sceptical at first. Every prop firm I had seen was either US-based or had hidden conditions. Bharath Funded Trader was different — INR payments, Indian market hours, and the rules were exactly what they said. I passed in 8 days and received my payout in my bank account within a week. No drama.',
  },
  {
    initials: 'AS',
    name: 'Ananya Singh',
    role: 'Options Trader, Bangalore',
    quote: 'I have been trading BANKNIFTY options for four years. The evaluation forced me to be more disciplined with my daily loss limits. Honestly, the structure made me a better trader. The payout process was clean — KYC, verification, bank transfer. Done.',
  },
  {
    initials: 'DM',
    name: 'Deepak Mehta',
    role: 'Full-time Trader, Jaipur',
    quote: 'What convinced me was seeing other traders get paid. I checked their results page, verified the numbers, and decided to try the 10L Pro plan. Took me 9 trading days. The team was responsive when I had questions about KYC. Payout came through as promised.',
  },
];

export default function ResultsPage() {
  return (
    <div className="landing-page min-h-screen bg-white">
      <TopBanner />
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 md:pt-44 md:pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-[#2B4EFF] uppercase tracking-widest mb-4">Results</p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em' }} className="text-[#0D0F1A] mb-6">
            Real traders. Real <span className="text-[#2B4EFF]">payouts</span>.
          </h1>
          <p className="text-base sm:text-lg text-[#6B7080] max-w-2xl mx-auto leading-relaxed">
            We publish our results openly. No fake screenshots, no inflated numbers.
            Every payout listed here was earned through disciplined, rule-based trading.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="pb-12 md:pb-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((h) => (
            <div key={h.label} className="border border-[#E8EAF0] rounded-2xl p-6 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0D0F1A] mb-2" style={{ letterSpacing: '-0.03em' }}>{h.value}</div>
              <p className="text-sm text-[#6B7080]">{h.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Payouts Table */}
      <section className="py-14 md:py-24 px-6 bg-[#0C0C1D]">
        <div className="max-w-5xl mx-auto">
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }} className="text-white mb-4 text-center">
            Recent <span className="text-[#2B4EFF]">payouts</span>
          </h2>
          <p className="text-base text-[#9AA0B4] text-center mb-8 md:mb-12">Privacy-first: we show initials and city only. Full verification available on request.</p>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.08)]">
                  <th className="text-xs font-semibold text-[#9AA0B4] uppercase tracking-wider pb-4">Trader</th>
                  <th className="text-xs font-semibold text-[#9AA0B4] uppercase tracking-wider pb-4">Plan</th>
                  <th className="text-xs font-semibold text-[#9AA0B4] uppercase tracking-wider pb-4">Payout</th>
                  <th className="text-xs font-semibold text-[#9AA0B4] uppercase tracking-wider pb-4">Duration</th>
                  <th className="text-xs font-semibold text-[#9AA0B4] uppercase tracking-wider pb-4">Month</th>
                </tr>
              </thead>
              <tbody>
                {recentPayouts.map((p, i) => (
                  <tr key={i} className="border-b border-[rgba(255,255,255,0.05)]">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#2B4EFF] flex items-center justify-center text-white text-xs font-bold shrink-0">{p.initials}</div>
                        <div>
                          <div className="text-sm font-semibold text-white">{p.name}</div>
                          <div className="text-xs text-[#9AA0B4]">{p.city}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-sm text-[#9AA0B4]">{p.plan}</td>
                    <td className="py-4 pr-4 text-sm font-bold text-emerald-400">{p.amount}</td>
                    <td className="py-4 pr-4 text-sm text-[#9AA0B4]">{p.days}</td>
                    <td className="py-4 text-sm text-[#9AA0B4]">{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-14 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }} className="text-[#0D0F1A] mb-8 md:mb-12 text-center">
            In their <span className="text-[#2B4EFF]">own words</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="border border-[#E8EAF0] rounded-2xl p-6 sm:p-8">
                <p className="text-sm text-[#6B7080] leading-relaxed mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-[#E8EAF0]">
                  <div className="w-10 h-10 rounded-full bg-[#0D0F1A] flex items-center justify-center text-white text-xs font-bold">{t.initials}</div>
                  <div>
                    <div className="text-sm font-bold text-[#0D0F1A]">{t.name}</div>
                    <div className="text-xs text-[#6B7080]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-20 px-6 bg-[#FAFBFD]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }} className="text-[#0D0F1A] mb-6">
            Your name could be on this list
          </h2>
          <p className="text-base text-[#6B7080] mb-8">Start your evaluation, trade with discipline, and earn real rewards.</p>
          <Link to="/pricing" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#2B4EFF] text-white font-semibold text-sm shadow-[0_6px_20px_rgba(43,78,255,0.3)] hover:bg-[#4B6AFF] transition-all">
            View Plans <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
