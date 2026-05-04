import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TubesBackground from '../../components/TubesBackground';
import tradingSounds from '../../utils/sounds';
// Auth pages sit on the dark TubesBackground — use the white/inverted logo.
import logoWhite from '../../assets/bharat funded trader new logo dark.png';
import './Auth.css';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Official Google "G" logo (multi-color)
const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleInitialized = useRef(false);

  // Handle Google credential response
  const handleGoogleResponse = useCallback(async (response) => {
    if (!response?.credential) return;
    setGoogleLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Google login failed');
        return;
      }
      const authData = { isAuthenticated: true, token: data.token, user: data.user };
      localStorage.setItem('bharatfunded-auth', JSON.stringify(authData));
      localStorage.setItem('bharatfunded-token', data.token);
      tradingSounds.playLogin();
      onLogin(authData);
      navigate('/');
    } catch (err) {
      setError('Google login failed. Please try again.');
      console.error('Google login error:', err);
    } finally {
      setGoogleLoading(false);
    }
  }, [navigate, onLogin]);

  // Load Google Identity Services script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || googleInitialized.current) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        googleInitialized.current = true;
      }
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [handleGoogleResponse]);

  // Handle redirect callback (id_token in URL hash)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('id_token=')) {
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get('id_token');
      if (idToken) {
        window.location.hash = '';
        handleGoogleResponse({ credential: idToken });
      }
    }
  }, [handleGoogleResponse]);

  const handleGoogleClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // One Tap not available — fall back to redirect-based flow
          const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/login')}&response_type=id_token&scope=openid email profile&nonce=${Date.now()}`;
          window.location.href = authUrl;
        }
      });
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Login successful
      const authData = {
        isAuthenticated: true,
        token: data.token,
        user: data.user
      };
      
      localStorage.setItem('bharatfunded-auth', JSON.stringify(authData));
      localStorage.setItem('bharatfunded-token', data.token);
      
      // Play login sound
      tradingSounds.playLogin();
      
      onLogin(authData);
      navigate('/');
    } catch (err) {
      setError('Server error. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
    <TubesBackground enableClickInteraction={true}>
      <div className="auth-container tubes-auth">
        <div className="auth-card">
          <div className="auth-header">
            <img src={logoWhite} alt="Bharath Funded Trader" className="auth-logo-img" />
            <p className="auth-subtitle">Welcome back! Please login to continue.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="username">User ID / Email / Phone</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your ID, email or phone"
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>

            {GOOGLE_CLIENT_ID && (
              <>
                <div className="auth-divider"><span>or</span></div>
                <button
                  type="button"
                  className="google-login-btn"
                  onClick={handleGoogleClick}
                  disabled={googleLoading}
                >
                  <GoogleLogo />
                  {googleLoading ? 'Signing in…' : 'Continue with Google'}
                </button>
              </>
            )}
          </form>

          <div className="auth-footer">
            <p>Don't have an account? <Link to="/register">Register Now</Link></p>
          </div>
        </div>
      </div>
    </TubesBackground>
    </div>
  );
}

export default Login;
