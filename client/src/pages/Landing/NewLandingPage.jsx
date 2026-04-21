import './landing.css';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import VideoSection from './components/VideoSection';
import MarketAccess from './components/MarketAccess';
import WhyChooseUs from './components/WhyChooseUs';
import TradingPlatform from './components/TradingPlatform';
import Statistics from './components/Statistics';
import Community from './components/Community';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Education from './components/Education';
import AccountOpening from './components/AccountOpening';
import Contact from './components/Contact';
import Footer from './components/Footer';

export default function NewLandingPage() {
  return (
    <div className="landing-page min-h-screen bg-white">
      <Navbar />
      <Hero />
      <VideoSection />
      <MarketAccess />
      <WhyChooseUs />
      <TradingPlatform />
      <Statistics />
      <Community />
      <Testimonials />
      <FAQ />
      <Education />
      <AccountOpening />
      <Contact />
      <Footer />
    </div>
  );
}
