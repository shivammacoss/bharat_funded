import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TopBanner from '../components/TopBanner';
import '../landing.css';

const faqCategories = {
  'General': [
    { q: 'What is Bharath Funded Trader?', a: 'Bharath Funded Trader is a simulated prop firm evaluation platform built for Indian intraday traders. You trade with virtual capital under defined rules and earn rewards upon successful completion. We are not a broker and do not execute live trades on NSE or BSE.' },
    { q: 'Is this legal in India?', a: 'Yes. Bharath Funded Trader operates as a simulated evaluation platform. It is not a broker or SEBI-registered intermediary. Simulated trading is legal in India. We provide a skill evaluation service, not investment advice or brokerage services.' },
    { q: 'Who is this platform for?', a: 'This platform is built for serious Indian intraday traders who want to prove their trading discipline and earn performance-based rewards without risking their own capital. Whether you trade NIFTY, BANKNIFTY or SENSEX — if you have a consistent strategy, this is for you.' },
  ],
  'Trading': [
    { q: 'Which instruments can I trade?', a: 'You can trade NIFTY, BANKNIFTY, and SENSEX futures and options (buying only). Options selling is currently not supported. All trading happens in a simulated environment with real-time market data.' },
    { q: 'What are the risk rules?', a: 'Each plan has a Max Daily Loss limit (3-5%), a Max Total Drawdown limit (8-12%), and mandatory intraday square-off at 3:15 PM IST. Breaking any rule disqualifies the current evaluation. These rules are designed to promote disciplined trading.' },
    { q: 'What happens if I break a rule?', a: 'If you breach the daily loss limit, max drawdown, or fail to close positions by 3:15 PM, your evaluation is disqualified. You can purchase a new plan and restart. There are no penalties beyond losing the evaluation attempt.' },
    { q: 'Is the market data real?', a: 'Yes, we use real-time market data feeds from NSE. However, all orders are simulated — no actual trades are placed on the exchange. This gives you a realistic experience without real market risk.' },
  ],
  'Payouts': [
    { q: 'How do I get paid?', a: 'After passing the evaluation and completing KYC verification, you become eligible for performance-based rewards paid directly to your verified Indian bank account. Payouts are processed within 5-7 business days.' },
    { q: 'Is my evaluation fee refundable?', a: 'Evaluation fees are non-refundable except in case of payment errors. However, upon successful completion and first approved payout, your evaluation fee benefit is credited back as part of your reward.' },
    { q: 'What is the profit split?', a: 'Traders who successfully pass the evaluation receive up to 80% of the simulated profits as performance rewards. The exact split depends on your plan tier and is clearly stated before purchase.' },
  ],
  'Account': [
    { q: 'How do I create an account?', a: 'Click "Get Started" on any page, fill in your basic details (name, email, phone), verify your email, and you are ready to purchase an evaluation plan. The entire process takes less than 2 minutes.' },
    { q: 'What documents do I need for KYC?', a: 'You will need a valid PAN card, Aadhaar card, and a bank account in your name. KYC is required only after you pass the evaluation and before your first payout. We verify these digitally.' },
    { q: 'Can I have multiple evaluations at once?', a: 'Yes, you can run multiple evaluation accounts simultaneously. Each plan operates independently with its own rules, capital, and tracking.' },
  ],
};

function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <div className={`border rounded-2xl overflow-hidden transition-all mb-3 ${isOpen ? 'border-[#2B4EFF] bg-[rgba(43,78,255,0.03)]' : 'border-[#E8EAF0] bg-white hover:border-[rgba(43,78,255,0.3)]'}`}>
      <button className="w-full flex items-center justify-between px-6 py-5 text-left gap-4" onClick={onToggle}>
        <span className={`text-sm sm:text-base font-semibold transition-colors ${isOpen ? 'text-[#2B4EFF]' : 'text-[#0D0F1A]'}`}>{faq.q}</span>
        <ChevronDown size={18} className={`shrink-0 transition-all duration-300 ${isOpen ? 'rotate-180 text-[#2B4EFF]' : 'text-[#6B7080]'}`} />
      </button>
      <div className="overflow-hidden" style={{ maxHeight: isOpen ? '500px' : '0', opacity: isOpen ? 1 : 0, transition: 'max-height 0.4s ease, opacity 0.3s ease' }}>
        <div className="px-6 pb-5">
          <div className="h-px bg-[rgba(43,78,255,0.1)] mb-4" />
          <p className="text-sm sm:text-base text-[#6B7080] leading-relaxed">{faq.a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQsPage() {
  const [openIndex, setOpenIndex] = useState('General-0');
  const [activeCategory, setActiveCategory] = useState('General');

  return (
    <div className="landing-page min-h-screen bg-white">
      <TopBanner />
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 md:pt-44 md:pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-[#2B4EFF] uppercase tracking-widest mb-4">FAQs</p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em' }} className="text-[#0D0F1A] mb-6">
            Frequently asked <span className="text-[#2B4EFF]">questions</span>
          </h1>
          <p className="text-base sm:text-lg text-[#6B7080] max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about Bharath Funded Trader. Can't find what you're looking for?{' '}
            <Link to="/contact-us" className="text-[#2B4EFF] hover:underline">Contact our team</Link>.
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="pb-24 px-6">
        <div className="max-w-4xl mx-auto">

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-8 md:mb-10 justify-center">
            {Object.keys(faqCategories).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-[#2B4EFF] text-white'
                    : 'bg-[#F0F2F8] text-[#6B7080] hover:text-[#0D0F1A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Questions */}
          <div>
            {faqCategories[activeCategory].map((faq, i) => {
              const key = `${activeCategory}-${i}`;
              return (
                <FAQItem
                  key={key}
                  faq={faq}
                  isOpen={openIndex === key}
                  onToggle={() => setOpenIndex(openIndex === key ? null : key)}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-20 px-6 bg-[#0C0C1D]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }} className="text-white mb-4">
            Still have questions?
          </h2>
          <p className="text-base text-[#9AA0B4] mb-8">Our support team is available to help you with any queries.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/contact-us" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#2B4EFF] text-white font-semibold text-sm hover:bg-[#4B6AFF] transition-all">
              Contact Support
            </Link>
            <Link to="/pricing" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-[rgba(255,255,255,0.15)] text-white font-semibold text-sm hover:border-[#2B4EFF] hover:text-[#2B4EFF] transition-all">
              View Plans
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
