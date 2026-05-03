import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getAuthHeaders() {
  const authData = JSON.parse(localStorage.getItem('bharatfunded-auth') || '{}');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authData.token || ''}`
  };
}

function DashboardPage() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [myAccounts, setMyAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/prop/my-accounts`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setMyAccounts(data.accounts || []);
    } catch (err) {
      console.error('Error loading accounts:', err);
    }
    setLoading(false);
  };

  const activeAccounts = myAccounts.filter(a => a.status === 'ACTIVE');
  const fundedAccounts = myAccounts.filter(a => a.status === 'FUNDED');
  const passedAccounts = myAccounts.filter(a => a.status === 'PASSED');

  const statusColor = (s) => {
    const map = { ACTIVE: '#3b82f6', FUNDED: '#f59e0b', PASSED: '#10b981', FAILED: '#ef4444', EXPIRED: '#6b7280' };
    return map[s] || '#6b7280';
  };

  return (
    <div className="bft-dashboard-root" style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      <style>{`
        .bft-dashboard-root .bft-dash-shell { padding: 24px 28px 60px; }
        .bft-dashboard-root .bft-dash-stepper-card { padding: 32px; }
        .bft-dashboard-root .bft-dash-stepper-line { width: 80px; }
        @media (max-width: 768px) {
          .bft-dashboard-root .bft-dash-shell { padding: 16px 12px 90px; }
          .bft-dashboard-root .bft-dash-stepper-card { padding: 20px 12px; }
          .bft-dashboard-root .bft-dash-stepper-line { width: 28px !important; }
          .bft-dashboard-root .bft-dash-stepper-card h2 { font-size: 18px !important; }
          .bft-dashboard-root .bft-dash-quick-actions { grid-template-columns: 1fr !important; gap: 12px !important; }
          .bft-dashboard-root .bft-dash-quick-card { padding: 16px !important; }
        }
        @media (max-width: 380px) {
          .bft-dashboard-root .bft-dash-stepper-line { width: 16px !important; margin: 0 4px !important; }
          .bft-dashboard-root .bft-dash-stepper-label { font-size: 10px !important; }
        }
      `}</style>
      <div className="bft-dash-shell">

        {/* Breadcrumb */}
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Home / <span style={{ color: 'var(--text-primary)' }}>Dashboard</span>
        </div>

        <h1 style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: '700', margin: '0 0 4px' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 28px' }}>Manage all your trading accounts.</p>

        {/* Evaluation Progress Stepper */}
        <div className="bft-dash-stepper-card" style={{
          borderRadius: '16px', marginBottom: '28px', textAlign: 'center',
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)'
        }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '22px', fontWeight: '700', margin: '0 0 6px' }}>
            {myAccounts.length > 0 ? 'Your Trading Journey' : 'Start your evaluation'}
          </h2>
          <p style={{ color: '#10b981', fontSize: '13px', margin: '0 0 28px' }}>
            {myAccounts.length > 0 ? 'Track your progress below' : 'Click the flag to begin.'}
          </p>

          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', maxWidth: '500px', margin: '0 auto 20px' }}>
            {[
              { label: 'Registered', done: true },
              { label: 'Email Verified', done: !!user?.isEmailVerified || true },
              { label: 'Start Evaluation', done: myAccounts.length > 0 },
            ].map((step, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: step.done ? '#10b981' : 'var(--bg-tertiary, var(--bg-primary))',
                    border: step.done ? 'none' : '2px solid var(--border-color)',
                    color: step.done ? '#fff' : 'var(--text-secondary)', fontSize: '14px', fontWeight: '700'
                  }}>
                    {step.done ? '\u2713' : i === arr.length - 1 ? '\u2691' : (i + 1)}
                  </div>
                  <span className="bft-dash-stepper-label" style={{ fontSize: '11px', color: step.done ? '#10b981' : 'var(--text-secondary)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                    {step.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className="bft-dash-stepper-line" style={{
                    height: '2px', margin: '0 8px', marginBottom: '20px',
                    background: step.done ? '#10b981' : 'var(--border-color)'
                  }} />
                )}
              </div>
            ))}
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Simulated trading &middot; Clear rules &middot; Certificates issued on pass
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bft-dash-quick-actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {/* Explore Programs */}
          <div
            onClick={() => navigate('/app/challenges')}
            className="bft-dash-quick-card"
            style={{
              padding: '24px', borderRadius: '14px', cursor: 'pointer',
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              transition: 'border-color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                &#x2B50;
              </div>
              <div>
                <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>Explore Programs</span>
                <span style={{
                  marginLeft: '8px', padding: '2px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: '700',
                  background: 'rgba(59,130,246,0.15)', color: '#3b82f6'
                }}>Paid</span>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
              Choose either a 1-Step or 2-Step simulated evaluation, or get started with instant funding. Each path has its own rules, pricing, and terms.
            </p>
          </div>

          {/* Wallet & Deposits card removed per request — wallet is still
              reachable from the sidebar so the page itself stays accessible. */}
        </div>

        {/* Active Accounts */}
        {loading ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Loading accounts...</p>
        ) : myAccounts.length > 0 ? (
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700', margin: '0 0 16px' }}>
              My Accounts
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '400', marginLeft: '8px' }}>
                {myAccounts.length} total
              </span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myAccounts.map(acc => {
                const ch = acc.challengeId || {};
                const sc = statusColor(acc.status);
                const pnl = (acc.currentBalance || 0) - (acc.initialBalance || 0);
                return (
                  <div
                    key={acc._id}
                    onClick={() => navigate(`/app/challenge/${acc._id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 20px', borderRadius: '12px', cursor: 'pointer',
                      background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                      transition: 'border-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = sc}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '10px',
                        background: `${sc}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', color: sc, fontWeight: '800'
                      }}>
                        {acc.status === 'FUNDED' ? '\u{1F4B0}' : acc.status === 'ACTIVE' ? '\u{1F4CA}' : acc.status === 'PASSED' ? '\u2705' : '\u23F0'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {ch.name || 'Challenge'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '10px' }}>
                          <span>ID: {acc.accountId}</span>
                          <span>Fund: ₹{(ch.fundSize || acc.initialBalance || 0).toLocaleString('en-IN')}</span>
                          {acc.totalPhases > 0 && <span>Phase {acc.currentPhase}/{acc.totalPhases}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '600',
                        background: `${sc}15`, color: sc
                      }}>
                        {acc.status}
                      </span>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: pnl >= 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>
                        {pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '40px', borderRadius: '14px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)'
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 16px' }}>
              No accounts yet. Start your first evaluation!
            </p>
            <button
              onClick={() => navigate('/app/challenges')}
              style={{
                padding: '12px 28px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff',
                fontWeight: '700', fontSize: '14px'
              }}
            >
              Start Evaluation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
