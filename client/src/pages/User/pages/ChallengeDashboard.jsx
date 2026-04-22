import { useState, useEffect } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';

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

function ProgressBar({ value, max, color = '#3b82f6', dangerColor = '#ef4444', dangerThreshold = 80, height = 8, label }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const isDanger = pct >= dangerThreshold;
  const barColor = isDanger ? dangerColor : color;
  return (
    <div style={{ marginBottom: '4px' }}>
      {label && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ color: barColor, fontWeight: '600' }}>{value.toFixed(2)}% / {max}%</span>
      </div>}
      <div style={{ height, background: 'var(--bg-tertiary, var(--bg-primary))', borderRadius: height / 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: height / 2, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

// Default Indian-market symbols users can quickly pick to trade from the
// challenge terminal. Matches the instruments the platform supports after
// the forex/USD purge — NSE large-caps + indices.
const QUICK_SYMBOLS = [
  { symbol: 'NIFTY50', name: 'Nifty 50' },
  { symbol: 'BANKNIFTY', name: 'Bank Nifty' },
  { symbol: 'FINNIFTY', name: 'Fin Nifty' },
  { symbol: 'SENSEX', name: 'BSE Sensex' },
  { symbol: 'RELIANCE', name: 'Reliance' },
  { symbol: 'TCS', name: 'TCS' },
  { symbol: 'INFY', name: 'Infosys' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank' },
  { symbol: 'SBIN', name: 'SBI' },
  { symbol: 'ITC', name: 'ITC' },
  { symbol: 'LT', name: 'Larsen & Toubro' }
];

function ChallengeDashboard() {
  const { user, setActiveChallengeAccountId } = useOutletContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showViolations, setShowViolations] = useState(false);

  // Quick-trade panel state — user picks a symbol + lot size, clicks
  // Buy/Sell, order is placed on the challenge's isolated sub-wallet via
  // the /api/orders endpoint with `challengeAccountId`.
  const [qtSymbol, setQtSymbol] = useState('NIFTY50');
  const [qtVolume, setQtVolume] = useState('1');
  const [qtPrice, setQtPrice] = useState('');
  const [qtPlacing, setQtPlacing] = useState(false);
  const [qtMessage, setQtMessage] = useState(null);

  // Whenever the user opens this dashboard, set the active-challenge context
  // so any trade placed (from the embedded quick trade panel OR from a
  // subsequent /app/market navigation) routes to THIS challenge's
  // sub-wallet — not the user's main wallet.
  useEffect(() => {
    if (id && setActiveChallengeAccountId) {
      setActiveChallengeAccountId(id);
    }
  }, [id, setActiveChallengeAccountId]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const placeQuickOrder = async (side) => {
    const volNum = parseFloat(qtVolume);
    const priceNum = parseFloat(qtPrice);
    if (!qtSymbol.trim()) { setQtMessage({ type: 'error', text: 'Pick a symbol' }); return; }
    if (!(volNum > 0)) { setQtMessage({ type: 'error', text: 'Lots must be > 0' }); return; }
    if (!(priceNum > 0)) { setQtMessage({ type: 'error', text: 'Enter price (use latest market price)' }); return; }
    setQtPlacing(true);
    setQtMessage(null);
    try {
      const userData = JSON.parse(localStorage.getItem('bharatfunded-user') || '{}');
      const userId = userData.oderId || userData.userId || user?.oderId;
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          mode: 'netting',
          userId,
          challengeAccountId: id,
          symbol: qtSymbol.trim().toUpperCase(),
          side,
          volume: volNum,
          quantity: volNum,
          price: priceNum,
          entryPrice: priceNum,
          leverage: 100,
          orderType: 'market',
          exchange: 'NSE'
        })
      });
      const result = await res.json();
      if (result.success) {
        setQtMessage({ type: 'success', text: `${side.toUpperCase()} ${volNum} lot ${qtSymbol.toUpperCase()} placed on challenge` });
        fetchDashboard();
      } else {
        setQtMessage({ type: 'error', text: result.error || result.message || 'Order failed' });
      }
    } catch (err) {
      setQtMessage({ type: 'error', text: 'Network error placing order' });
    } finally {
      setQtPlacing(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_URL}/api/prop/account/${id}/dashboard`, { headers: getAuthHeaders() });
      const result = await res.json();
      if (result.success) setData(result);
      else if (!data) navigate('/app/my-challenges');
    } catch (err) {
      console.error('Error loading dashboard:', err);
    }
    setLoading(false);
  };

  const handleWithdraw = async () => {
    if (!confirm('Request a profit payout? Admin will review and approve — funds credit to your wallet only after approval.')) return;
    setWithdrawing(true);
    try {
      const res = await fetch(`${API_URL}/api/prop/withdraw`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ challengeAccountId: id })
      });
      const result = await res.json();
      if (result.success) {
        alert(result.message || 'Payout request submitted. Admin will review shortly.');
        fetchDashboard();
      } else {
        alert(result.message || 'Withdrawal failed');
      }
    } catch (err) {
      alert('Error processing withdrawal');
    }
    setWithdrawing(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <p>Loading challenge dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
        <p>Challenge account not found.</p>
        <button onClick={() => navigate('/app/my-challenges')} style={{ marginTop: '12px', padding: '10px 20px', borderRadius: '8px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Back to My Challenges
        </button>
      </div>
    );
  }

  const { account, balance, drawdown, profit, trades, rules, time, funded, violations, challenge } = data;
  const sc = statusConfig[account.status] || statusConfig.ACTIVE;
  const pnl = balance.current - balance.initial;

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
    <div style={{ padding: '16px 20px 60px' }}>
      {/* Back button */}
      <button
        onClick={() => navigate('/app/my-challenges')}
        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', marginBottom: '16px', padding: 0 }}
      >
        ← Back to My Challenges
      </button>

      {/* Header Card */}
      <div style={{
        padding: '20px',
        background: 'var(--bg-secondary)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px', fontWeight: '700' }}>{challenge.name}</h2>
              <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: sc.bg, color: sc.color }}>
                {sc.icon} {sc.label}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span>ID: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{account.accountId}</strong></span>
              <span>Fund: <strong style={{ color: '#10b981' }}>₹{challenge.fundSize?.toLocaleString('en-IN')}</strong></span>
              {account.accountType !== 'FUNDED' && (
                <span>Phase: <strong style={{ color: 'var(--text-primary)' }}>{account.currentPhase}/{account.totalPhases}</strong></span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: pnl >= 0 ? '#10b981' : '#ef4444' }}>
              {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: pnl >= 0 ? '#10b981' : '#ef4444' }}>
              {profit.currentPercent >= 0 ? '+' : ''}{profit.currentPercent.toFixed(2)}% P&L
            </div>
          </div>
        </div>
        {/* Trade Button — sets active challenge context before navigating */}
        {(account.status === 'ACTIVE' || account.status === 'FUNDED') && (
          <button
            onClick={() => {
              setActiveChallengeAccountId?.(account._id || id);
              navigate('/app/market');
            }}
            style={{
              marginTop: '12px', padding: '12px 32px', borderRadius: '12px', border: 'none',
              cursor: 'pointer', fontWeight: '700', fontSize: '14px',
              background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
              boxShadow: '0 4px 15px rgba(16,185,129,0.3)', display: 'inline-flex', alignItems: 'center', gap: '8px'
            }}
          >
            &#x1F4C8; Start Trading
          </button>
        )}
      </div>

      {/* Balance & Equity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        {[
          { label: 'Balance', value: `₹${balance.current.toFixed(2)}`, color: 'var(--text-primary)' },
          { label: 'Equity', value: `₹${balance.equity.toFixed(2)}`, color: 'var(--text-primary)' },
          { label: 'Initial', value: `₹${balance.initial.toFixed(2)}`, color: 'var(--text-secondary)' },
          { label: 'Remaining', value: `${time.remainingDays} days`, color: time.remainingDays < 7 ? '#ef4444' : '#3b82f6' },
        ].map((item, i) => (
          <div key={i} style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{item.label}</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Drawdown Section */}
      <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 16px', fontSize: '15px' }}>📉 Drawdown Limits</h3>
        <ProgressBar
          value={drawdown.dailyUsed}
          max={drawdown.dailyMax}
          color="#f59e0b"
          dangerColor="#ef4444"
          dangerThreshold={70}
          height={10}
          label="Daily Drawdown"
        />
        <div style={{ height: '12px' }} />
        <ProgressBar
          value={drawdown.overallUsed}
          max={drawdown.overallMax}
          color="#f59e0b"
          dangerColor="#ef4444"
          dangerThreshold={70}
          height={10}
          label="Overall Drawdown"
        />
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px' }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'var(--bg-tertiary, var(--bg-primary))', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Daily Remaining</div>
            <div style={{ color: drawdown.dailyRemaining < 2 ? '#ef4444' : '#10b981', fontWeight: '700', fontSize: '16px' }}>
              {drawdown.dailyRemaining.toFixed(2)}%
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'var(--bg-tertiary, var(--bg-primary))', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Overall Remaining</div>
            <div style={{ color: drawdown.overallRemaining < 3 ? '#ef4444' : '#10b981', fontWeight: '700', fontSize: '16px' }}>
              {drawdown.overallRemaining.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Profit Target Section (only for non-funded challenge accounts) */}
      {account.accountType !== 'FUNDED' && profit.targetPercent > 0 && (
        <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 16px', fontSize: '15px' }}>🎯 Profit Target — Phase {account.currentPhase}</h3>
          <ProgressBar
            value={Math.max(0, profit.currentPercent)}
            max={profit.targetPercent}
            color="#10b981"
            dangerColor="#10b981"
            dangerThreshold={999}
            height={12}
            label="Progress to Target"
          />
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px' }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'var(--bg-tertiary, var(--bg-primary))', borderRadius: '8px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Current Profit</div>
              <div style={{ color: profit.currentPercent >= 0 ? '#10b981' : '#ef4444', fontWeight: '700', fontSize: '16px' }}>
                {profit.currentPercent.toFixed(2)}%
              </div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'var(--bg-tertiary, var(--bg-primary))', borderRadius: '8px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Target</div>
              <div style={{ color: '#3b82f6', fontWeight: '700', fontSize: '16px' }}>
                {profit.targetPercent}%
              </div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'var(--bg-tertiary, var(--bg-primary))', borderRadius: '8px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Amount Needed</div>
              <div style={{ color: '#f59e0b', fontWeight: '700', fontSize: '16px' }}>
                ₹{profit.amountToTarget.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Funded Account — Withdrawal */}
      {account.status === 'FUNDED' && (
        <div style={{ padding: '20px', background: 'linear-gradient(135deg, #f59e0b10, #10b98110)', borderRadius: '16px', border: '1px solid #f59e0b30', marginBottom: '16px' }}>
          <h3 style={{ color: '#f59e0b', margin: '0 0 16px', fontSize: '15px' }}>💰 Funded Account — Profit Withdrawal</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Profit Split</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>{funded.profitSplitPercent}%</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Withdrawable</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>₹{funded.withdrawable.toFixed(2)}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Withdrawn</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>₹{funded.totalWithdrawn.toFixed(2)}</div>
            </div>
          </div>
          {funded.withdrawable > 0 ? (
            <button
              onClick={handleWithdraw}
              disabled={withdrawing}
              style={{
                width: '100%', padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
                fontWeight: '700', fontSize: '15px', opacity: withdrawing ? 0.6 : 1
              }}
            >
              {withdrawing ? 'Submitting request…' : `Request Payout ₹${funded.withdrawable.toFixed(2)}`}
            </button>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
              No profit to withdraw. Keep trading to earn profits!
            </p>
          )}
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '11px', marginTop: 10, marginBottom: 0 }}>
            Payouts are reviewed by admin before being credited to your main wallet.
          </p>
          {funded.lastWithdrawalDate && (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '11px', marginTop: '8px' }}>
              Last withdrawal: {new Date(funded.lastWithdrawalDate).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Trade Stats */}
      <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 16px', fontSize: '15px' }}>📈 Trade Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
          {[
            { label: 'Trades Today', value: trades.today, extra: trades.maxPerDay ? `/ ${trades.maxPerDay}` : '' },
            { label: 'Open Trades', value: trades.openCount, extra: trades.maxConcurrent ? `/ ${trades.maxConcurrent}` : '' },
            { label: 'Total Trades', value: trades.total },
            { label: 'Trading Days', value: trades.tradingDays, extra: trades.requiredDays ? `/ ${trades.requiredDays} req` : '' },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '10px', background: 'var(--bg-tertiary, var(--bg-primary))', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{item.label}</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {item.value}{item.extra && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}> {item.extra}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Trade — places orders directly on THIS challenge's sub-wallet.
          For full charts / complex orders the user taps "Open Full Terminal"
          which navigates to /app/market with the active-challenge context
          already set (see `useEffect` at mount), so the OrderPanel on that
          page will also route to this challenge. */}
      {(account.status === 'ACTIVE' || account.status === 'FUNDED') && (
        <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '15px' }}>🛒 Market & Quick Trade</h3>
            <button
              type="button"
              onClick={() => { setActiveChallengeAccountId?.(account._id || id); navigate('/app/market'); }}
              style={{ padding: '8px 14px', borderRadius: '8px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
            >
              Open Full Terminal →
            </button>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Tap a symbol to pick it, enter lots and price, then Buy or Sell. Orders route to this challenge's virtual wallet only — your main wallet stays untouched.
          </div>

          {/* Symbol chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
            {QUICK_SYMBOLS.map(s => (
              <button
                key={s.symbol}
                type="button"
                onClick={() => setQtSymbol(s.symbol)}
                style={{
                  padding: '6px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  border: qtSymbol === s.symbol ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                  background: qtSymbol === s.symbol ? 'color-mix(in srgb, #3b82f6 15%, var(--bg-primary))' : 'var(--bg-primary)',
                  color: qtSymbol === s.symbol ? '#3b82f6' : 'var(--text-primary)'
                }}
                title={s.name}
              >
                {s.symbol}
              </button>
            ))}
          </div>

          {/* Order form */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>Symbol</label>
              <input
                type="text"
                value={qtSymbol}
                onChange={e => setQtSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. RELIANCE"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>Lots</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={qtVolume}
                onChange={e => setQtVolume(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>Price (₹)</label>
              <input
                type="number"
                step="0.05"
                min="0"
                value={qtPrice}
                onChange={e => setQtPrice(e.target.value)}
                placeholder="Current market"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Buy / Sell */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => placeQuickOrder('sell')}
              disabled={qtPlacing}
              style={{
                padding: '14px', borderRadius: '10px', border: 'none', cursor: qtPlacing ? 'not-allowed' : 'pointer',
                background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '14px', opacity: qtPlacing ? 0.6 : 1
              }}
            >
              {qtPlacing ? '…' : 'SELL'}
            </button>
            <button
              type="button"
              onClick={() => placeQuickOrder('buy')}
              disabled={qtPlacing}
              style={{
                padding: '14px', borderRadius: '10px', border: 'none', cursor: qtPlacing ? 'not-allowed' : 'pointer',
                background: '#10b981', color: '#fff', fontWeight: 700, fontSize: '14px', opacity: qtPlacing ? 0.6 : 1
              }}
            >
              {qtPlacing ? '…' : 'BUY'}
            </button>
          </div>

          {qtMessage && (
            <div style={{
              marginTop: '12px', padding: '10px 12px', borderRadius: '8px', fontSize: '12px',
              background: qtMessage.type === 'success' ? 'color-mix(in srgb, #10b981 12%, var(--bg-primary))' : 'color-mix(in srgb, #ef4444 12%, var(--bg-primary))',
              border: `1px solid ${qtMessage.type === 'success' ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
              color: qtMessage.type === 'success' ? '#10b981' : '#ef4444'
            }}>
              {qtMessage.text}
            </div>
          )}
        </div>
      )}

      {/* Rules Summary */}
      <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 12px', fontSize: '15px' }}>📜 Challenge Rules</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
          {rules.stopLossMandatory && (
            <span style={{ padding: '4px 12px', borderRadius: '16px', background: '#ef444420', color: '#ef4444' }}>🛡️ SL Mandatory</span>
          )}
          <span style={{ padding: '4px 12px', borderRadius: '16px', background: '#3b82f620', color: '#3b82f6' }}>⚡ Max Leverage 1:{rules.maxLeverage}</span>
          <span style={{ padding: '4px 12px', borderRadius: '16px', background: '#10b98120', color: '#10b981' }}>📊 Lots {rules.minLotSize} - {rules.maxLotSize}</span>
          {rules.minHoldTimeSeconds > 0 && (
            <span style={{ padding: '4px 12px', borderRadius: '16px', background: '#f59e0b20', color: '#f59e0b' }}>⏱️ Min Hold {rules.minHoldTimeSeconds}s</span>
          )}
        </div>
      </div>

      {/* Violations */}
      {violations.length > 0 && (
        <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showViolations ? '12px' : 0 }}>
            <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '15px' }}>
              ⚠️ Violations ({violations.length})
            </h3>
            <button
              onClick={() => setShowViolations(!showViolations)}
              style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '12px' }}
            >
              {showViolations ? 'Hide' : 'Show'}
            </button>
          </div>
          {showViolations && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {violations.map((v, i) => (
                <div key={i} style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  background: v.severity === 'FAIL' ? '#ef444410' : '#f59e0b10',
                  color: v.severity === 'FAIL' ? '#ef4444' : '#f59e0b',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span><strong>{v.rule}</strong>: {v.description}</span>
                  <span style={{ whiteSpace: 'nowrap', marginLeft: '8px', opacity: 0.7 }}>
                    {v.timestamp ? new Date(v.timestamp).toLocaleDateString() : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  );
}

export default ChallengeDashboard;
