import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LuEye, LuEyeOff } from 'react-icons/lu';
import TubesBackground from '../../components/TubesBackground';
import './Auth.css';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const countries = [
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: '+7', name: 'Russia', flag: '🇷🇺' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: '+254', name: 'Kenya', flag: '🇰🇪' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭' },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+66', name: 'Thailand', flag: '🇹🇭' },
  { code: '+84', name: 'Vietnam', flag: '🇻🇳' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+977', name: 'Nepal', flag: '🇳🇵' },
];

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [referralId, setReferralId] = useState('');
  const [referralFromLink, setReferralFromLink] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', countryCode: '+91', phone: '',
    password: '', confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) { setReferralId(ref); setReferralFromLink(true); }
  }, [searchParams]);

  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData({ ...formData, phone: value.replace(/[^0-9]/g, '') });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setError('');
  };

  const selectedCountry = countries.find(c => c.code === formData.countryCode) || countries[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');

    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields'); setLoading(false); return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match'); setLoading(false); return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters'); setLoading(false); return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, parentAdminId: referralId || undefined })
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Registration failed'); setLoading(false); return; }
      setSuccess(`Registration successful! Your User ID is: ${data.user.oderId}`);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError('Server error. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <TubesBackground enableClickInteraction={true}>
      <div className="auth-container tubes-auth" style={{ padding: '24px 16px' }}>
        <div className="auth-card" style={{ maxWidth: '440px', padding: '32px 28px' }}>
          {/* Header */}
          <div className="auth-header" style={{ marginBottom: '24px' }}>
            <img src="/landing/img/bharat funded trader landscape.png" alt="Bharat Funded Trader" className="auth-logo-img" />
            <p className="auth-subtitle">Create your account to start trading</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} style={{ gap: '14px' }}>
            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            {/* Full Name */}
            <div className="form-group" style={{ gap: '5px' }}>
              <label htmlFor="name">Full Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" autoComplete="name" />
            </div>

            {/* Email */}
            <div className="form-group" style={{ gap: '5px' }}>
              <label htmlFor="email">Email Address <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" />
            </div>

            {/* Phone */}
            <div className="form-group" style={{ gap: '5px' }}>
              <label htmlFor="phone">Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
              <div className="phone-input-group">
                <select name="countryCode" value={formData.countryCode} onChange={handleChange} className="country-select">
                  {countries.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="9876543210" autoComplete="tel" className="phone-input" />
              </div>
              <span className="phone-hint">{selectedCountry.flag} {selectedCountry.name}</span>
            </div>

            {/* Password */}
            <div className="form-group" style={{ gap: '5px' }}>
              <label htmlFor="password">Password <span style={{ color: '#ef4444' }}>*</span></label>
              <div className="password-input-wrapper">
                <input type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min. 6 characters" autoComplete="new-password" />
                <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group" style={{ gap: '5px' }}>
              <label htmlFor="confirmPassword">Confirm Password <span style={{ color: '#ef4444' }}>*</span></label>
              <div className="password-input-wrapper">
                <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password" autoComplete="new-password" />
                <button type="button" className="password-toggle-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}>
                  {showConfirmPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                </button>
              </div>
            </div>

            {/* Referral Code */}
            <div className="form-group" style={{ gap: '5px' }}>
              <label htmlFor="referralCode">Referral Code <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>(Optional)</span></label>
              <input
                type="text" id="referralCode" name="referralCode" value={referralId}
                onChange={(e) => !referralFromLink && setReferralId(e.target.value)}
                placeholder="Enter referral code"
                readOnly={referralFromLink}
                style={referralFromLink ? { background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.4)', color: '#34d399', cursor: 'not-allowed' } : {}}
              />
              {referralFromLink && (
                <span style={{ fontSize: '12px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  ✓ Referral applied from link
                </span>
              )}
            </div>

            {/* Register Button */}
            <button type="submit" className="auth-submit-btn" disabled={loading} style={{ marginTop: '6px' }}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer" style={{ marginTop: '20px', paddingTop: '20px' }}>
            <p>Already have an account? <Link to="/login">Login</Link></p>
          </div>
        </div>

        {/* Terms Modal */}
        {showTermsModal && (
          <div className="terms-modal-overlay">
            <div className="terms-modal">
              <div className="terms-modal-header">
                <h2>Terms & Conditions</h2>
                <button className="terms-modal-close" onClick={declineTerms}>×</button>
              </div>
              <div className="terms-modal-body" ref={termsRef} onScroll={handleTermsScroll}>
                {!hasScrolledToBottom && (
                  <div className="scroll-indicator">Scroll down to read all terms before accepting</div>
                )}
                <section className="terms-section">
                  <h2>1. Risk Disclosure</h2>
                  <p><strong>Trading in financial markets involves substantial risk of loss.</strong> You should carefully consider whether trading is appropriate for you in light of your financial condition. The high degree of leverage that is often obtainable in trading can work against you as well as for you.</p>
                </section>
                <section className="terms-section warning-section">
                  <h2>Important Warning</h2>
                  <ul>
                    <li>Past performance is not indicative of future results</li>
                    <li>You may lose more than your initial investment</li>
                    <li>Trading can cause significant mental stress and anxiety</li>
                    <li>Financial losses can impact your personal life and relationships</li>
                    <li>Never invest money you cannot afford to lose</li>
                  </ul>
                </section>
                <section className="terms-section">
                  <h2>2. Mental Health Advisory</h2>
                  <p>Trading in financial markets can be mentally and emotionally challenging. We strongly recommend seeking professional guidance and maintaining a healthy work-life balance.</p>
                </section>
                <section className="terms-section">
                  <h2>3. Educational Requirement</h2>
                  <p>Before engaging in any trading activity, you should complete proper education about financial markets, understand technical and fundamental analysis, and practice with demo accounts before using real money.</p>
                </section>
                <section className="terms-section">
                  <h2>4. Company's Role</h2>
                  <p>Bharat Funded Trader provides <strong>technical support and platform services only</strong>. We do not provide investment advice, guaranteed returns, or trading signals. All trading decisions are made solely by you.</p>
                </section>
                <section className="terms-section">
                  <h2>5. Your Responsibilities</h2>
                  <ul>
                    <li>All investment decisions are your own responsibility</li>
                    <li>You have read and understood the risks involved</li>
                    <li>You are of legal age to trade in your jurisdiction</li>
                    <li>You will not hold the company liable for any losses</li>
                    <li>You will trade only with funds you can afford to lose</li>
                  </ul>
                </section>
                <section className="terms-section">
                  <h2>6. No Guarantee of Profits</h2>
                  <p>There is <strong>no guarantee of profits</strong> in trading. Market movements are unpredictable and past performance does not guarantee future results.</p>
                </section>
                <section className="terms-section disclaimer-section">
                  <h2>Final Disclaimer</h2>
                  <p>By registering on Bharat Funded Trader, you confirm that you have read, understood, and agree to all the terms and conditions stated above.</p>
                  <p><strong>Trade responsibly. Learn before you invest. Never risk more than you can afford to lose.</strong></p>
                </section>
              </div>
              <div className="terms-modal-footer">
                <button className="terms-decline-btn" onClick={declineTerms}>Decline</button>
                <button className="terms-accept-btn" onClick={acceptTerms} disabled={!hasScrolledToBottom}>
                  {hasScrolledToBottom ? 'I Accept' : 'Scroll to Accept'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="tubes-hint">
          <span>Click anywhere to change colors</span>
        </div>
      </div>
    </TubesBackground>
  );
}

export default Register;
