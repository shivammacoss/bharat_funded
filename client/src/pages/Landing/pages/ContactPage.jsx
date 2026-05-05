import { useState } from 'react';
import { Send, Mail, MapPin, MessageCircle, Send as TelegramIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import LandingShell from '../components/LandingShell';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TopBanner from '../components/TopBanner';
import '../landing.css';

const contactInfo = [
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: '+91 83670 45119',
    sub: 'Fastest way to reach us',
    href: 'https://wa.me/918367045119',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'bharathfundedtradersupport@gmail.com',
    sub: 'We reply within a few hours',
    href: 'mailto:bharathfundedtradersupport@gmail.com',
  },
  {
    icon: TelegramIcon,
    label: 'Telegram',
    value: '@Bharathfundedtrader',
    sub: 'Join our channel',
    href: 'https://t.me/Bharathfundedtrader',
  },
  {
    icon: MapPin,
    label: 'Office',
    value: 'Bharath Funded Trader Edutech Services',
    sub: 'Oval House, 03/302, British Hotel Lane, Mumbai, Maharashtra, 400001',
    href: 'https://maps.google.com/?q=Oval+House+British+Hotel+Lane+Mumbai',
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <LandingShell>
      <TopBanner />
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 md:pt-44 md:pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-[#2B4EFF] uppercase tracking-widest mb-4">Contact Us</p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em' }} className="text-[#0D0F1A] mb-6">
            Get in <span className="text-[#2B4EFF]">touch</span>
          </h1>
          <p className="text-base sm:text-lg text-[#6B7080] max-w-2xl mx-auto leading-relaxed">
            Have a question about our platform, evaluation plans, or payouts?
            We're here to help. Reach out and we'll get back to you quickly.
          </p>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">

          {/* Left — Contact Info */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-[#0D0F1A] mb-6">Reach us directly</h2>
            <div className="space-y-5">
              {contactInfo.map((c) => {
                const Icon = c.icon;
                return (
                  <a
                    key={c.label}
                    href={c.href}
                    target={c.href.startsWith('http') ? '_blank' : undefined}
                    rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="flex items-start gap-4 p-3 -mx-3 rounded-xl hover:bg-[#FAFBFD] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[rgba(43,78,255,0.08)] border border-[rgba(43,78,255,0.15)] flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-[#2B4EFF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#2B4EFF] uppercase tracking-wider mb-0.5">{c.label}</p>
                      <p className="text-sm font-bold text-[#0D0F1A] break-words">{c.value}</p>
                      <p className="text-xs text-[#6B7080] mt-0.5 leading-relaxed">{c.sub}</p>
                    </div>
                  </a>
                );
              })}
            </div>

            <div className="mt-10 p-6 bg-[#FAFBFD] border border-[#E8EAF0] rounded-2xl">
              <h3 className="text-sm font-bold text-[#0D0F1A] mb-2">Working Hours</h3>
              <div className="space-y-2">
                {[
                  { day: 'Monday – Friday', time: '9:00 AM – 6:00 PM' },
                  { day: 'Saturday', time: '9:00 AM – 2:00 PM' },
                  { day: 'Sunday', time: 'Closed' },
                ].map((row) => (
                  <div key={row.day} className="flex justify-between text-sm">
                    <span className="text-[#6B7080]">{row.day}</span>
                    <span className={`font-medium ${row.time === 'Closed' ? 'text-red-500' : 'text-[#0D0F1A]'}`}>{row.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Form */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-[#E8EAF0] rounded-2xl p-6 sm:p-8 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
              <h2 className="text-xl font-bold text-[#0D0F1A] mb-6">Send us a message</h2>

              {submitted ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                      <path d="M6 14l6 6 10-12" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-lg font-bold text-[#0D0F1A]">Message Sent!</p>
                  <p className="text-sm text-[#6B7080]">We'll get back to you within 2 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-semibold text-[#6B7080] mb-1.5 block">Your Name</label>
                      <input
                        type="text"
                        placeholder="Rahul Sharma"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-[#E8EAF0] bg-[#FAFBFD] text-[#0D0F1A] text-sm placeholder-[#6B7080]/50 focus:outline-none focus:border-[#2B4EFF] transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#6B7080] mb-1.5 block">Email Address</label>
                      <input
                        type="email"
                        placeholder="rahul@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-[#E8EAF0] bg-[#FAFBFD] text-[#0D0F1A] text-sm placeholder-[#6B7080]/50 focus:outline-none focus:border-[#2B4EFF] transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#6B7080] mb-1.5 block">Subject</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#E8EAF0] bg-[#FAFBFD] text-[#0D0F1A] text-sm focus:outline-none focus:border-[#2B4EFF] transition-all"
                      required
                    >
                      <option value="">Select a topic</option>
                      <option>Evaluation Plans</option>
                      <option>Payouts & KYC</option>
                      <option>Technical Issue</option>
                      <option>Trading Query</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#6B7080] mb-1.5 block">Message</label>
                    <textarea
                      rows={5}
                      placeholder="Describe your query in detail..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#E8EAF0] bg-[#FAFBFD] text-[#0D0F1A] text-sm placeholder-[#6B7080]/50 focus:outline-none focus:border-[#2B4EFF] transition-all resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-full bg-[#2B4EFF] text-white font-semibold text-sm hover:bg-[#4B6AFF] transition-all shadow-[0_6px_20px_rgba(43,78,255,0.3)] flex items-center justify-center gap-2"
                  >
                    <Send size={16} />
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </LandingShell>
  );
}
