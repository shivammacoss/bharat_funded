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

const statusConfig = {
  ACTIVE:  { color: '#3b82f6', bg: '#3b82f620', label: 'Active',  icon: '🔵' },
  PASSED:  { color: '#10b981', bg: '#10b98120', label: 'Passed',  icon: '✅' },
  FAILED:  { color: '#ef4444', bg: '#ef444420', label: 'Failed',  icon: '❌' },
  FUNDED:  { color: '#f59e0b', bg: '#f59e0b20', label: 'Funded',  icon: '💰' },
  EXPIRED: { color: '#6b7280', bg: '#6b728020', label: 'Expired', icon: '⏰' }
};

function MyChallengesPage() {
  const { user, setActiveChallengeAccountId } = useOutletContext();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/prop/my-accounts`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setAccounts(data.accounts);
    } catch (err) {
      console.error('Error loading accounts:', err);
    }
    setLoading(false);
  };

  const filtered = filter === 'ALL' ? accounts : accounts.filter(a => a.status === filter);

  // Stats
  const statCounts = {
    ALL: accounts.length,
    ACTIVE: accounts.filter(a => a.status === 'ACTIVE').length,
    PASSED: accounts.filter(a => a.status === 'PASSED').length,
    FAILED: accounts.filter(a => a.status === 'FAILED').length,
    FUNDED: accounts.filter(a => a.status === 'FUNDED').length
  };

  if (loading) {
    // Skeleton that mirrors the real page: stat pills + 3 card placeholders.
    const shimmer = {
      background: 'linear-gradient(90deg, var(--bg-secondary) 0%, var(--bg-tertiary, var(--bg-primary)) 50%, var(--bg-secondary) 100%)',
      backgroundSize: '200% 100%',
      animation: 'bft-shimmer 1.2s ease-in-out infinite',
      borderRadius: '10px'
    };
    return (
      <div style={{ padding: '20px', maxWidth: 960, margin: '0 auto' }}>
        <style>{`@keyframes bft-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        <div style={{ ...shimmer, height: 32, width: 200, marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {[1,2,3,4,5].map(i => <div key={i} style={{ ...shimmer, height: 34, width: 92 }} />)}
        </div>
        {[1,2,3].map(i => <div key={i} style={{ ...shimmer, height: 150, marginBottom: 12 }} />)}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
    <div style={{ padding: '24px 28px 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '20px', fontWeight: '700' }}>📊 My Challenges</h2>
        <button
          onClick={() => navigate('/app/challenges')}
          style={{
            padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontWeight: '600', fontSize: '13px'
          }}
        >
          + Buy New Challenge
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['ALL', 'ACTIVE', 'FUNDED', 'PASSED', 'FAILED'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              fontSize: '12px', fontWeight: '600',
              background: filter === f ? (f === 'ALL' ? '#3b82f6' : statusConfig[f]?.color || '#3b82f6') : 'var(--bg-secondary)',
              color: filter === f ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {f === 'ALL' ? 'All' : statusConfig[f]?.label || f} ({statCounts[f] || 0})
          </button>
        ))}
      </div>

      {/* Accounts List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <p>{accounts.length === 0 ? 'You haven\'t purchased any challenges yet.' : 'No accounts match this filter.'}</p>
          {accounts.length === 0 && (
            <button
              onClick={() => navigate('/app/challenges')}
              style={{ marginTop: '12px', padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#3b82f6', color: '#fff', fontWeight: '600' }}
            >
              Browse Challenges
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(acc => {
            const ch = acc.challengeId || {};
            const sc = statusConfig[acc.status] || statusConfig.ACTIVE;
            const remainMs = new Date(acc.expiresAt) - new Date();
            const remainDays = Math.max(0, Math.ceil(remainMs / (1000 * 60 * 60 * 24)));
            const profitPct = acc.currentProfitPercent || 0;
            const pnl = (acc.currentBalance || 0) - (acc.initialBalance || 0);

            return (
              <div
                key={acc._id}
                onClick={() => navigate(`/app/challenge/${acc._id}`)}
                style={{
                  padding: '16px 20px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Top Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)', background: 'var(--bg-tertiary, var(--bg-primary))', padding: '2px 8px', borderRadius: '4px' }}>{acc.accountId}</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '15px' }}>{ch.name || 'Challenge'}</span>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: sc.bg, color: sc.color }}>
                    {sc.icon} {sc.label}
                  </span>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Balance</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>₹{(acc.currentBalance || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px' }}>P&L</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: pnl >= 0 ? '#10b981' : '#ef4444' }}>
                      {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} ({profitPct.toFixed(1)}%)
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Phase</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {acc.accountType === 'FUNDED' ? '💰 Funded' : `${acc.currentPhase}/${acc.totalPhases}`}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Daily DD</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: (acc.currentDailyDrawdownPercent || 0) > 3 ? '#ef4444' : '#10b981' }}>
                      {(acc.currentDailyDrawdownPercent || 0).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Trades</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{acc.totalTrades || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                      {acc.status === 'FUNDED' ? 'Profit Split' : 'Remaining'}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: acc.status === 'FUNDED' ? '#f59e0b' : remainDays < 7 ? '#ef4444' : 'var(--text-primary)' }}>
                      {acc.status === 'FUNDED' ? `${acc.profitSplitPercent || 80}%` : `${remainDays}d`}
                    </div>
                  </div>
                </div>

                {/* Fail reason */}
                {acc.status === 'FAILED' && acc.failReason && (
                  <div style={{ marginTop: '10px', padding: '8px 12px', background: '#ef444410', borderRadius: '8px', fontSize: '12px', color: '#ef4444' }}>
                    Reason: {acc.failReason}
                  </div>
                )}

                {/* Start Trading button — set active challenge context before navigating */}
                {(acc.status === 'ACTIVE' || acc.status === 'FUNDED') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveChallengeAccountId?.(acc._id);
                      navigate('/app/market');
                    }}
                    style={{
                      marginTop: '12px', padding: '8px 20px', borderRadius: '8px', border: 'none',
                      cursor: 'pointer', fontWeight: '600', fontSize: '12px', color: '#fff',
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    }}
                  >
                    📈 Start Trading
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
    </div>
  );
}

export default MyChallengesPage;
