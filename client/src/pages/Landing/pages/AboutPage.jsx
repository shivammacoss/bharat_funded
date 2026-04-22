import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../landing.css';

const values = [
  {
    number: '01',
    title: 'Transparency First',
    desc: 'Every rule, every fee, every condition is documented publicly. No hidden clauses, no surprises. What you see is what you get.',
  },
  {
    number: '02',
    title: 'Discipline Over Luck',
    desc: 'We reward consistent, rule-based trading — not gambling. Our evaluation is designed to filter disciplined traders who manage risk properly.',
  },
  {
    number: '03',
    title: 'Built for India',
    desc: 'INR payments, Indian market hours, NIFTY and BANKNIFTY focus. This platform was built ground-up for Indian intraday traders.',
  },
  {
    number: '04',
    title: 'Real Rewards',
    desc: 'Pass the evaluation, complete KYC, and receive performance-based payouts directly to your bank account. No middlemen.',
  },
];

const team = [
  { initials: 'RK', name: 'Rajesh Kumar', role: 'Founder & CEO', bio: '15+ years in Indian capital markets. Former prop desk head at a Mumbai-based trading firm.' },
  { initials: 'SP', name: 'Sneha Patel', role: 'Head of Risk', bio: 'Ex-risk analyst at a leading brokerage. Designs our evaluation rules and drawdown frameworks.' },
  { initials: 'AV', name: 'Amit Verma', role: 'CTO', bio: 'Full-stack engineer with a decade of fintech experience. Built the simulated trading engine from scratch.' },
];

export default function AboutPage() {
  return (
    <div className="landing-page min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-14 md:pt-44 md:pb-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-[#2B4EFF] uppercase tracking-widest mb-4">About Us</p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em' }} className="text-[#0D0F1A] mb-6">
            We believe every skilled Indian trader deserves access to{' '}
            <span className="text-[#2B4EFF]">structured capital</span>
          </h1>
          <p className="text-base sm:text-lg text-[#6B7080] max-w-2xl mx-auto leading-relaxed">
            Bharat Funded Trader is a funded account evaluation platform built exclusively for Indian intraday traders.
            The entire experience is simulated and designed to test your discipline, risk control, and strategy execution
            on Nifty, Bank Nifty and BSE Sensex futures and options.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-12 md:py-20 px-6 bg-[#FAFBFD]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }} className="text-[#0D0F1A] mb-6">
              Our <span className="text-[#2B4EFF]">Mission</span>
            </h2>
            <p className="text-base sm:text-lg text-[#6B7080] leading-relaxed mb-4">
              India has millions of talented intraday traders who lack access to significant capital.
              They trade small accounts, take unnecessary risks, and never reach their full potential.
            </p>
            <p className="text-base sm:text-lg text-[#6B7080] leading-relaxed">
              We created Bharat Funded Trader to change that. Our structured evaluation gives
              disciplined traders a path to prove their skills and earn real rewards — without risking
              their own savings.
            </p>
          </div>
          <div className="bg-white border border-[#E8EAF0] rounded-2xl p-8 sm:p-10 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
            <div className="text-6xl sm:text-7xl font-extrabold text-[#2B4EFF] mb-4" style={{ letterSpacing: '-0.04em' }}>2024</div>
            <div className="text-lg font-bold text-[#0D0F1A] mb-2">Founded in Mumbai</div>
            <p className="text-sm text-[#6B7080] leading-relaxed">
              Started by a team of traders and technologists who were tired of seeing
              skilled Indian traders held back by capital constraints. Built in India, for Indian traders.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-14 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-10 md:mb-16">
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }} className="text-[#0D0F1A] mb-4">
              What we <span className="text-[#2B4EFF]">stand for</span>
            </h2>
            <p className="text-base sm:text-lg text-[#6B7080]">
              Our values guide every decision we make — from platform design to payout processing.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((v) => (
              <div key={v.number} className="bg-white border border-[#E8EAF0] rounded-2xl p-6 sm:p-8 shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all">
                <span className="text-sm font-bold text-[#2B4EFF]">{v.number}</span>
                <h3 className="text-xl font-bold text-[#0D0F1A] mt-3 mb-3">{v.title}</h3>
                <p className="text-sm text-[#6B7080] leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-14 md:py-24 px-6 bg-[#0C0C1D]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }} className="text-white mb-4">
              The people behind <span className="text-[#2B4EFF]">Bharat Funded</span>
            </h2>
            <p className="text-base sm:text-lg text-[#9AA0B4]">Real people, real experience, real commitment.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {team.map((t) => (
              <div key={t.name} className="bg-[#141428] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 sm:p-8">
                <div className="w-14 h-14 rounded-full bg-[#2B4EFF] flex items-center justify-center text-white font-bold text-lg mb-5">
                  {t.initials}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{t.name}</h3>
                <p className="text-sm text-[#2B4EFF] font-medium mb-4">{t.role}</p>
                <p className="text-sm text-[#9AA0B4] leading-relaxed">{t.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 md:py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }} className="text-[#0D0F1A] mb-6">
            Ready to prove your <span className="text-[#2B4EFF]">trading skills</span>?
          </h2>
          <p className="text-base sm:text-lg text-[#6B7080] mb-8">Start your evaluation today and join hundreds of funded Indian traders.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#2B4EFF] text-white font-semibold text-sm shadow-[0_6px_20px_rgba(43,78,255,0.3)] hover:bg-[#4B6AFF] transition-all">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
