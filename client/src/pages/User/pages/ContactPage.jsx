import { useOutletContext } from 'react-router-dom';

function ContactPage() {
  const { user } = useOutletContext();

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={{ padding: '24px 28px 60px' }}>

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Home / <span style={{ color: 'var(--text-primary)' }}>Contact</span>
        </div>

        <h1 style={{ color: 'var(--text-primary)', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>Contact Support</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 28px' }}>Need help? Reach out to us through any of the channels below.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { icon: '\u{1F4E7}', title: 'Email Support', desc: 'support@bharatfunded.com', sub: 'We typically respond within 24 hours' },
            { icon: '\u{1F4AC}', title: 'Live Chat', desc: 'Available Monday - Saturday', sub: '10:00 AM - 6:00 PM IST' },
            { icon: '\u{1F4F1}', title: 'Telegram', desc: '@BharatFundedSupport', sub: 'Join our community for updates' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '20px', borderRadius: '14px',
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', gap: '16px'
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'rgba(59,130,246,0.08)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '20px', flexShrink: 0
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px', marginBottom: '2px' }}>{item.title}</div>
                <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>{item.desc}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <h2 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: '700', margin: '28px 0 14px' }}>Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { q: 'How do I start an evaluation?', a: 'Go to Start Evaluation, choose a program (1-Step, 2-Step, or Instant), select your account size, and pay the fee from your wallet.' },
            { q: 'What happens after I pass?', a: 'You receive a funded account with real profit-sharing. Your certificate is issued and visible on the Certificates page.' },
            { q: 'Can I have multiple evaluations?', a: 'Yes, you can purchase and run multiple evaluations simultaneously.' },
            { q: 'How do withdrawals work?', a: 'Once funded, your profits are split according to the challenge terms. You can withdraw from your funded account dashboard.' },
          ].map((faq, i) => (
            <div key={i} style={{
              padding: '16px 18px', borderRadius: '12px',
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)'
            }}>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '13px', marginBottom: '4px' }}>{faq.q}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
