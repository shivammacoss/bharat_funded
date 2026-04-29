/**
 * ========================================
 * BHARAT FUNDED TRADER LANDING PAGE CONFIGURATION
 * ========================================
 * 
 * Edit this file to customize your landing page.
 * No React knowledge needed — just change the values below.
 * 
 * After saving, the page will hot-reload automatically.
 */

const landingConfig = {

  // ─── BRAND ─────────────────────────────────────
  brand: {
    name: 'Bharath Funded Trader',
    tagline: 'India Ka Apna Funded Trader Platform',
    logo: '/landing/img/bharatfunded-logo.svg',
  },

  // ─── HERO SECTION ──────────────────────────────
  hero: {
    title: 'India Ka Apna',
    highlight: 'Funded Trader Platform',
    subtitle: 'Trade NIFTY, BANKNIFTY & SENSEX in a structured simulated evaluation. Pass the challenge, follow risk rules, and earn real performance rewards. Built for serious Indian intraday traders.',
    primaryCTA: {
      text: 'Explore Plans',
      link: '/pricing',
    },
    secondaryCTA: {
      text: 'Try For Free',
      link: '/login',
    },
    // Floating instrument badges shown in hero
    floatingBadges: ['Rules-Based Evaluation', 'Simulated Trading Only', 'Intraday Focused', "India's #1 Prop Evaluation"],
  },

  // ─── FEATURES SECTION ─────────────────────────
  // Add, remove, or reorder items. Each needs icon, title, description.
  features: [
    {
      icon: '📡',
      title: 'Live Market Data',
      description: 'Real-time NIFTY & BANKNIFTY feeds with fast tick updates inside a clean trading terminal.',
    },
    {
      icon: '🛡️',
      title: 'Built-in Risk Rules',
      description: 'Max Daily Loss and Max Drawdown enforced automatically — trade with discipline by design.',
    },
    {
      icon: '⚡',
      title: 'Instant Order Execution',
      description: 'Fast simulated order execution with live PnL tracking and open position monitoring.',
    },
    {
      icon: '🇮🇳',
      title: 'India-First Platform',
      description: 'INR payments, Indian market hours, and instruments designed for Indian index traders.',
    },
    {
      icon: '📊',
      title: 'Performance Analytics',
      description: 'Daily session reports, behavior tracking, and consistency scores to help you improve.',
    },
  ],

  // ─── STATS SECTION ────────────────────────────
  stats: [
    { value: '10K+', label: 'Active Traders' },
    { value: '₹50Cr+', label: 'Simulated Volume' },
    { value: '3', label: 'Instruments' },
    { value: '99.9%', label: 'Uptime' },
  ],

  // ─── HOW IT WORKS ─────────────────────────────
  steps: [
    {
      step: '01',
      title: 'Choose Your Plan',
      description: 'Pick a Qualifier tier that matches your trading style. Each plan comes with a defined simulated capital size and clear rules.',
    },
    {
      step: '02',
      title: 'Trade & Follow Rules',
      description: 'Trade intraday on NIFTY/BANKNIFTY within our risk rules — Max Daily Loss, Max Drawdown, and Intraday Square-off by 3:15 PM.',
    },
    {
      step: '03',
      title: 'Hit Your Targets',
      description: 'Achieve your profit target while staying within loss limits. Consistency and discipline are rewarded, not just big wins.',
    },
    {
      step: '04',
      title: 'Earn Your Rewards',
      description: 'Pass the evaluation, complete KYC verification, and unlock your performance-based reward payout directly to your bank account.',
    },
  ],

  // ─── TESTIMONIALS ─────────────────────────────
  testimonials: [
    {
      name: 'Rajesh K.',
      role: 'Intraday Trader',
      avatar: 'RK',
      text: 'Bharath Funded Trader gave me the structure I needed. The rules keep me disciplined and the payouts are real.',
      rating: 5,
    },
    {
      name: 'Priya M.',
      role: 'Options Trader',
      avatar: 'PM',
      text: 'Finally a funded evaluation platform built for Indian traders. NIFTY and BANKNIFTY with INR — exactly what I wanted.',
      rating: 5,
    },
    {
      name: 'Amit S.',
      role: 'Day Trader',
      avatar: 'AS',
      text: 'The simulated environment feels real. Clear rules, transparent payouts, and a platform that respects Indian market hours.',
      rating: 5,
    },
  ],

  // ─── CTA BANNER ───────────────────────────────
  ctaBanner: {
    title: 'Ready to Start Your Funded Trading Journey?',
    subtitle: 'Join thousands of traders who trust Bharath Funded Trader for structured evaluations and real rewards.',
    buttonText: 'Start Your Journey',
    buttonLink: '/register',
  },

  // ─── FOOTER ───────────────────────────────────
  footer: {
    description: 'India Ka Apna Funded Trader Platform. Simulated evaluations for serious Indian intraday traders.',
    links: {
      Platform: [
        { text: 'Home', href: '#home' },
        { text: 'How It Works', href: '#howItWorks' },
        { text: 'Evaluation Plans', href: '/register' },
      ],
      Resources: [
        { text: 'Proof & Payouts', href: '#' },
        { text: 'FAQs', href: '#' },
        { text: 'Contact Us', href: '#contact' },
      ],
      Legal: [
        { text: 'Privacy Policy', href: '/privacy-policy' },
        { text: 'Terms & Conditions', href: '/terms' },
        { text: 'Refund Policy', href: '/refund-policy' },
      ],
    },
    copyright: `© ${new Date().getFullYear()} Bharath Funded Trader. All rights reserved.`,
    disclaimer: 'Bharath Funded Trader is not a broker and does not execute live trades on NSE or BSE. The platform provides simulated evaluations and performance-based reward programs. Trading involves risk. Please read all terms before participating.',
  },

  // ─── SECTION VISIBILITY ───────────────────────
  // Set any to false to hide that section
  sections: {
    hero: true,
    features: true,
    stats: true,
    howItWorks: true,
    testimonials: true,
    ctaBanner: true,
    footer: true,
  },
};

export default landingConfig;
