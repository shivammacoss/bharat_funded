import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import LandingShell from '../components/LandingShell';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TopBanner from '../components/TopBanner';
import '../landing.css';

const milestones = [
  {
    date: 'June 2023',
    title: 'The conversation that started it all',
    desc: 'A late-night discussion between two Mumbai traders about how Indian retail traders never get a fair shot at real capital. The idea was simple — build the prop firm we wished existed.',
  },
  {
    date: 'October 2023',
    title: 'First prototype, built on weekends',
    desc: 'Our CTO started coding the simulated trading engine after office hours. No fancy office, just a Bandra apartment and a lot of chai. The first version handled NIFTY only.',
  },
  {
    date: 'February 2024',
    title: 'Bharath Funded Trader Edutech Services Pvt. Ltd. registered',
    desc: 'Officially incorporated under the Companies Act. Registered office in Mumbai. Got our PAN, GSTIN, and a proper bank account. The hobby became a real business.',
  },
  {
    date: 'May 2024',
    title: 'Beta launch with 50 traders',
    desc: 'Invited 50 friends and friends-of-friends from trading communities to test the platform. Their feedback shaped the rules, the dashboard, and the payout process we use today.',
  },
  {
    date: 'August 2024',
    title: 'First payout to a funded trader',
    desc: 'Vikram from Pune passed his evaluation in 8 days and received ₹62,400 in his bank account. We took a screenshot. We still have it pinned in the office.',
  },
  {
    date: 'December 2024',
    title: 'Crossed 200 active traders',
    desc: 'Word spread through Telegram groups and YouTube channels. By year-end, over 200 traders were actively running evaluations on the platform.',
  },
  {
    date: 'February 2025',
    title: 'Moved into our first proper office',
    desc: 'Ten people, one floor, one big window facing the Mumbai skyline. The garage phase was over. We finally had a place to put a coffee machine.',
  },
  {
    date: 'April 2025',
    title: '₹47L+ paid out to traders',
    desc: 'Crossed cumulative payouts of ₹47 lakhs across 312 successful evaluations. Most importantly — every single trader was paid on time. Always will be.',
  },
];

const reasons = [
  {
    title: 'We are Indian, top to bottom',
    desc: 'Built in India, registered in India, run by Indians. We understand SEBI rules, NSE/BSE quirks, and what Indian intraday traders actually need — because we are them.',
  },
  {
    title: 'INR payments, INR payouts',
    desc: 'No FX conversion games. You pay in rupees, you get paid in rupees, straight to your Indian bank account. No PayPal, no crypto, no nonsense.',
  },
  {
    title: 'Transparent rules, no fine print',
    desc: 'Every rule is on the Challenges page. Every fee is on the Pricing page. We do not hide the consistency rule in clause 47 of a 30-page T&C document.',
  },
  {
    title: 'Real human support',
    desc: 'When you message us, an actual person replies. Usually within a few hours during market days. No chatbots pretending to be helpful.',
  },
  {
    title: 'We pay on time. Always.',
    desc: 'Payouts processed within 5–7 business days of approval. We have never delayed a single payout to date. This is the promise the entire business is built on.',
  },
  {
    title: 'Built for the long run',
    desc: 'We are not a flash-sale prop firm with US-style marketing tactics. We are building a platform that will be here in 2030. That changes how we make every decision.',
  },
];

const team = [
  { initials: 'VK', photo: '/landing/img/Rajesh.jpeg', name: 'Vijaya Kumar', role: 'Founder & CEO', bio: '15+ years in Indian capital markets. Former prop desk head at a Mumbai-based trading firm. Started Bharath Funded after losing patience with foreign prop firms that did not understand the Indian market.' },
  { initials: 'SP', photo: '/landing/img/Sneha.jpeg', name: 'Sneha Patel', role: 'Head of Risk', bio: 'Ex-risk analyst at a leading Indian brokerage. Designs every drawdown rule and consistency check on the platform. Believes good rules protect traders from themselves.' },
  { initials: 'AV', photo: '/landing/img/Amit.jpeg', name: 'Amit Verma', role: 'CTO & Co-founder', bio: 'Full-stack engineer, decade of fintech experience. Built the simulated trading engine from scratch in his Bandra apartment. Still writes code on weekends because he cannot help it.' },
  { initials: 'PD', photo: '/landing/img/Priya.jpeg', name: 'Priya Desai', role: 'Head of Operations', bio: 'Handles KYC, payouts, and trader support. The reason payouts go out on time. The reason traders actually get replies to their queries.' },
];

export default function AboutPage() {
  return (
    <LandingShell>
      <TopBanner />
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-14 md:pt-44 md:pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-[#2B4EFF] uppercase tracking-widest mb-4">About Us</p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em' }} className="text-[#0D0F1A] mb-6">
            We started this because nobody else was <span className="text-[#2B4EFF]">building it for India</span>
          </h1>
          <p className="text-base sm:text-lg text-[#6B7080] max-w-2xl mx-auto leading-relaxed">
            Bharath Funded Trader Edutech Services is a homegrown prop firm evaluation
            platform. Built in Mumbai, run by Indians, for Indian intraday traders.
          </p>
        </div>
      </section>

      {/* Why we started */}
      <section className="py-14 md:py-20 px-6 bg-[#FAFBFD]">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-semibold text-[#2B4EFF] uppercase tracking-widest mb-4">Our Story</p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' }} className="text-[#0D0F1A] mb-8">
            Why we started <span className="text-[#2B4EFF]">Bharath Funded Trader</span>
          </h2>
          <div className="space-y-5 text-base sm:text-lg text-[#6B7080] leading-relaxed">
            <p>
              In 2023, two of us were sitting at a chai stall in Bandra arguing about prop firms.
              We had both tried the foreign ones — paid the fee in dollars, dealt with the FX conversion,
              traded instruments we did not understand, lost the account because the rules were written for
              someone else's market.
            </p>
            <p>
              The conversation kept coming back to one question: <em className="text-[#0D0F1A] not-italic font-semibold">why does an Indian trader
              have to jump through American hoops to get funded?</em> Indian traders know NIFTY and BANKNIFTY
              better than anyone. They wake up at 9:00 AM IST, they trade index options, they live in INR.
              Why should they pay in USD and trade S&P futures to prove their skill?
            </p>
            <p>
              So we built the prop firm we wished existed. INR payments. NIFTY, BANKNIFTY and SENSEX only.
              Indian market hours. Rules written in plain English. Payouts in your Indian bank account, not
              a Wise transfer that takes a week and eats 3% in fees.
            </p>
            <p>
              That is the whole pitch. We are not trying to be the biggest prop firm in the world. We just
              want to be the best one for Indian traders.
            </p>
          </div>
        </div>
      </section>

      {/* Office / Team Photos */}
      <section className="py-14 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16">
            <p className="text-sm font-semibold text-[#2B4EFF] uppercase tracking-widest mb-4">Our Office</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' }} className="text-[#0D0F1A] mb-4">
              The people, the place, the work
            </h2>
            <p className="text-base sm:text-lg text-[#6B7080]">
              A small team in Mumbai. Real desks, real coffee, real conversations.
            </p>
          </div>

          {/* Photo grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="md:col-span-2 aspect-[16/10] rounded-2xl overflow-hidden bg-[#F0F2F8] border border-[#E8EAF0] flex items-center justify-center relative">
              <img
                src="/landing/img/banner_change_2.jpeg"
                alt="Our Mumbai office"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-[16/10] md:aspect-auto rounded-2xl overflow-hidden bg-[#F0F2F8] border border-[#E8EAF0] flex items-center justify-center relative">
              <img
                src="/landing/img/banner2.png"
                alt="Our team"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Growth Journey / Milestones */}
      <section className="py-14 md:py-24 px-6 bg-[#0C0C1D]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16">
            <p className="text-sm font-semibold text-[#2B4EFF] uppercase tracking-widest mb-4">Our Journey</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' }} className="text-white mb-4">
              From a chai stall to a funded trader platform
            </h2>
            <p className="text-base sm:text-lg text-[#9AA0B4]">
              The milestones that brought us here. No filters, no rounding up.
            </p>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-3 sm:left-4 top-2 bottom-2 w-px bg-[rgba(255,255,255,0.1)]" />

            <div className="space-y-8">
              {milestones.map((m, i) => (
                <div key={i} className="relative pl-12 sm:pl-16">
                  {/* Dot */}
                  <div className="absolute left-0 top-2 w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-[#2B4EFF] border-4 border-[#0C0C1D] flex items-center justify-center">
                    <span className="text-[10px] sm:text-xs font-bold text-white">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <p className="text-xs font-bold text-[#2B4EFF] uppercase tracking-widest mb-1">{m.date}</p>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{m.title}</h3>
                  <p className="text-sm sm:text-base text-[#9AA0B4] leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-14 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16">
            <p className="text-sm font-semibold text-[#2B4EFF] uppercase tracking-widest mb-4">Why Us</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' }} className="text-[#0D0F1A] mb-4">
              Why traders pick <span className="text-[#2B4EFF]">Bharath Funded</span>
            </h2>
            <p className="text-base sm:text-lg text-[#6B7080]">
              No marketing fluff. These are the actual reasons people stick with us.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reasons.map((r, i) => (
              <div key={r.title} className="bg-white border border-[#E8EAF0] rounded-2xl p-6 sm:p-8 shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all">
                <span className="text-sm font-bold text-[#2B4EFF]">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="text-lg font-bold text-[#0D0F1A] mt-3 mb-3">{r.title}</h3>
                <p className="text-sm sm:text-base text-[#6B7080] leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-14 md:py-24 px-6 bg-[#FAFBFD]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <p className="text-sm font-semibold text-[#2B4EFF] uppercase tracking-widest mb-4">The Team</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' }} className="text-[#0D0F1A] mb-4">
              The people behind it
            </h2>
            <p className="text-base sm:text-lg text-[#6B7080]">Real people. Real experience. Reachable on email.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {team.map((t) => (
              <div key={t.name} className="bg-white border border-[#E8EAF0] rounded-2xl p-6 sm:p-8 flex gap-5 items-start">
                {t.photo ? (
                  <img
                    src={t.photo}
                    alt={t.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#2B4EFF] flex items-center justify-center text-white font-bold text-2xl shrink-0">
                    {t.initials}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-[#0D0F1A] mb-1">{t.name}</h3>
                  <p className="text-sm text-[#2B4EFF] font-medium mb-3">{t.role}</p>
                  <p className="text-sm text-[#6B7080] leading-relaxed">{t.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Entity Info */}
      <section className="py-14 md:py-20 px-6 bg-[#0C0C1D]">
        <div className="max-w-4xl mx-auto">
          <div className="border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 sm:p-10 bg-[#141428]">
            <p className="text-xs font-bold text-[#2B4EFF] uppercase tracking-widest mb-4">Company Information</p>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">
              Legally registered as <span className="text-[#2B4EFF]">Bharath Funded Trader Edutech Services Pvt. Ltd.</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-[#9AA0B4] mb-1">Registered Name</p>
                <p className="text-white font-semibold">Bharath Funded Trader Edutech Services Pvt. Ltd.</p>
              </div>
              <div>
                <p className="text-[#9AA0B4] mb-1">Type of Entity</p>
                <p className="text-white font-semibold">Private Limited Company</p>
              </div>
              <div>
                <p className="text-[#9AA0B4] mb-1">Registered Office</p>
                <p className="text-white font-semibold">Mumbai, Maharashtra, India</p>
              </div>
              <div>
                <p className="text-[#9AA0B4] mb-1">Date of Incorporation</p>
                <p className="text-white font-semibold">February 2024</p>
              </div>
            </div>
            <p className="text-xs text-[#9AA0B4] mt-6 leading-relaxed">
              Bharath Funded Trader Edutech Services Pvt. Ltd. operates as an educational and skill-evaluation platform.
              We are not a SEBI-registered broker, and we do not execute live trades on NSE or BSE.
              All trading on our platform is simulated.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 md:py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }} className="text-[#0D0F1A] mb-6">
            Want to be part of the next milestone?
          </h2>
          <p className="text-base sm:text-lg text-[#6B7080] mb-8">Start your evaluation today and join a few hundred Indian traders already on the platform.</p>
          <Link to="/pricing" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#2B4EFF] text-white font-semibold text-sm shadow-[0_6px_20px_rgba(43,78,255,0.3)] hover:bg-[#4B6AFF] transition-all">
            View Plans <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </LandingShell>
  );
}
