import { Twitter, Linkedin, Github, Instagram, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import TradingViewLegalNotice from './TradingViewLegalNotice';

const footerLinks = {
  'Platform': [
    { label: 'How it works', href: '/how-it-works' },
    { label: 'Challenges', href: '/challenges' },
    { label: 'Instruments', href: '/instruments' },
    { label: 'Pricing', href: '/pricing' },
  ],
  'Resources': [
    { label: 'FAQ', href: '/faqs' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact-us' },
  ],
  'Legal': [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Refund Policy', href: '/refund-policy' },
    { label: 'Risk Disclaimer', href: '/risk-disclaimer' },
  ],
};

const socialLinks = [
  { icon: Twitter, label: 'Twitter', href: '#', color: 'hover:text-sky-500' },
  { icon: Linkedin, label: 'LinkedIn', href: '#', color: 'hover:text-blue-600' },
  { icon: Instagram, label: 'Instagram', href: '#', color: 'hover:text-pink-500' },
  { icon: Youtube, label: 'YouTube', href: '#', color: 'hover:text-red-500' },
  { icon: Github, label: 'GitHub', href: '#', color: 'hover:text-white' },
];

export default function Footer() {
  const { ref: linksRef } = useScrollAnimation(0.05);

  return (
    <footer className="bg-[#0C0C1D] border-t border-[rgba(255,255,255,0.08)] relative overflow-hidden">
      {/* Main Footer */}
      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* Top: Logo + Links */}
        <div ref={linksRef} className="scroll-reveal grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="#home" className="flex items-center gap-2 mb-4 group">
              <img
                src="/landing/img/bharat_funded_white_logo.png"
                alt="Bharath Funded Trader"
                className="h-9 w-auto"
              />
            </a>
            <p className="text-sm text-[#9AA0B4] leading-relaxed mb-5">
              India Ka Apna Funded Trader Platform. Simulated evaluations for serious Indian intraday traders.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className={`w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#9AA0B4] ${s.color} hover:border-[#2B4EFF] transition-all`}
                  >
                    <Icon size={14} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('/') ? (
                      <Link
                        to={link.href}
                        className="text-sm text-[#9AA0B4] hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-[#9AA0B4] hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[rgba(255,255,255,0.08)] pt-8 mt-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#9AA0B4]">© 2025 Bharath Funded Trader Edutech Services Pvt. Ltd. All rights reserved.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/terms" className="text-sm text-[#9AA0B4] hover:text-white transition-colors">Terms & Conditions</Link>
              <Link to="/privacy-policy" className="text-sm text-[#9AA0B4] hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/refund-policy" className="text-sm text-[#9AA0B4] hover:text-white transition-colors">Refund Policy</Link>
              <Link to="/risk-disclaimer" className="text-sm text-[#9AA0B4] hover:text-white transition-colors">Risk Disclaimer</Link>
            </div>
          </div>
          <p className="text-xs text-[#9AA0B4] mt-4 leading-relaxed text-center md:text-left">
            Bharath Funded Trader is not a broker and does not execute live trades on NSE or BSE.
            The platform provides simulated evaluations and performance-based reward programs.
            Trading involves risk. Please read all terms before participating.
          </p>
        </div>
      </div>
    </footer>
  );
}
