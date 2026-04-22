import { Clock, ArrowRight, TrendingUp, IndianRupee, BarChart2, Shield } from 'lucide-react';
import { useScrollAnimation, useStaggerAnimation } from '../hooks/useScrollAnimation';

const articles = [
  {
    icon: TrendingUp,
    category: 'Stocks',
    title: "Beginner's Guide to Stock Trading",
    desc: 'Learn the fundamentals of stock markets, how to read charts, and place your first trade with confidence.',
    readTime: '8 min read',
    level: 'Beginner',
    levelColor: 'text-emerald-400 bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.2)]',
  },
  {
    icon: IndianRupee,
    category: 'Markets',
    title: 'Investing in Indian Equities',
    desc: 'Learn how the NSE and BSE work, what drives Indian stock prices, and how to build a solid portfolio.',
    readTime: '10 min read',
    level: 'Intermediate',
    levelColor: 'text-amber-400 bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  },
  {
    icon: BarChart2,
    category: 'Derivatives',
    title: 'Options Trading Basics',
    desc: 'Understand calls, puts, strike prices, and expiry dates. Master the building blocks of options trading.',
    readTime: '12 min read',
    level: 'Intermediate',
    levelColor: 'text-amber-400 bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  },
  {
    icon: Shield,
    category: 'Strategy',
    title: 'Risk Management Strategies',
    desc: 'Protect your capital with proven risk management techniques including stop-loss, position sizing, and diversification.',
    readTime: '9 min read',
    level: 'Advanced',
    levelColor: 'text-red-400 bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.2)]',
  },
];

export default function Education() {
  const { ref: headerRef } = useScrollAnimation();
  const cardsRef = useStaggerAnimation(0.08, 90);

  return (
    <section id="education" className="bg-[#0C0C1D] py-14 md:py-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div ref={headerRef} className="scroll-reveal mb-10 md:mb-16 text-center max-w-3xl mx-auto">
          <h2
            className="font-extrabold text-white tracking-[-0.02em] font-manrope mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            Quick Trading Guides{' '}
            <span className="text-[#2B4EFF]">& Insights</span>
          </h2>
          <p className="text-base sm:text-lg text-[#9AA0B4] font-light">
            Sharpen your trading skills with expert-written guides, tutorials, and market analysis.
          </p>
        </div>

        {/* Article Cards */}
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {articles.map((article) => {
            const Icon = article.icon;
            return (
              <div
                key={article.title}
                className="stagger-child bg-[#141428] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 group flex flex-col gap-4 hover:border-[rgba(43,78,255,0.4)] transition-all duration-300"
              >
                {/* Icon */}
                <div className="inline-flex p-3 rounded-xl bg-[rgba(43,78,255,0.1)] border border-[rgba(43,78,255,0.2)] self-start">
                  <Icon size={20} className="text-[#2B4EFF]" />
                </div>

                {/* Category & Level */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#2B4EFF]">
                    {article.category}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${article.levelColor}`}>
                    {article.level}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-white font-manrope leading-snug group-hover:text-[#2B4EFF] transition-colors">
                  {article.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-[#9AA0B4] leading-relaxed flex-1">{article.desc}</p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.08)]">
                  <div className="flex items-center gap-1.5 text-xs text-[#9AA0B4]">
                    <Clock size={12} />
                    {article.readTime}
                  </div>
                  <button className="flex items-center gap-1 text-xs font-semibold text-[#2B4EFF] group-hover:gap-2 transition-all">
                    Read More <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
