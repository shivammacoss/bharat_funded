import { Phone, Mail, MessageSquare, Send } from 'lucide-react';
import { useState } from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const SUPPORT_EMAIL = 'bharathfundedtradersupport@gmail.com';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const contactMethods = [
  {
    icon: Phone,
    label: 'Phone Support',
    value: '+91 8367045119',
    sub: 'Mon–Sat, 9AM–6PM IST',
  },
  {
    icon: Mail,
    label: 'Email Support',
    value: SUPPORT_EMAIL,
    sub: 'Response within 2 hours',
  },
  {
    icon: MessageSquare,
    label: 'WhatsApp',
    value: '+91 8367045119',
    sub: 'Mon–Sat, 9AM–9PM IST',
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { ref: headerRef } = useScrollAnimation();
  const { ref: formRef } = useScrollAnimation(0.1);

  // POSTs the form to /api/contact which emails the support inbox via the
  // Hostinger SMTP creds in .env. The visitor's email is set as Reply-To
  // so support can reply directly from their inbox.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMsg('Please fill in your name, email and message.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || `Could not send message (HTTP ${res.status}). Email us directly at ${SUPPORT_EMAIL}.`);
        return;
      }
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error('[Contact] submit failed:', err);
      setErrorMsg(`Network error — please try again or email ${SUPPORT_EMAIL}.`);
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="bg-[#0C0C1D] py-14 md:py-24 px-6 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[rgba(43,78,255,0.06)] rounded-full blur-[100px] pointer-events-none" />
      <div className="max-w-6xl mx-auto">

        {/* Two-column layout: left info, right form */}
        <div ref={formRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

          {/* Left — Heading + Contact Methods */}
          <div ref={headerRef} className="scroll-reveal flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(43,78,255,0.1)] border border-[rgba(43,78,255,0.2)] mb-5 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2B4EFF]" />
              <span className="text-xs font-semibold text-[#2B4EFF] uppercase tracking-widest">Contact Us</span>
            </div>
            <h2
              className="font-manrope font-[800] tracking-[-0.02em] text-white mb-4"
              style={{ fontSize: 'clamp(1.875rem, 4vw, 3rem)' }}
            >
              Contact Our{' '}
              <span className="text-[#2B4EFF]">Support</span> Team
            </h2>
            <p className="text-base sm:text-lg text-[#9AA0B4] font-light mb-10">
              We're here to help you 24/7. Reach out through any channel that works best for you.
            </p>

            {/* Contact list */}
            <div className="space-y-5">
              {contactMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <div key={method.label} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[rgba(43,78,255,0.1)] border border-[rgba(43,78,255,0.2)] flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-[#2B4EFF]" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white font-manrope">{method.label}</div>
                      <div className="text-sm text-[#2B4EFF] font-semibold">{method.value}</div>
                      <div className="text-xs text-[#9AA0B4] mt-0.5">{method.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right — Form */}
          <div className="bg-[#141428] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 sm:p-8">
            <div className="text-lg font-bold text-white font-manrope mb-6">Send Us a Message</div>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M6 14l6 6 10-12" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="text-base font-bold text-white font-manrope">Message Sent!</div>
                <div className="text-sm text-[#9AA0B4]">We'll get back to you within 2 hours.</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#9AA0B4] mb-1.5 block">Your Name</label>
                    <input
                      type="text"
                      placeholder="Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] text-white text-sm placeholder-[rgba(154,160,180,0.5)] focus:outline-none focus:border-[#2B4EFF] focus:bg-[rgba(255,255,255,0.08)] transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#9AA0B4] mb-1.5 block">Email Address</label>
                    <input
                      type="email"
                      placeholder="rahul@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] text-white text-sm placeholder-[rgba(154,160,180,0.5)] focus:outline-none focus:border-[#2B4EFF] focus:bg-[rgba(255,255,255,0.08)] transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#9AA0B4] mb-1.5 block">Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] text-white text-sm focus:outline-none focus:border-[#2B4EFF] focus:bg-[rgba(255,255,255,0.08)] transition-all"
                    required
                  >
                    <option value="" className="bg-[#141428] text-white">Select a topic</option>
                    <option className="bg-[#141428] text-white">Account Opening</option>
                    <option className="bg-[#141428] text-white">Fund Deposit / Withdrawal</option>
                    <option className="bg-[#141428] text-white">Technical Issue</option>
                    <option className="bg-[#141428] text-white">Trading Query</option>
                    <option className="bg-[#141428] text-white">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#9AA0B4] mb-1.5 block">Message</label>
                  <textarea
                    rows={5}
                    placeholder="Describe your query in detail..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] text-white text-sm placeholder-[rgba(154,160,180,0.5)] focus:outline-none focus:border-[#2B4EFF] focus:bg-[rgba(255,255,255,0.08)] transition-all resize-none"
                    required
                  />
                </div>

                {errorMsg && (
                  <div className="px-4 py-3 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#fca5a5] text-sm">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-4 rounded-full bg-[#2B4EFF] text-white font-bold text-sm hover:bg-[#4B6AFF] transition-all shadow-[0_6px_20px_rgba(43,78,255,0.3)] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  {sending ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
