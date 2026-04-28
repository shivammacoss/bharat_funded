import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, BookOpen } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TopBanner from '../components/TopBanner';
import '../landing.css';

const posts = [
  {
    slug: 'how-prop-firms-work',
    category: 'Prop Firm Basics',
    title: 'How Prop Firms Work — A Complete Guide for Indian Traders',
    excerpt: 'Prop firms give skilled traders access to firm capital instead of forcing them to risk their own savings. The trader passes a structured evaluation that proves their discipline, the firm provides the capital, and they share the profits.',
    body: [
      'A proprietary trading firm — or "prop firm" — is a company that gives traders access to its own capital to trade. Instead of using your savings, you trade with firm money. In return, the firm keeps a share of the profits and the trader keeps the rest. This model has existed for decades on Wall Street; the modern retail prop firm simply opened it up to anyone who can prove their skill.',
      'The way it works is simple. You pay a one-time evaluation fee to take a challenge. The challenge has clear rules — a profit target you have to hit, a maximum loss you cannot cross, and a minimum number of trading days. If you pass, you get a funded account. If you do not, you can buy another evaluation and try again.',
      'For Indian traders specifically, prop firms solve a real problem: most retail traders never have enough capital to scale their strategy. A trader with a ₹50,000 account who makes 5% a month is a great trader, but ₹2,500 a month does not change anyone\'s life. The same trader on a ₹10,00,000 funded account is making ₹50,000 a month — and now we are talking about a real income.',
      'At Bharath Funded Trader, the entire evaluation is simulated. We do not place real orders on NSE or BSE. The market data is real, the rules are real, the payouts are real — but the trading environment is a simulator built specifically for evaluating skill. That is why we can offer this service legally as an educational and evaluation platform.',
    ],
    readTime: '8 min read',
    date: 'April 22, 2025',
  },
  {
    slug: 'risk-management-funded-traders',
    category: 'Risk Management',
    title: 'Best Risk Management Practices for Funded Traders',
    excerpt: 'The traders who pass evaluations and keep their funded accounts are not the ones with the best entries. They are the ones who never let a single trade ruin their day. Risk management is the only edge that compounds.',
    body: [
      'Every funded trader who has held an account for more than three months will tell you the same thing: the goal is not to make the most money on a winning day. The goal is to lose the least on a losing day. Drawdown limits exist for a reason, and the traders who respect them are the ones who survive.',
      'The first rule we recommend is the 1% rule. Never risk more than 1% of your account on a single trade. On a ₹10,00,000 funded account, that is ₹10,000 of risk. If your stop-loss is 20 points away on NIFTY futures, that math forces a smaller position size — which is exactly the point.',
      'The second rule is the daily loss cap. Every challenge at Bharath Funded has a Daily Drawdown limit (3-4%). Hit that limit and you are out. Smart traders set their personal daily stop at half the official limit. If the rule is 4%, you stop at 2%. That margin of safety is what protects you from one bad day turning into a disqualified evaluation.',
      'The third — and least talked about — rule is position concentration. Never have more than two open positions at once during evaluation. We see traders open NIFTY long, BANKNIFTY long, and SENSEX long simultaneously, then watch all three move against them on a single news event. Diversification is a myth in correlated Indian indices. Trade one thing well.',
      'Risk management is boring. That is the entire point. Boring traders pass evaluations. Exciting traders blow them up.',
    ],
    readTime: '10 min read',
    date: 'April 18, 2025',
  },
  {
    slug: 'why-traders-fail-challenges',
    category: 'Trader Psychology',
    title: 'Common Reasons Traders Fail Prop Firm Challenges',
    excerpt: 'After watching hundreds of evaluations, the same patterns keep showing up. Most failures have nothing to do with strategy. They are mistakes of impatience, oversizing, and ignoring the rules everyone agreed to before starting.',
    body: [
      'We track every evaluation that runs on the platform. After 312 successful passes and several hundred failures, the patterns are remarkably consistent. The vast majority of traders fail for one of five reasons — and almost none of them involve a bad strategy.',
      'Reason one: oversizing. A trader gets two losses in a row, doubles their position size to "make it back," and breaches the daily drawdown on the third trade. This is the single most common failure mode. The fix is mechanical — your position size is locked at the start of the day, and you do not change it until the next session.',
      'Reason two: revenge trading. After a losing trade, the trader immediately enters another trade without setup confirmation. Their next move is emotional, not technical. By the third revenge trade, they have crossed the daily limit. The fix is to walk away from the screen for 30 minutes after any loss bigger than 1%.',
      'Reason three: ignoring the time-of-day pattern. Indian intraday markets have rhythms. The first 15 minutes are choppy, lunchtime is dead, and the last hour can be violent. Traders who try to scalp at 1:30 PM almost always overtrade and lose to commissions and noise.',
      'Reason four: not reading the rules. We have had traders breach the consistency rule on Instant accounts because they did not know it existed. They had one massive day that contributed 60% of their total profit. The 30% consistency cap kicked in and the account was disqualified. Read the rules. They are short. They are written in plain English.',
      'Reason five: chasing news events. RBI policy day, budget day, results — these are not days for evaluation trading. The volatility looks like opportunity but is actually a tax on traders who think they can predict the unpredictable. Stay flat or trade tiny size.',
    ],
    readTime: '11 min read',
    date: 'April 14, 2025',
  },
  {
    slug: 'how-payouts-work',
    category: 'Payouts',
    title: 'How Payouts Work at Bharath Funded Trader',
    excerpt: 'You passed the evaluation. Now what? Here is exactly how payouts work — KYC, processing time, profit split, and how the money gets to your bank account. No marketing fluff, just the actual process.',
    body: [
      'The payout process at Bharath Funded begins the moment you finish your evaluation with a passing result. You will get a notification on your registered email and inside the dashboard. From there, the process is in four clear stages.',
      'Stage one is KYC verification. We need a self-attested copy of your PAN card, your Aadhaar card, and a cancelled cheque or bank statement showing your name and account number. This usually takes 24 to 48 hours to verify. We do this digitally — there is no in-person meeting, no notarisation, nothing complicated. Once verified, your KYC stays on file for all future payouts.',
      'Stage two is the cooling period. After your evaluation passes, there is a 7-day cooling period before the first payout becomes available. This exists to make sure the result is genuine and not the outcome of a single lucky session. If you trade during this period and stay within the rules, the cooling period is part of your trading record.',
      'Stage three is the profit split. Bharath Funded pays out up to 80% of simulated profits depending on your plan tier. The split is fixed and visible in your dashboard from day one. We do not change it after you pass. We do not have hidden fees that reduce the payout amount.',
      'Stage four is the bank transfer. Payouts go directly to your verified Indian bank account through IMPS or NEFT. The money usually lands in 24 to 48 hours after we initiate the transfer. We do not use foreign payment gateways, we do not deduct USD conversion fees, and we do not delay payouts beyond the published timeline. To date, every single payout we have promised has been paid on time.',
      'Your evaluation fee is also credited back as part of your first approved payout. So if you paid ₹12,600 for the 5L 1-Step plan, that ₹12,600 comes back to you on the first payout cycle. After that, every subsequent payout is pure profit share.',
    ],
    readTime: '9 min read',
    date: 'April 8, 2025',
  },
  {
    slug: 'psychology-consistent-traders',
    category: 'Trader Psychology',
    title: 'The Psychology of Consistent Traders',
    excerpt: 'Consistency in trading is 90% mental and 10% technical. The traders who survive and thrive are not the ones who found the perfect indicator. They are the ones who learned to manage themselves before managing the market.',
    body: [
      'In trading, consistency is rarer than profitability. Plenty of traders make money. Very few do it consistently for years. The difference is almost entirely psychological — the ability to follow your own rules even when your emotions are screaming at you to break them.',
      'The first habit of consistent traders is process orientation. They do not measure success by the P&L of a single day. They measure it by whether they followed their plan. A losing day where they followed their rules is a good day. A winning day where they got lucky is a warning sign. This sounds backwards until you have lived it for a year.',
      'The second habit is journaling. Every consistent trader we have worked with keeps a written record. Not a fancy spreadsheet — just notes after each session. What did I plan to trade? What did I actually trade? Why did I deviate? The patterns become obvious after 30 days of honest journaling.',
      'The third habit is detachment from individual trades. Consistent traders do not get attached to outcomes. They take the setup, place the trade, and accept whatever the market delivers. If they win, fine. If they lose, fine. The next trade gets the same treatment. This emotional flatness is not natural — it is built through deliberate practice.',
      'The fourth habit is acceptance of small wins. Consistent traders are happy with 0.5% to 1% per day on average. They do not chase 5% days. They know that compounding 0.5% over 200 trading days produces a return that no single big day can match — and it does so without the drawdown that big swings always bring.',
      'The hardest part is patience with the process. Most traders who fail in the first three months would have made it if they had stayed disciplined for six. The market does not reward speed. It rewards staying power.',
    ],
    readTime: '12 min read',
    date: 'April 2, 2025',
  },
  {
    slug: 'funded-vs-personal-capital',
    category: 'Strategy',
    title: 'Funded Capital vs Personal Capital — Which Is Right for You?',
    excerpt: 'Trading your own money feels different from trading firm capital. The risk is real, the emotions are sharper, the constraints are different. Here is an honest comparison so you can choose what fits your situation.',
    body: [
      'Most retail traders eventually face this question: should I trade my own money, or should I get funded? Both paths have real advantages and real costs. The right choice depends on your capital position, your risk tolerance, and your discipline level.',
      'Trading your own capital gives you complete control. There are no rules except the ones you set. You can hold positions overnight, you can scale into trades, you can take a 5% loss and recover next month. The downside is obvious — every loss is real, and most retail traders do not have the capital base to compound meaningfully. A 30% return on a ₹2,00,000 account is ₹60,000 a year. Useful, but not life-changing.',
      'Funded trading flips this. You get access to capital you could not afford to deploy yourself, but you trade under rules. Daily drawdown caps, profit targets, intraday-only restrictions on most plans. The freedom is constrained, but the upside is multiplied. A 30% return on a ₹10,00,000 funded account at 80% profit split is ₹2,40,000 a year — for the trader. That is meaningful income.',
      'There is also a psychological layer. When you trade your own money, every loss feels personal. It is your savings, your bills, your future. That emotional weight makes most retail traders worse, not better. Funded capital removes this weight. You still want to trade well — your livelihood depends on staying funded — but a single losing day does not threaten your family\'s grocery budget. That separation often makes traders more disciplined, not less.',
      'The honest answer is most serious traders do both. They keep a personal account for long-term positions and full creative freedom, and they use a funded account to scale their best intraday strategies. The funded account becomes a cash flow stream. The personal account becomes a wealth-building stream. Different goals, different tools.',
      'If you are an Indian intraday trader with a tested strategy and the discipline to follow rules, a funded account is the most efficient way to scale your edge. If you are still learning, work on your own capital first. The rules of a prop firm will expose any weakness in your strategy faster than the market alone ever will.',
    ],
    readTime: '13 min read',
    date: 'March 26, 2025',
  },
];

export default function BlogPage() {
  const [activePost, setActivePost] = useState(null);

  if (activePost) {
    return (
      <div className="landing-page min-h-screen bg-white">
        <TopBanner />
        <Navbar />

        <article className="pt-28 pb-14 md:pt-44 md:pb-24 px-6">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => { setActivePost(null); window.scrollTo(0, 0); }}
              className="text-sm font-semibold text-[#2B4EFF] hover:underline mb-6 inline-flex items-center gap-1"
            >
              ← Back to all articles
            </button>

            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="text-xs font-semibold text-[#2B4EFF] bg-[rgba(43,78,255,0.06)] px-3 py-1 rounded-full uppercase tracking-wider">{activePost.category}</span>
              <span className="text-xs text-[#6B7080] flex items-center gap-1"><Clock size={12} /> {activePost.readTime}</span>
              <span className="text-xs text-[#6B7080]">{activePost.date}</span>
            </div>

            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' }} className="text-[#0D0F1A] mb-6">
              {activePost.title}
            </h1>

            <p className="text-lg sm:text-xl text-[#6B7080] leading-relaxed mb-10 italic border-l-4 border-[#2B4EFF] pl-5">
              {activePost.excerpt}
            </p>

            <div className="space-y-6 text-base sm:text-lg text-[#0D0F1A] leading-relaxed">
              {activePost.body.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-[#E8EAF0]">
              <p className="text-sm text-[#6B7080] mb-4">Ready to apply this in your own evaluation?</p>
              <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#2B4EFF] text-white font-semibold text-sm hover:bg-[#4B6AFF] transition-all">
                View Plans <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </article>

        <Footer />
      </div>
    );
  }

  return (
    <div className="landing-page min-h-screen bg-white">
      <TopBanner />
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 md:pt-44 md:pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-[#2B4EFF] uppercase tracking-widest mb-4">Resources</p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em' }} className="text-[#0D0F1A] mb-6">
            Honest insights for <span className="text-[#2B4EFF]">Indian funded traders</span>
          </h1>
          <p className="text-base sm:text-lg text-[#6B7080] max-w-2xl mx-auto leading-relaxed">
            Long-form articles written by traders, not marketers. We cover the parts of prop trading that matter — risk, psychology, payouts, and what actually works in Indian markets.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="pb-16 md:pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post, i) => (
              <article
                key={post.slug}
                onClick={() => { setActivePost(post); window.scrollTo(0, 0); }}
                className={`group cursor-pointer bg-white border border-[#E8EAF0] rounded-2xl p-6 sm:p-8 shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:border-[#2B4EFF] transition-all ${i === 0 ? 'md:col-span-2' : ''}`}
              >
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-xs font-semibold text-[#2B4EFF] bg-[rgba(43,78,255,0.06)] px-3 py-1 rounded-full uppercase tracking-wider">{post.category}</span>
                  <span className="text-xs text-[#6B7080] flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
                  <span className="text-xs text-[#6B7080]">{post.date}</span>
                </div>

                <h2 className={`font-bold text-[#0D0F1A] mb-3 leading-tight group-hover:text-[#2B4EFF] transition-colors ${i === 0 ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`} style={{ letterSpacing: '-0.02em' }}>
                  {post.title}
                </h2>

                <p className="text-base text-[#6B7080] leading-relaxed mb-5">
                  {post.excerpt}
                </p>

                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2B4EFF]">
                  <BookOpen size={14} /> Read full article <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe */}
      <section className="py-14 md:py-20 px-6 bg-[#FAFBFD]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em' }} className="text-[#0D0F1A] mb-4">
            Want trading insights in your inbox?
          </h2>
          <p className="text-base text-[#6B7080] mb-8 max-w-xl mx-auto">
            We publish one article a week. No promotional emails, no upsells — just the kind of stuff we wish someone had told us when we started.
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-5 py-3.5 rounded-full bg-white border border-[#E8EAF0] text-[#0D0F1A] text-sm focus:outline-none focus:border-[#2B4EFF] transition-all"
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
