import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LuEye, LuEyeOff } from 'react-icons/lu';
import TubesBackground from '../../components/TubesBackground';
import logoWhite from '../../assets/bharat funded trader new logo dark.png';
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

function Register({ onLogin }) {
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

  // OTP step state. `step` flips to 'otp' once the verification code has been
  // sent — the form switches to a single 6-digit input. `resendCooldown` is
  // a seconds counter; the resend button is disabled while it's > 0 so users
  // can't spam the SMTP server.
  const [step, setStep] = useState('details');
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) { setReferralId(ref); setReferralFromLink(true); }
  }, [searchParams]);

  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Tick down the resend cooldown every second.
  useEffect(() => {
    if (resendCooldown <= 0) return;
    cooldownRef.current = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(cooldownRef.current);
  }, [resendCooldown]);

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

  // Validate the details form before we ask the server for an OTP. Keeping
  // this client-side lets us catch obvious issues without burning a code.
  const validateDetails = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields'); return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match'); return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters'); return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address'); return false;
    }
    return true;
  };

  // Submit the actual registration with the (verified) OTP attached.
  const submitRegistration = async (otpCode) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        emailOtp: otpCode || undefined,
        parentAdminId: referralId || undefined
      })
    });
    return { response, data: await response.json() };
  };

  // Step 1: validate, ask backend to email a 6-digit code, then advance the
  // form to the OTP step. If the server reports OTP isn't required (503),
  // skip straight to registration so the form still works in dev mode.
  const handleSendOtp = async (e) => {
    e?.preventDefault?.();
    if (!validateDetails()) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API_URL}/auth/send-signup-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      if (res.status === 503) {
        // OTP disabled on this server — register directly.
        const { response, data: regData } = await submitRegistration();
        finishRegistration(response, regData);
        return;
      }
      if (!res.ok) {
        setError(data.error || 'Could not send verification code'); setLoading(false); return;
      }
      // The OTP step's persistent info box already says "We sent a 6-digit
      // code to <email>" — don't also fire a success toast or it duplicates.
      setStep('otp');
      setResendCooldown(45);
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: verify the OTP by submitting it together with the registration
  // payload. Backend rejects with 400 if the code is wrong / expired, and on
  // success returns a token + user we treat exactly like Login.jsx does.
  const handleVerifyAndRegister = async (e) => {
    e?.preventDefault?.();
    setError('');
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code from your email'); return;
    }
    setLoading(true);
    try {
      const { response, data } = await submitRegistration(otp);
      finishRegistration(response, data);
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Persist auth + jump into /app, or fall back to a generic success message
  // if the server didn't return a token (older deployments).
  const finishRegistration = (response, data) => {
    if (!response.ok) {
      setError(data.error || 'Registration failed');
      return;
    }
    if (data.token && data.user) {
      const authData = { isAuthenticated: true, token: data.token, user: data.user };
      localStorage.setItem('bharatfunded-auth', JSON.stringify(authData));
      localStorage.setItem('bharatfunded-token', data.token);
      setSuccess(`Account created! Welcome, ${data.user.name || 'trader'} · ID ${data.user.oderId}`);
      if (typeof onLogin === 'function') onLogin(authData);
      navigate('/app', { replace: true });
      return;
    }
    setSuccess(`Registration successful! Your User ID is: ${data.user?.oderId}. Redirecting to login…`);
    setTimeout(() => navigate('/login'), 2000);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/send-signup-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Could not resend code'); return; }
      setSuccess('A new code is on its way.');
      setResendCooldown(45);
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TubesBackground enableClickInteraction={true}>
      <div className="auth-container tubes-auth" style={{ padding: '24px 16px' }}>
        <div className="auth-card" style={{ maxWidth: '440px', padding: '32px 28px' }}>
          {/* Header */}
          <div className="auth-header" style={{ marginBottom: '24px' }}>
            <img src={logoWhite} alt="Bharath Funded Trader" className="auth-logo-img" />
            <p className="auth-subtitle">
              {step === 'otp' ? 'Verify your email to finish' : 'Create your account to start trading'}
            </p>
          </div>

          {step === 'details' ? (
            <form className="auth-form" onSubmit={handleSendOtp} style={{ gap: '14px' }}>
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

              <button type="submit" className="auth-submit-btn" disabled={loading} style={{ marginTop: '6px' }}>
                {loading ? 'Sending verification code…' : 'Send Verification Code'}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleVerifyAndRegister} style={{ gap: '14px' }}>
              {error && <div className="auth-error">{error}</div>}
              {success && <div className="auth-success">{success}</div>}

              <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
                We sent a 6-digit code to <strong style={{ color: '#fff' }}>{formData.email}</strong>. Enter it below to finish creating your account.
              </div>

              <div className="form-group" style={{ gap: '5px' }}>
                <label htmlFor="otp">Verification Code <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6)); setError(''); }}
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  style={{ letterSpacing: '6px', textAlign: 'center', fontSize: '20px', fontWeight: 700 }}
                />
                <span className="phone-hint">Code expires in 10 minutes.</span>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying…' : 'Verify & Create Account'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => { setStep('details'); setOtp(''); setError(''); setSuccess(''); }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', padding: 0, fontSize: '13px' }}
                >
                  ← Edit details
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  style={{
                    background: 'none', border: 'none',
                    color: resendCooldown > 0 ? 'rgba(255,255,255,0.35)' : '#3b82f6',
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    padding: 0, fontSize: '13px', fontWeight: 600
                  }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          <div className="auth-footer" style={{ marginTop: '20px', paddingTop: '20px' }}>
            <p>Already have an account? <Link to="/login">Login</Link></p>
          </div>
        </div>
      </div>
    </TubesBackground>
  );
}

export default Register;
