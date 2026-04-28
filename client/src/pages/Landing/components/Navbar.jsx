import { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'How it works', to: '/how-it-works' },
  { label: 'Challenges', to: '/challenges' },
  { label: 'Instruments', to: '/instruments' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'FAQ', to: '/faqs' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact-us' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 w-full z-50 transition-all duration-300 top-[36px] sm:top-[40px] ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-[0_1px_0_#E8EAF0]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between gap-4">

        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src="/landing/img/bharat funded trader landscape.png"
            alt="Bharath Funded Trader"
            className="h-9 w-auto"
          />
        </Link>

        <div className="hidden lg:flex items-center gap-5 xl:gap-7 whitespace-nowrap">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-sm font-medium text-[#0D0F1A] hover:text-[#2B4EFF] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <Link
            to="/login"
            className="hidden lg:block text-sm font-medium text-[#0D0F1A] hover:text-[#2B4EFF] transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border-2 border-[#2B4EFF] text-[#2B4EFF] text-sm font-semibold hover:bg-[#2B4EFF] hover:text-white transition-all whitespace-nowrap"
          >
            Get Started
            <ArrowRight size={14} />
          </Link>

          <button
            className="lg:hidden text-[#0D0F1A] p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-[#E8EAF0] shadow-lg">
          <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="text-base font-medium text-[#0D0F1A] hover:text-[#2B4EFF] transition-colors py-2 border-b border-[#E8EAF0]"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-3">
              <Link to="/login" className="flex-1 text-center py-3 rounded-full border border-[#E8EAF0] text-sm font-semibold text-[#0D0F1A]">
                Login
              </Link>
              <Link to="/register" className="flex-1 text-center py-3 rounded-full bg-[#2B4EFF] text-sm font-semibold text-white">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
