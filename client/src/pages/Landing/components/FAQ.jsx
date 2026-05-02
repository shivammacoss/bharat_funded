import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const faqs = [
  {
    q: 'What is Bharath Funded Trader?',
    a: 'Bharath Funded Trader is a simulated prop firm evaluation platform built for Indian intraday traders. You trade with virtual capital under defined rules and earn rewards upon successful completion.',
  },
  {
    q: 'Is this legal in India?',
    a: 'Yes. Bharath Funded Trader operates as a simulated evaluation platform. It is not a broker or SEBI-registered intermediary. Simulated trading is legal in India.',
  },
  {
    q: 'Which instruments can I trade?',
    a: 'You can trade NIFTY, BANKNIFTY, and SENSEX options — both buying and selling are supported. Futures, overnight positions, copy trading and algo trading are not allowed.',
  },
  {
    q: 'What are the risk rules?',
    a: 'Each plan has a Max Daily Loss limit, a Max Total Drawdown limit, and intraday square-off at 3:15 PM. Breaking any rule disqualifies the current evaluation.',
  },
  {
    q: 'How do I get paid?',
    a: 'After passing the evaluation and completing KYC verification, you become eligible for performance-based rewards paid directly to your verified Indian bank account.',
  },
  {
    q: 'Is my evaluation fee refundable?',
    a: 'Evaluation fees are non-refundable except in case of payment errors. However, upon successful completion and first approved payout, your evaluation fee benefit is credited back as part of your reward.',
  },
];

function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all duration-300 mb-3 ${
        isOpen
          ? 'border-[#2B4EFF] bg-[rgba(43,78,255,0.03)]'
          : 'border-[#E8EAF0] bg-white hover:border-[rgba(43,78,255,0.3)]'
      }`}
    >
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
        onClick={onToggle}
      >
        <span className={`text-sm sm:text-base font-semibold font-manrope transition-colors ${isOpen ? 'text-[#2B4EFF]' : 'text-[#0D0F1A]'}`}>
          {faq.q}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-all duration-300 ${isOpen ? 'rotate-180 text-[#2B4EFF]' : 'text-[#6B7080]'}`}
        />
      </button>
      <div
        className="overflow-hidden"
        style={{
          maxHeight: isOpen ? '500px' : '0',
          opacity: isOpen ? 1 : 0,
          transition: 'max-height 0.4s ease, opacity 0.3s ease',
        }}
      >
        <div className="px-5 pb-4">
          <div className="h-px bg-[rgba(43,78,255,0.15)] mb-3" />
          <p className="text-sm sm:text-base text-[#6B7080] leading-relaxed">{faq.a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);
  const { ref: headerRef } = useScrollAnimation();
  const { ref: contentRef } = useScrollAnimation(0.1);

  return (
    <section className="bg-white py-14 md:py-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Two-column layout */}
        <div ref={headerRef} className="scroll-reveal grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">

          {/* LEFT — Heading (1/3) */}
          <div className="lg:col-span-1">
            <h2
              className="font-extrabold text-[#0D0F1A] tracking-[-0.02em] font-manrope mb-4"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
            >
              Frequently Asked{' '}
              <span className="text-[#2B4EFF]">Questions</span>
            </h2>
            <p className="text-base sm:text-lg text-[#6B7080] font-light">
              Everything you need to know before you start.
            </p>
          </div>

          {/* RIGHT — FAQ accordion (2/3) */}
          <div ref={contentRef} className="scroll-reveal lg:col-span-2">
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                faq={faq}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
