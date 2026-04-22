import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../landing.css';

const posts = [
  {
    date: 'April 18, 2025',
    category: 'Trading Psychology',
    title: 'Why 90% of traders fail and what the remaining 10% do differently',
    excerpt: 'It is not about finding the perfect strategy. The traders who survive have one thing in common — they manage risk before they chase profits. We break down the habits that separate consistent traders from the rest.',
    readTime: '7 min read',
  },
  {
    date: 'April 12, 2025',
    category: 'Risk Management',
    title: 'Understanding drawdown: the number that decides your trading career',
    excerpt: 'Most new traders obsess over profit targets and ignore drawdown limits. This article explains why your max drawdown is the most important metric in any prop evaluation — and how to stay well within it.',
    readTime: '5 min read',
  },
  {
    date: 'April 5, 2025',
    category: 'Market Analysis',
    title: 'BANKNIFTY intraday patterns: what two years of data tells us',
    excerpt: 'We analysed over 500 trading sessions of BANKNIFTY to find repeating intraday patterns. The results show clear tendencies in the first hour, lunchtime consolidation, and the power hour move before close.',
    readTime: '9 min read',
  },
  {
    date: 'March 28, 2025',
    category: 'Platform Updates',
    title: 'New feature: real-time performance analytics dashboard',
    excerpt: 'Your evaluation dashboard now shows session-by-session breakdown, consistency scores, and behaviour tracking. We built this because knowing your numbers is the first step to improving them.',
    readTime: '3 min read',
  },
  {
    date: 'March 20, 2025',
    category: 'Trader Stories',
    title: 'How Vikram from Pune passed his evaluation in 8 trading days',
    excerpt: 'Vikram had been trading NIFTY options for three years with his own capital. He joined Bharat Funded Trader, followed a simple rule — never risk more than 1% per trade — and cleared the evaluation in just 8 days.',
    readTime: '6 min read',
  },
  {
    date: 'March 14, 2025',
    category: 'Education',
    title: 'The 3:15 PM rule: why intraday square-off exists and how to plan for it',
    excerpt: 'Many traders lose money in the last 15 minutes because they panic-close positions. This guide explains how to plan your trades around the mandatory 3:15 PM square-off and use it to your advantage.',
    readTime: '5 min read',
  },
];

export default function BlogPage() {
  return (
    <div className="landing-page min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 md:pt-44 md:pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-[#2B4EFF] uppercase tracking-widest mb-4">Blog</p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em' }} className="text-[#0D0F1A] mb-6">
            Insights for serious <span className="text-[#2B4EFF]">Indian traders</span>
          </h1>
          <p className="text-base sm:text-lg text-[#6B7080] max-w-2xl mx-auto leading-relaxed">
            No fluff, no clickbait. Real analysis, trader stories, and practical
            advice written by people who actually trade the Indian markets.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          {posts.map((post, i) => (
            <article
              key={i}
              className={`py-10 ${i < posts.length - 1 ? 'border-b border-[#E8EAF0]' : ''}`}
            >
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-xs font-semibold text-[#2B4EFF] bg-[rgba(43,78,255,0.06)] px-3 py-1 rounded-full">{post.category}</span>
                <span className="text-xs text-[#6B7080]">{post.date}</span>
                <span className="text-xs text-[#6B7080]">{post.readTime}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0D0F1A] mb-3 leading-tight hover:text-[#2B4EFF] transition-colors cursor-pointer" style={{ letterSpacing: '-0.02em' }}>
                {post.title}
              </h2>
              <p className="text-base text-[#6B7080] leading-relaxed max-w-3xl">
                {post.excerpt}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Subscribe */}
      <section className="py-12 md:py-20 px-6 bg-[#0C0C1D]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }} className="text-white mb-4">
            Get new posts in your inbox
          </h2>
          <p className="text-base text-[#9AA0B4] mb-8">
            We write once a week. No spam, no promotions — just useful trading insights.
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-5 py-3.5 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] text-white text-sm placeholder-[#9AA0B4] focus:outline-none focus:border-[#2B4EFF] transition-all"
            />
            <button
              type="submit"
              className="px-6 py-3.5 rounded-full bg-[#2B4EFF] text-white font-semibold text-sm hover:bg-[#4B6AFF] transition-all shrink-0"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
