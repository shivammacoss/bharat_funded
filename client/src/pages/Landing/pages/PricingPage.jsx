import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../landing.css';

const plans = {
  '1-Step': [
    {
      name: 'Starter',
      capital: '₹2,00,000',
      price: '₹1,499',
      target: '10%',
      dailyLoss: '4%',
      maxDrawdown: '10%',
      features: ['NIFTY & BANKNIFTY F&O', 'Intraday Only', '5 Min Trading Days', 'No Time Limit', 'KYC Verified Payouts'],
      popular: false,
    },
    {
      name: 'Growth',
      capital: '₹5,00,000',
      price: '₹2,999',
      target: '10%',
      dailyLoss: '4%',
      maxDrawdown: '10%',
      features: ['NIFTY & BANKNIFTY F&O', 'Intraday Only', '5 Min Trading Days', 'No Time Limit', 'KYC Verified Payouts', 'Priority Support'],
      popular: true,
    },
    {
      name: 'Pro',
      capital: '₹10,00,000',
      price: '₹4,999',
      target: '8%',
      dailyLoss: '5%',
      maxDrawdown: '12%',
      features: ['NIFTY, BANKNIFTY & SENSEX', 'Intraday Only', '5 Min Trading Days', 'No Time Limit', 'KYC Verified Payouts', 'Priority Support', 'Dedicated Account Manager'],
      popular: false,
    },
  ],
  '2-Step': [
    {
      name: 'Starter',
      capital: '₹2,00,000',
      price: '₹999',
      target: 'Phase 1: 8% | Phase 2: 5%',
      dailyLoss: '3%',
      maxDrawdown: '8%',
      features: ['NIFTY & BANKNIFTY F&O', 'Intraday Only', '5 Min Trading Days', 'No Time Limit', 'KYC Verified Payouts'],
      popular: false,
    },
    {
      name: 'Growth',
      capital: '₹5,00,000',
      price: '₹1,999',
      target: 'Phase 1: 8% | Phase 2: 5%',
      dailyLoss: '3%',
      maxDrawdown: '8%',
      features: ['NIFTY & BANKNIFTY F&O', 'Intraday Only', '5 Min Trading Days', 'No Time Limit', 'KYC Verified Payouts', 'Priority Support'],
      popular: true,
    },
    {
      name: 'Pro',
      capital: '₹10,00,000',
      price: '₹3,499',
      target: 'Phase 1: 8% | Phase 2: 5%',
      dailyLoss: '4%',
      maxDrawdown: '10%',
      features: ['NIFTY, BANKNIFTY & SENSEX', 'Intraday Only', '5 Min Trading Days', 'No Time Limit', 'KYC Verified Payouts', 'Priority Support', 'Dedicated Account Manager'],
      popular: false,
    },
  ],
};

export default function PricingPage() {
  const [tab, setTab] = useState('1-Step');

  return (
    <div className="landing-page min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 md:pt-44 md:pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-[#2B4EFF] uppercase tracking-widest mb-4">Pricing</p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em' }} className="text-[#0D0F1A] mb-6">
            Simple, transparent <span className="text-[#2B4EFF]">evaluation plans</span>
          </h1>
          <p className="text-base sm:text-lg text-[#6B7080] max-w-2xl mx-auto leading-relaxed">
            Choose between 1-Step and 2-Step evaluations. All plans include simulated capital,
            clear rules, and real performance-based rewards.
          </p>
        </div>
      </section>

      {/* Tab switcher */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">

          <div className="flex justify-center mb-8 md:mb-12">
            <div className="inline-flex bg-[#F0F2F8] rounded-full p-1">
              {['1-Step', '2-Step'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    tab === t
                      ? 'bg-[#2B4EFF] text-white shadow-[0_4px_12px_rgba(43,78,255,0.3)]'
                      : 'text-[#6B7080] hover:text-[#0D0F1A]'
                  }`}
                >
                  {t} Evaluation
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans[tab].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 sm:p-8 transition-all relative ${
                  plan.popular
                    ? 'bg-[#0C0C1D] text-white border-2 border-[#2B4EFF] shadow-[0_8px_40px_rgba(43,78,255,0.2)]'
                    : 'bg-white border border-[#E8EAF0] shadow-[0_2px_16px_rgba(0,0,0,0.04)]'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2B4EFF] text-white text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className="mb-6">
                  <h3 className={`text-lg font-bold mb-1 ${plan.popular ? 'text-white' : 'text-[#0D0F1A]'}`}>{plan.name}</h3>
                  <p className={`text-sm ${plan.popular ? 'text-[#9AA0B4]' : 'text-[#6B7080]'}`}>Simulated Capital: {plan.capital}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold" style={{ letterSpacing: '-0.03em' }}>{plan.price}</span>
                  <span className={`text-sm ml-2 ${plan.popular ? 'text-[#9AA0B4]' : 'text-[#6B7080]'}`}>one-time</span>
                </div>
                <div className={`mb-6 pb-6 border-b ${plan.popular ? 'border-[rgba(255,255,255,0.1)]' : 'border-[#E8EAF0]'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${plan.popular ? 'text-[#9AA0B4]' : 'text-[#6B7080]'}`}>Profit Target</p>
                  <p className={`text-sm font-bold ${plan.popular ? 'text-white' : 'text-[#0D0F1A]'}`}>{plan.target}</p>
                  <div className="flex gap-6 mt-3">
                    <div>
                      <p className={`text-xs ${plan.popular ? 'text-[#9AA0B4]' : 'text-[#6B7080]'}`}>Daily Loss</p>
                      <p className={`text-sm font-bold ${plan.popular ? 'text-white' : 'text-[#0D0F1A]'}`}>{plan.dailyLoss}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${plan.popular ? 'text-[#9AA0B4]' : 'text-[#6B7080]'}`}>Max Drawdown</p>
                      <p className={`text-sm font-bold ${plan.popular ? 'text-white' : 'text-[#0D0F1A]'}`}>{plan.maxDrawdown}</p>
                    </div>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check size={16} className={`shrink-0 mt-0.5 ${plan.popular ? 'text-[#2B4EFF]' : 'text-[#2B4EFF]'}`} />
                      <span className={`text-sm ${plan.popular ? 'text-[#9AA0B4]' : 'text-[#6B7080]'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold transition-all ${
                    plan.popular
                      ? 'bg-[#2B4EFF] text-white hover:bg-[#4B6AFF]'
                      : 'border border-[#E8EAF0] text-[#0D0F1A] hover:border-[#2B4EFF] hover:text-[#2B4EFF]'
                  }`}
                >
                  Start Evaluation <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-[#6B7080] mt-8">
            All plans are simulated. No live trades on NSE/BSE. Fee-related benefits governed by our{' '}
            <Link to="/refund-policy" className="text-[#2B4EFF] hover:underline">Refund Policy</Link>.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
