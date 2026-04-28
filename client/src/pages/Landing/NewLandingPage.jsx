import { lazy, Suspense } from 'react';
import './landing.css';

// Above-the-fold: load eagerly for instant first paint
import TopBanner from './components/TopBanner';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import WhatsAppFloat from './components/WhatsAppFloat';

// Below-the-fold: lazy load to keep initial bundle small and page responsive
const HomePricing = lazy(() => import('./components/HomePricing'));
const MarketAccess = lazy(() => import('./components/MarketAccess'));
const WhyChooseUs = lazy(() => import('./components/WhyChooseUs'));
const TradingPlatform = lazy(() => import('./components/TradingPlatform'));
const Testimonials = lazy(() => import('./components/Testimonials'));
const FAQ = lazy(() => import('./components/FAQ'));
const Education = lazy(() => import('./components/Education'));
const AccountOpening = lazy(() => import('./components/AccountOpening'));
const Contact = lazy(() => import('./components/Contact'));
const Footer = lazy(() => import('./components/Footer'));

const SectionFallback = () => (
  <div className="min-h-[200px] flex items-center justify-center" />
);

export default function NewLandingPage() {
  return (
    <div className="landing-page min-h-screen bg-white">
      <TopBanner />
      <Navbar />
      <Hero />

      <Suspense fallback={<SectionFallback />}>
        <MarketAccess />
        <WhyChooseUs />
        <HomePricing />
        <TradingPlatform />
        <Testimonials />
        <FAQ />
        <Education />
        <AccountOpening />
        <Contact />
        <Footer />
      </Suspense>

      <WhatsAppFloat />
    </div>
  );
}
