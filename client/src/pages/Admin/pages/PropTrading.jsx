import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const PropTrading = () => {
  const { API_URL, formatAdminCurrency } = useOutletContext();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    challengeModeEnabled: false,
    displayName: 'Prop Trading Challenge',
    description: '',
    termsAndConditions: '',
    autoCloseAtMarketClose: false
  });

  // Dashboard stats
  const [stats, setStats] = useState({
    totalChallenges: 0,
    totalAccounts: 0,
    activeAccounts: 0,
    passedAccounts: 0,
    failedAccounts: 0,
    fundedAccounts: 0
  });

  // Challenges
  const [challenges, setChallenges] = useState([]);
  const [challengeModal, setChallengeModal] = useState({ open: false, mode: 'add', editItem: null });
  const [challengeForm, setChallengeForm] = useState(getDefaultChallengeForm());

  // Accounts
  const [accounts, setAccounts] = useState([]);
  const [accountsTotal, setAccountsTotal] = useState(0);
  const [accountFilter, setAccountFilter] = useState({ status: '', search: '' });

  // Action modals
  const [actionModal, setActionModal] = useState({ open: false, type: '', account: null });
  const [actionForm, setActionForm] = useState({ days: 7, reason: '' });

  // Payouts (admin approval queue)
  const [payouts, setPayouts] = useState([]);
  const [payoutsFilter, setPayoutsFilter] = useState('pending');
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [payoutModal, setPayoutModal] = useState({ open: false, payout: null, mode: '' });
  const [payoutForm, setPayoutForm] = useState({ customAmount: '', overrideCooldown: false, adminNote: '', reason: '' });

  function getDefaultChallengeForm() {
    return {
      name: '',
      description: '',
      stepsCount: 2,
      // Legacy single-tier pricing kept for back-compat — new challenges
      // should populate `tiers` below with multiple (fundSize, fee) pairs.
      fundSize: 10000,
      challengeFee: 100,
      tiers: [
        { fundSize: 10000, challengeFee: 100, label: '', isPopular: false }
      ],
      currency: 'INR',
      isActive: true,
      rules: {
        maxDailyDrawdownPercent: 5,
        maxOverallDrawdownPercent: 10,
        maxLossPerTradePercent: 2,
        profitTargetPhase1Percent: 8,
        profitTargetPhase2Percent: 5,
        profitTargetInstantPercent: 8,
        maxOneDayProfitPercentOfTarget: null,
        consistencyRulePercent: null,
        minLotSize: 0.01,
        maxLotSize: 100,
        allowFractionalLots: false,
        maxTradesPerDay: null,
        maxConcurrentTrades: null,
        stopLossMandatory: false,
        takeProfitMandatory: false,
        minTradeHoldTimeSeconds: 0,
        allowWeekendHolding: false,
        allowNewsTrading: true,
        maxLeverage: 100,
        allowedSegments: [],
        tradingDaysRequired: null,
        challengeExpiryDays: 30
      },
      fundedSettings: {
        profitSplitPercent: 80,
        withdrawalFrequencyDays: 14
      }
    };
  }

  function getAuthHeaders() {
    const token = localStorage.getItem('bharatfunded-admin-token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Fetch settings
  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/prop/admin/settings`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setSettings(data.settings);
    } catch (err) {
      console.error('Error fetching prop settings:', err);
    }
  };

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/prop/admin/dashboard`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error('Error fetching prop stats:', err);
    }
  };

  // Fetch challenges
  const fetchChallenges = async () => {
    try {
      const res = await fetch(`${API_URL}/api/prop/admin/challenges`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setChallenges(data.challenges);
    } catch (err) {
      console.error('Error fetching challenges:', err);
    }
  };

  // Fetch accounts
  const fetchAccounts = async () => {
    try {
      let url = `${API_URL}/api/prop/admin/accounts?limit=50`;
      if (accountFilter.status) url += `&status=${accountFilter.status}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts);
        setAccountsTotal(data.total);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSettings(), fetchStats(), fetchChallenges()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab !== 'accounts') return;
    fetchAccounts();
    // Auto-refresh every 8 seconds while admin is on the accounts tab so
    // status flips (e.g. PENDING → ACTIVE after admin approves a buy
    // request from the Deposits tab) propagate without manual reload.
    const id = setInterval(fetchAccounts, 8000);
    return () => clearInterval(id);
  }, [activeTab, accountFilter.status]);

  const fetchPayouts = async () => {
    setPayoutsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/prop/admin/payouts?status=${payoutsFilter}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setPayouts(data.payouts || []);
    } catch (err) {
      console.error('Error fetching payouts:', err);
    }
    setPayoutsLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'payouts') fetchPayouts();
  }, [activeTab, payoutsFilter]);

  const openApproveModal = (p) => {
    setPayoutForm({ customAmount: String(p.requestedAmount || 0), overrideCooldown: false, adminNote: '', reason: '' });
    setPayoutModal({ open: true, payout: p, mode: 'approve' });
  };
  const openRejectModal = (p) => {
    setPayoutForm({ customAmount: '', overrideCooldown: false, adminNote: '', reason: '' });
    setPayoutModal({ open: true, payout: p, mode: 'reject' });
  };
  const closePayoutModal = () => setPayoutModal({ open: false, payout: null, mode: '' });

  const submitApprovePayout = async () => {
    const p = payoutModal.payout;
    if (!p) return;
    try {
      const res = await fetch(`${API_URL}/api/prop/admin/payouts/${p._id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          customAmount: Number(payoutForm.customAmount) || undefined,
          overrideCooldown: !!payoutForm.overrideCooldown,
          adminNote: payoutForm.adminNote || ''
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        closePayoutModal();
        fetchPayouts();
      } else {
        alert(data.message || 'Approval failed');
      }
    } catch (err) {
      alert('Approval error: ' + err.message);
    }
  };

  const submitRejectPayout = async () => {
    const p = payoutModal.payout;
    if (!p) return;
    if (!payoutForm.reason.trim()) {
      alert('Rejection reason is required');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/prop/admin/payouts/${p._id}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: payoutForm.reason.trim() })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        closePayoutModal();
        fetchPayouts();
      } else {
        alert(data.message || 'Rejection failed');
      }
    } catch (err) {
      alert('Rejection error: ' + err.message);
    }
  };

  // Toggle challenge mode
  const toggleChallengeMode = async () => {
    try {
      const res = await fetch(`${API_URL}/api/prop/admin/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...settings, challengeModeEnabled: !settings.challengeModeEnabled })
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        fetchStats();
      }
    } catch (err) {
      console.error('Error toggling challenge mode:', err);
    }
  };

  // Save settings
  const saveSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/prop/admin/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        alert('Settings saved');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  // Save challenge (create or update)
  const saveChallenge = async () => {
    if (!challengeForm.name?.trim()) {
      alert('Challenge name is required'); return;
    }
    const tiers = (challengeForm.tiers || []).filter(t => Number(t.fundSize) > 0 && Number(t.challengeFee) >= 0);
    if (tiers.length === 0) {
      alert('Add at least one pricing tier with a valid fund size and fee'); return;
    }
    try {
      const isEdit = challengeModal.mode === 'edit' && challengeModal.editItem;
      const url = isEdit
        ? `${API_URL}/api/prop/admin/challenges/${challengeModal.editItem._id}`
        : `${API_URL}/api/prop/admin/challenges`;
      const method = isEdit ? 'PUT' : 'POST';

      // Mirror the first tier into legacy fundSize/challengeFee so old
      // consumers and the list view still have a sensible default.
      const payload = {
        ...challengeForm,
        tiers,
        fundSize: tiers[0].fundSize,
        challengeFee: tiers[0].challengeFee
      };

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      let data;
      const text = await res.text();
      try { data = JSON.parse(text); } catch { data = { success: false, message: text || 'Invalid server response' }; }
      if (data.success) {
        setChallengeModal({ open: false, mode: 'add', editItem: null });
        setChallengeForm(getDefaultChallengeForm());
        fetchChallenges();
        fetchStats();
      } else {
        alert(data.message || 'Error saving challenge');
      }
    } catch (err) {
      console.error('Error saving challenge:', err);
      alert('Network error: ' + err.message);
    }
  };

  // Delete challenge
  const deleteChallenge = async (id) => {
    if (!confirm('Delete this challenge? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API_URL}/api/prop/admin/challenges/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        fetchChallenges();
        fetchStats();
      } else {
        alert(data.message || 'Error deleting challenge');
      }
    } catch (err) {
      console.error('Error deleting challenge:', err);
    }
  };

  // Edit challenge
  const editChallenge = (ch) => {
    // Hydrate tiers — use the stored `tiers` if present, otherwise synthesize
    // a single tier from the legacy fundSize/challengeFee so edits don't
    // silently drop the old pricing.
    const existingTiers = Array.isArray(ch.tiers) && ch.tiers.length > 0
      ? ch.tiers.map(t => ({
          fundSize: Number(t.fundSize) || 0,
          challengeFee: Number(t.challengeFee) || 0,
          label: t.label || '',
          isPopular: !!t.isPopular
        }))
      : [{ fundSize: Number(ch.fundSize) || 0, challengeFee: Number(ch.challengeFee) || 0, label: '', isPopular: false }];
    setChallengeForm({
      name: ch.name,
      description: ch.description || '',
      stepsCount: ch.stepsCount,
      fundSize: ch.fundSize,
      challengeFee: ch.challengeFee,
      tiers: existingTiers,
      currency: ch.currency || 'INR',
      isActive: ch.isActive,
      rules: { ...getDefaultChallengeForm().rules, ...ch.rules },
      fundedSettings: { ...getDefaultChallengeForm().fundedSettings, ...ch.fundedSettings }
    });
    setChallengeModal({ open: true, mode: 'edit', editItem: ch });
  };

  // Account actions
  const doAccountAction = async (type, accountId) => {
    try {
      let url, body;
      if (type === 'force-pass') {
        url = `${API_URL}/api/prop/admin/force-pass/${accountId}`;
        body = {};
      } else if (type === 'force-fail') {
        url = `${API_URL}/api/prop/admin/force-fail/${accountId}`;
        body = { reason: actionForm.reason };
      } else if (type === 'extend-time') {
        url = `${API_URL}/api/prop/admin/extend-time/${accountId}`;
        body = { days: Number(actionForm.days) };
      } else if (type === 'reset') {
        url = `${API_URL}/api/prop/admin/reset/${accountId}`;
        body = {};
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setActionModal({ open: false, type: '', account: null });
        setActionForm({ days: 7, reason: '' });
        fetchAccounts();
        fetchStats();
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err) {
      console.error('Error performing action:', err);
    }
  };

  const statusColor = (s) => {
    switch (s) {
      case 'ACTIVE': return '#3b82f6';
      case 'PASSED': return '#10b981';
      case 'FAILED': return '#ef4444';
      case 'FUNDED': return '#f59e0b';
      case 'EXPIRED': return '#6b7280';
      default: return '#888';
    }
  };

  const stepsLabel = (n) => {
    if (n === 0) return 'Instant Fund';
    if (n === 1) return '1-Step';
    return '2-Step';
  };

  // Filtered accounts
  const filteredAccounts = accounts.filter(a => {
    if (accountFilter.search) {
      const q = accountFilter.search.toLowerCase();
      const userName = a.userId?.name?.toLowerCase() || '';
      const userEmail = a.userId?.email?.toLowerCase() || '';
      const accId = a.accountId?.toLowerCase() || '';
      if (!userName.includes(q) && !userEmail.includes(q) && !accId.includes(q)) return false;
    }
    return true;
  });

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', color: 'var(--text-secondary)' }}>Loading Prop Trading...</div>;
  }

  return (
    <div style={{ padding: '0' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
        {['dashboard', 'challenges', 'accounts', 'payouts', 'settings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === tab ? '#3b82f6' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? '600' : '400',
              fontSize: '14px',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ===== DASHBOARD TAB ===== */}
      {activeTab === 'dashboard' && (
        <div>
          {/* System Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '16px 20px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px' }}>Challenge Mode</h3>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                {settings.challengeModeEnabled ? 'Users can buy and participate in challenges' : 'Challenge mode is disabled'}
              </p>
            </div>
            <button
              onClick={toggleChallengeMode}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                background: settings.challengeModeEnabled ? '#ef4444' : '#10b981',
                color: '#fff'
              }}
            >
              {settings.challengeModeEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Total Challenges', value: stats.totalChallenges, color: '#3b82f6', icon: '📋' },
              { label: 'Total Accounts', value: stats.totalAccounts, color: '#8b5cf6', icon: '👥' },
              { label: 'Active', value: stats.activeAccounts, color: '#3b82f6', icon: '🔵' },
              { label: 'Passed', value: stats.passedAccounts, color: '#10b981', icon: '✅' },
              { label: 'Failed', value: stats.failedAccounts, color: '#ef4444', icon: '❌' },
              { label: 'Funded', value: stats.fundedAccounts, color: '#f59e0b', icon: '💰' }
            ].map((s, i) => (
              <div key={i} style={{
                padding: '20px',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{s.icon}</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Pass Rate */}
          {stats.totalAccounts > 0 && (
            <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--text-primary)', margin: '0 0 12px' }}>Pass Rate</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1, height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${((stats.passedAccounts + stats.fundedAccounts) / stats.totalAccounts * 100).toFixed(1)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10b981, #3b82f6)',
                    borderRadius: '4px'
                  }} />
                </div>
                <span style={{ color: '#10b981', fontWeight: '600', minWidth: '50px' }}>
                  {((stats.passedAccounts + stats.fundedAccounts) / stats.totalAccounts * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== CHALLENGES TAB ===== */}
      {activeTab === 'challenges' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Challenge Products</h3>
            <button
              onClick={() => {
                setChallengeForm(getDefaultChallengeForm());
                setChallengeModal({ open: true, mode: 'add', editItem: null });
              }}
              style={{ padding: '10px 20px', borderRadius: '8px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
            >
              + Add Challenge
            </button>
          </div>

          {challenges.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <p>No challenges created yet. Click "Add Challenge" to create your first one.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {challenges.map(ch => (
                <div key={ch._id} style={{
                  padding: '20px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: `1px solid ${ch.isActive ? 'var(--border-color)' : '#ef444440'}`,
                  opacity: ch.isActive ? 1 : 0.7
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px' }}>{ch.name}</h4>
                      <span style={{
                        display: 'inline-block',
                        marginTop: '6px',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: ch.stepsCount === 0 ? '#f59e0b20' : ch.stepsCount === 1 ? '#3b82f620' : '#8b5cf620',
                        color: ch.stepsCount === 0 ? '#f59e0b' : ch.stepsCount === 1 ? '#3b82f6' : '#8b5cf6'
                      }}>
                        {stepsLabel(ch.stepsCount)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => editChallenge(ch)} style={{ padding: '4px 10px', borderRadius: '6px', background: '#3b82f620', color: '#3b82f6', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
                      <button onClick={() => deleteChallenge(ch._id)} style={{ padding: '4px 10px', borderRadius: '6px', background: '#ef444420', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Fund Size</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>₹{ch.fundSize?.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Fee</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>₹{ch.challengeFee?.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', fontSize: '12px' }}>
                    <div style={{ padding: '6px 8px', background: 'var(--bg-primary)', borderRadius: '6px' }}>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Daily DD</div>
                      <div style={{ color: '#ef4444', fontWeight: '600' }}>{ch.rules?.maxDailyDrawdownPercent || 5}%</div>
                    </div>
                    <div style={{ padding: '6px 8px', background: 'var(--bg-primary)', borderRadius: '6px' }}>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Max DD</div>
                      <div style={{ color: '#ef4444', fontWeight: '600' }}>{ch.rules?.maxOverallDrawdownPercent || 10}%</div>
                    </div>
                    <div style={{ padding: '6px 8px', background: 'var(--bg-primary)', borderRadius: '6px' }}>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Profit Split</div>
                      <div style={{ color: '#10b981', fontWeight: '600' }}>{ch.fundedSettings?.profitSplitPercent || 80}%</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', marginTop: '8px' }}>
                    {ch.stepsCount > 0 && (
                      <div style={{ padding: '6px 8px', background: 'var(--bg-primary)', borderRadius: '6px' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Phase 1 Target</div>
                        <div style={{ color: '#3b82f6', fontWeight: '600' }}>{ch.rules?.profitTargetPhase1Percent || 8}%</div>
                      </div>
                    )}
                    {ch.stepsCount === 2 && (
                      <div style={{ padding: '6px 8px', background: 'var(--bg-primary)', borderRadius: '6px' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Phase 2 Target</div>
                        <div style={{ color: '#8b5cf6', fontWeight: '600' }}>{ch.rules?.profitTargetPhase2Percent || 5}%</div>
                      </div>
                    )}
                    {ch.stepsCount === 0 && ch.rules?.profitTargetInstantPercent && (
                      <div style={{ padding: '6px 8px', background: 'var(--bg-primary)', borderRadius: '6px' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Profit Target</div>
                        <div style={{ color: '#f59e0b', fontWeight: '600' }}>{ch.rules.profitTargetInstantPercent}%</div>
                      </div>
                    )}
                    {ch.rules?.maxOneDayProfitPercentOfTarget && (
                      <div style={{ padding: '6px 8px', background: 'var(--bg-primary)', borderRadius: '6px' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Max Day Profit</div>
                        <div style={{ color: '#f59e0b', fontWeight: '600' }}>{ch.rules.maxOneDayProfitPercentOfTarget}% of target</div>
                      </div>
                    )}
                    {ch.rules?.consistencyRulePercent && (
                      <div style={{ padding: '6px 8px', background: 'var(--bg-primary)', borderRadius: '6px' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Consistency</div>
                        <div style={{ color: '#8b5cf6', fontWeight: '600' }}>{ch.rules.consistencyRulePercent}%</div>
                      </div>
                    )}
                    {ch.rules?.tradingDaysRequired && (
                      <div style={{ padding: '6px 8px', background: 'var(--bg-primary)', borderRadius: '6px' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Min Trading Days</div>
                        <div style={{ color: '#3b82f6', fontWeight: '600' }}>{ch.rules.tradingDaysRequired} days</div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {ch.rules?.stopLossMandatory && <span>SL Required</span>}
                    <span>Leverage 1:{ch.rules?.maxLeverage || 100}</span>
                    <span>Expiry {ch.rules?.challengeExpiryDays || 30}d</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== ACCOUNTS TAB ===== */}
      {activeTab === 'accounts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Challenge Accounts ({accountsTotal})</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search by name, email, account ID..."
                value={accountFilter.search}
                onChange={e => setAccountFilter(p => ({ ...p, search: e.target.value }))}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', width: '250px' }}
              />
              <select
                value={accountFilter.status}
                onChange={e => setAccountFilter(p => ({ ...p, status: e.target.value }))}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px' }}
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="PASSED">Passed</option>
                <option value="FAILED">Failed</option>
                <option value="FUNDED">Funded</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <button
                onClick={fetchAccounts}
                title="Refresh now"
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >🔄 Refresh</button>
            </div>
          </div>

          {filteredAccounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
              <p>No challenge accounts found.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {['Account ID', 'User', 'Challenge', 'Phase', 'Balance', 'Equity', 'Daily DD', 'Overall DD', 'Profit', 'Status', 'Expires', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 8px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '500', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map(acc => (
                    <tr key={acc._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 8px', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '12px' }}>{acc.accountId}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{acc.userId?.name || 'N/A'}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{acc.userId?.email || ''}</div>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ color: 'var(--text-primary)' }}>{acc.challengeId?.name || 'N/A'}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>₹{acc.challengeId?.fundSize?.toLocaleString('en-IN')}</div>
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-primary)', textAlign: 'center' }}>
                        {acc.accountType === 'FUNDED' ? 'Funded' : `${acc.currentPhase}/${acc.totalPhases}`}
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-primary)', fontWeight: '500' }}>₹{acc.currentBalance?.toFixed(2)}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-primary)', fontWeight: '500' }}>₹{acc.currentEquity?.toFixed(2)}</td>
                      <td style={{ padding: '10px 8px', color: (acc.currentDailyDrawdownPercent || 0) > 3 ? '#ef4444' : '#10b981', fontWeight: '500' }}>
                        {(acc.currentDailyDrawdownPercent || 0).toFixed(2)}%
                      </td>
                      <td style={{ padding: '10px 8px', color: (acc.currentOverallDrawdownPercent || 0) > 7 ? '#ef4444' : '#10b981', fontWeight: '500' }}>
                        {(acc.currentOverallDrawdownPercent || 0).toFixed(2)}%
                      </td>
                      <td style={{ padding: '10px 8px', color: (acc.currentProfitPercent || 0) >= 0 ? '#10b981' : '#ef4444', fontWeight: '500' }}>
                        {(acc.currentProfitPercent || 0).toFixed(2)}%
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: `${statusColor(acc.status)}20`,
                          color: statusColor(acc.status)
                        }}>
                          {acc.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {acc.expiresAt ? new Date(acc.expiresAt).toLocaleDateString() : '-'}
                      </td>
                      <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {acc.status === 'ACTIVE' && (
                            <>
                              <button onClick={() => { if (confirm('Force PASS this account?')) doAccountAction('force-pass', acc._id); }} style={{ padding: '3px 8px', borderRadius: '4px', background: '#10b98120', color: '#10b981', border: 'none', cursor: 'pointer', fontSize: '11px' }}>Pass</button>
                              <button onClick={() => setActionModal({ open: true, type: 'force-fail', account: acc })} style={{ padding: '3px 8px', borderRadius: '4px', background: '#ef444420', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '11px' }}>Fail</button>
                              <button onClick={() => setActionModal({ open: true, type: 'extend-time', account: acc })} style={{ padding: '3px 8px', borderRadius: '4px', background: '#f59e0b20', color: '#f59e0b', border: 'none', cursor: 'pointer', fontSize: '11px' }}>Extend</button>
                            </>
                          )}
                          {(acc.status === 'FAILED' || acc.status === 'EXPIRED') && (
                            <button onClick={() => { if (confirm('Reset this challenge?')) doAccountAction('reset', acc._id); }} style={{ padding: '3px 8px', borderRadius: '4px', background: '#3b82f620', color: '#3b82f6', border: 'none', cursor: 'pointer', fontSize: '11px' }}>Reset</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== PAYOUTS TAB ===== */}
      {activeTab === 'payouts' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Prop Payout Requests</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {['pending', 'approved', 'rejected', 'all'].map(s => (
                <button
                  key={s}
                  onClick={() => setPayoutsFilter(s)}
                  style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: payoutsFilter === s ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                    background: payoutsFilter === s ? 'color-mix(in srgb, #3b82f6 15%, var(--bg-secondary))' : 'var(--bg-secondary)',
                    color: payoutsFilter === s ? '#3b82f6' : 'var(--text-secondary)',
                    cursor: 'pointer', textTransform: 'capitalize'
                  }}
                >{s}</button>
              ))}
            </div>
          </div>

          {payoutsLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading…</div>
          ) : payouts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No {payoutsFilter === 'all' ? '' : payoutsFilter} payout requests.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {payouts.map(p => {
                const kyc = p.user?.kycStatus || 'not_submitted';
                const kycColor = kyc === 'approved' ? '#10b981' : kyc === 'rejected' ? '#ef4444' : '#f59e0b';
                return (
                  <div key={p._id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>USER</div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.user?.name || 'Unknown'} <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>#{p.user?.oderId}</span></div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{p.user?.email}</div>
                        <div style={{ marginTop: 6, display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: `color-mix(in srgb, ${kycColor} 18%, transparent)`, color: kycColor, textTransform: 'uppercase' }}>
                          KYC: {kyc}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>CHALLENGE ACCOUNT</div>
                        <div style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: 600 }}>{p.challengeAccount?.accountId || '-'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Status: {p.challengeAccount?.status || '-'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Split: {p.splitPercent}% to user</div>
                        {p.challengeAccount?.lastWithdrawalDate && (
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Last payout: {new Date(p.challengeAccount.lastWithdrawalDate).toLocaleDateString('en-IN')}</div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>REQUESTED</div>
                        <div style={{ color: '#10b981', fontWeight: 700, fontSize: 20 }}>₹{Number(p.requestedAmount || 0).toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Profit: ₹{Number(p.profit || 0).toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Requested: {new Date(p.createdAt).toLocaleDateString('en-IN')}</div>
                      </div>
                      {p.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => openApproveModal(p)} style={{ padding: '8px 14px', borderRadius: 8, background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Approve</button>
                          <button onClick={() => openRejectModal(p)} style={{ padding: '8px 14px', borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Reject</button>
                        </div>
                      ) : (
                        <div style={{ padding: '6px 12px', borderRadius: 8, background: p.status === 'approved' ? 'color-mix(in srgb, #10b981 15%, transparent)' : 'color-mix(in srgb, #ef4444 15%, transparent)', color: p.status === 'approved' ? '#10b981' : '#ef4444', textTransform: 'uppercase', fontSize: 11, fontWeight: 700 }}>{p.status}</div>
                      )}
                    </div>
                    {p.status === 'rejected' && p.rejectionReason && (
                      <div style={{ marginTop: 10, padding: 10, background: 'color-mix(in srgb, #ef4444 8%, var(--bg-primary))', border: '1px solid color-mix(in srgb, #ef4444 25%, var(--border-color))', borderRadius: 8, color: '#ef4444', fontSize: 12 }}>
                        Rejected: {p.rejectionReason}
                      </div>
                    )}
                    {p.status === 'approved' && p.adminNote && (
                      <div style={{ marginTop: 10, padding: 10, background: 'color-mix(in srgb, #10b981 8%, var(--bg-primary))', border: '1px solid color-mix(in srgb, #10b981 25%, var(--border-color))', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}>
                        Admin note: {p.adminNote}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== SETTINGS TAB ===== */}
      {activeTab === 'settings' && (
        <div style={{ maxWidth: '700px' }}>
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 20px' }}>Prop Trading Settings</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>Display Name</label>
              <input
                value={settings.displayName || ''}
                onChange={e => setSettings(p => ({ ...p, displayName: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>Description</label>
              <textarea
                value={settings.description || ''}
                onChange={e => setSettings(p => ({ ...p, description: e.target.value }))}
                rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>Terms & Conditions</label>
              <textarea
                value={settings.termsAndConditions || ''}
                onChange={e => setSettings(p => ({ ...p, termsAndConditions: e.target.value }))}
                rows={6}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', resize: 'vertical' }}
              />
            </div>

            {/* Intraday auto-close toggle. ON → all open challenge positions
                are force-closed at 15:30 IST (NSE/BSE close) every weekday. */}
            {(() => {
              const on = !!settings.autoCloseAtMarketClose;
              return (
                <div style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: `1px solid ${on ? '#3b82f6' : 'var(--border-color)'}`,
                  background: on ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>
                      Auto-close at Market Close (Intraday only)
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.5 }}>
                      ON → at 3:30 PM IST every weekday, every open challenge position is auto-closed at the last traded price. No overnight / weekend holding for any prop account.<br />
                      OFF → users can hold challenge positions overnight (default).
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    onClick={() => setSettings(p => ({ ...p, autoCloseAtMarketClose: !on }))}
                    style={{
                      position: 'relative',
                      width: '56px',
                      height: '30px',
                      borderRadius: '15px',
                      border: 'none',
                      background: on ? '#3b82f6' : 'var(--bg-tertiary)',
                      cursor: 'pointer',
                      transition: 'background 0.18s ease',
                      flexShrink: 0
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '3px',
                      left: on ? '29px' : '3px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#fff',
                      transition: 'left 0.18s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                    }} />
                  </button>
                </div>
              );
            })()}

            <button
              onClick={saveSettings}
              style={{ alignSelf: 'flex-start', padding: '10px 30px', borderRadius: '8px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* ===== CHALLENGE MODAL ===== */}
      {challengeModal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '30px', width: '600px', maxHeight: '85vh', overflowY: 'auto', border: '1px solid var(--border-color)' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>
              {challengeModal.mode === 'edit' ? 'Edit Challenge' : 'Create New Challenge'}
            </h3>

            {/* Basic Info */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '12px' }}>Basic Info</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Challenge Name *</label>
                  <input value={challengeForm.name} onChange={e => setChallengeForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} placeholder="e.g. ₹5L Challenge" />
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Steps</label>
                  <select value={challengeForm.stepsCount} onChange={e => setChallengeForm(p => ({ ...p, stepsCount: Number(e.target.value) }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                    <option value={0}>Instant Fund (0-Step)</option>
                    <option value={1}>1-Step</option>
                    <option value={2}>2-Step</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', cursor: 'pointer', marginTop: '20px' }}>
                    <input type="checkbox" checked={challengeForm.isActive} onChange={e => setChallengeForm(p => ({ ...p, isActive: e.target.checked }))} /> Active
                  </label>
                </div>
              </div>
            </div>

            {/* Pricing Tiers — admin can offer multiple fund sizes at
                different fees so the user picks one at purchase time. */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', margin: 0 }}>Pricing Tiers</h4>
                <button
                  type="button"
                  onClick={() => setChallengeForm(p => ({
                    ...p,
                    tiers: [...(p.tiers || []), { fundSize: 0, challengeFee: 0, label: '', isPopular: false }]
                  }))}
                  style={{ padding: '6px 12px', borderRadius: '6px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                >
                  + Add Tier
                </button>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '0 0 10px' }}>
                Each tier is one (Fee → Fund Size) option the user sees. e.g. ₹100 → ₹1,000 fund.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(challengeForm.tiers || []).map((tier, i) => (
                  <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr auto auto',
                    gap: '8px', alignItems: 'center',
                    padding: '10px',
                    background: 'var(--bg-primary)',
                    border: tier.isPopular ? '1px solid #f59e0b' : '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <label style={{ color: 'var(--text-secondary)', fontSize: '10px', display: 'block', marginBottom: '2px' }}>Fund Size (₹)</label>
                      <input
                        type="number"
                        value={tier.fundSize ? tier.fundSize : ''}
                        placeholder="0"
                        onChange={e => {
                          const raw = e.target.value;
                          const num = raw === '' ? 0 : Number(raw);
                          setChallengeForm(p => {
                            const tiers = [...(p.tiers || [])];
                            tiers[i] = { ...tiers[i], fundSize: Number.isFinite(num) ? num : 0 };
                            return { ...p, tiers };
                          });
                        }}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ color: 'var(--text-secondary)', fontSize: '10px', display: 'block', marginBottom: '2px' }}>Fee (₹)</label>
                      <input
                        type="number"
                        value={tier.challengeFee ? tier.challengeFee : ''}
                        placeholder="0"
                        onChange={e => {
                          const raw = e.target.value;
                          const num = raw === '' ? 0 : Number(raw);
                          setChallengeForm(p => {
                            const tiers = [...(p.tiers || [])];
                            tiers[i] = { ...tiers[i], challengeFee: Number.isFinite(num) ? num : 0 };
                            return { ...p, tiers };
                          });
                        }}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ color: 'var(--text-secondary)', fontSize: '10px', display: 'block', marginBottom: '2px' }}>Label (optional)</label>
                      <input
                        type="text"
                        value={tier.label}
                        placeholder="e.g. Starter"
                        onChange={e => setChallengeForm(p => {
                          const tiers = [...(p.tiers || [])];
                          tiers[i] = { ...tiers[i], label: e.target.value };
                          return { ...p, tiers };
                        })}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13px' }}
                      />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: tier.isPopular ? '#f59e0b' : 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={!!tier.isPopular}
                        onChange={e => setChallengeForm(p => {
                          const tiers = [...(p.tiers || [])];
                          tiers[i] = { ...tiers[i], isPopular: e.target.checked };
                          return { ...p, tiers };
                        })}
                      />
                      Popular
                    </label>
                    <button
                      type="button"
                      title="Remove tier"
                      onClick={() => setChallengeForm(p => {
                        const tiers = (p.tiers || []).filter((_, j) => j !== i);
                        return { ...p, tiers: tiers.length ? tiers : [{ fundSize: 0, challengeFee: 0, label: '', isPopular: false }] };
                      })}
                      style={{ padding: '6px 10px', borderRadius: '6px', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Rules */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '12px' }}>Risk Rules</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Max Daily DD %</label>
                  <input type="number" step="0.1" value={challengeForm.rules.maxDailyDrawdownPercent} onChange={e => setChallengeForm(p => ({ ...p, rules: { ...p.rules, maxDailyDrawdownPercent: Number(e.target.value) } }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Max Overall DD %</label>
                  <input type="number" step="0.1" value={challengeForm.rules.maxOverallDrawdownPercent} onChange={e => setChallengeForm(p => ({ ...p, rules: { ...p.rules, maxOverallDrawdownPercent: Number(e.target.value) } }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Max Loss/Trade %</label>
                  <input type="number" step="0.1" value={challengeForm.rules.maxLossPerTradePercent} onChange={e => setChallengeForm(p => ({ ...p, rules: { ...p.rules, maxLossPerTradePercent: Number(e.target.value) } }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
              </div>
            </div>

            {/* Profit Targets */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '12px' }}>Profit Targets</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {challengeForm.stepsCount > 0 && (
                  <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Phase 1 Target %</label>
                    <input type="number" step="0.1" value={challengeForm.rules.profitTargetPhase1Percent || ''} onChange={e => setChallengeForm(p => ({ ...p, rules: { ...p.rules, profitTargetPhase1Percent: Number(e.target.value) } }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                )}
                {challengeForm.stepsCount === 2 && (
                  <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Phase 2 Target %</label>
                    <input type="number" step="0.1" value={challengeForm.rules.profitTargetPhase2Percent || ''} onChange={e => setChallengeForm(p => ({ ...p, rules: { ...p.rules, profitTargetPhase2Percent: Number(e.target.value) } }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                )}
                {challengeForm.stepsCount === 0 && (
                  <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Instant Profit Target %</label>
                    <input type="number" step="0.1" value={challengeForm.rules.profitTargetInstantPercent || ''} onChange={e => setChallengeForm(p => ({ ...p, rules: { ...p.rules, profitTargetInstantPercent: Number(e.target.value) } }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                )}
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Max One-Day Profit (% of target)</label>
                  <input type="number" step="1" value={challengeForm.rules.maxOneDayProfitPercentOfTarget || ''} onChange={e => setChallengeForm(p => ({ ...p, rules: { ...p.rules, maxOneDayProfitPercentOfTarget: e.target.value ? Number(e.target.value) : null } }))} placeholder="e.g. 40" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>40 = no single day profit can exceed 40% of total target</span>
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Consistency Rule %</label>
                  <input type="number" step="1" value={challengeForm.rules.consistencyRulePercent || ''} onChange={e => setChallengeForm(p => ({ ...p, rules: { ...p.rules, consistencyRulePercent: e.target.value ? Number(e.target.value) : null } }))} placeholder="e.g. 30" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>30 = no single day can be more than 30% of total profit</span>
                </div>
              </div>
            </div>

            {/* Trade Rules */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '12px' }}>Trade Rules</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Min Lot Size</label>
                  <input type="number" step="0.01" value={challengeForm.rules.minLotSize} onChange={e => setChallengeForm(p => ({ ...p, rules: { ...p.rules, minLotSize: Number(e.target.value) } }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Max Lot Size</label>
                  <input type="number" step="0.01" value={challengeForm.rules.maxLotSize} onChange={e => setChallengeForm(p => ({ ...p, rules: { ...p.rules, maxLotSize: Number(e.target.value) } }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Max Leverage</label>
                  <input type="number" value={challengeForm.rules.maxLeverage} onChange={e => setChallengeForm(p => ({ ...p, rules: { ...p.rules, maxLeverage: Number(e.target.value) } }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Max Trades/Day</label>
                  <input type="number" value={challengeForm.rules.maxTradesPerDay || ''} onChange={e => setChallengeForm(p => ({ ...p, rules: { ...p.rules, maxTradesPerDay: e.target.value ? Number(e.target.value) : null } }))} placeholder="Unlimited" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Max Concurrent</label>
                  <input type="number" value={challengeForm.rules.maxConcurrentTrades || ''} onChange={e => setChallengeForm(p => ({ ...p, rules: { ...p.rules, maxConcurrentTrades: e.target.value ? Number(e.target.value) : null } }))} placeholder="Unlimited" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Min Hold Time (sec)</label>
                  <input type="number" value={challengeForm.rules.minTradeHoldTimeSeconds} onChange={e => setChallengeForm(p => ({ ...p, rules: { ...p.rules, minTradeHoldTimeSeconds: Number(e.target.value) } }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px', marginTop: '12px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px' }}>
                  <input type="checkbox" checked={challengeForm.rules.stopLossMandatory} onChange={e => setChallengeForm(p => ({ ...p, rules: { ...p.rules, stopLossMandatory: e.target.checked } }))} /> SL Mandatory
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px' }}>
                  <input type="checkbox" checked={challengeForm.rules.allowWeekendHolding} onChange={e => setChallengeForm(p => ({ ...p, rules: { ...p.rules, allowWeekendHolding: e.target.checked } }))} /> Weekend Holding
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px' }}>
                  <input type="checkbox" checked={challengeForm.rules.allowNewsTrading} onChange={e => setChallengeForm(p => ({ ...p, rules: { ...p.rules, allowNewsTrading: e.target.checked } }))} /> News Trading
                </label>
              </div>

              {/* Fractional-Lot toggle — visually prominent so admins notice it.
                  ON state ("Whole Lots Only") blocks 1.5 / 2.5 / 3.5 etc.
                  Stored as `allowFractionalLots` (inverse) for backward compat. */}
              {(() => {
                const wholeOnly = challengeForm.rules.allowFractionalLots === false;
                return (
                  <div style={{
                    marginTop: '14px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${wholeOnly ? '#3b82f6' : 'var(--border-color)'}`,
                    background: wholeOnly ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>
                        Whole Lots Only
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                        ON → block fractional lot orders like 1.5 / 2.5 / 3.5 (only 1, 2, 3 … allowed).
                        OFF → allow fractional lots (forex-style 0.01, 0.5, 1.5).
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={wholeOnly}
                      onClick={() => setChallengeForm(p => ({
                        ...p,
                        rules: { ...p.rules, allowFractionalLots: !wholeOnly ? false : true }
                      }))}
                      style={{
                        position: 'relative',
                        width: '52px',
                        height: '28px',
                        borderRadius: '14px',
                        border: 'none',
                        background: wholeOnly ? '#3b82f6' : 'var(--bg-tertiary)',
                        cursor: 'pointer',
                        transition: 'background 0.18s ease',
                        flexShrink: 0
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: '3px',
                        left: wholeOnly ? '27px' : '3px',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#fff',
                        transition: 'left 0.18s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                      }} />
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Time & Expiry */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '12px' }}>Time & Expiry</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Challenge Expiry (days)</label>
                  <input type="number" value={challengeForm.rules.challengeExpiryDays} onChange={e => setChallengeForm(p => ({ ...p, rules: { ...p.rules, challengeExpiryDays: Number(e.target.value) } }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Trading Days Required</label>
                  <input type="number" value={challengeForm.rules.tradingDaysRequired || ''} onChange={e => setChallengeForm(p => ({ ...p, rules: { ...p.rules, tradingDaysRequired: e.target.value ? Number(e.target.value) : null } }))} placeholder="None" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
              </div>
            </div>

            {/* Funded Account Settings */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '12px' }}>Funded Account Settings</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Profit Split %</label>
                  <input type="number" value={challengeForm.fundedSettings.profitSplitPercent} onChange={e => setChallengeForm(p => ({ ...p, fundedSettings: { ...p.fundedSettings, profitSplitPercent: Number(e.target.value) } }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Withdrawal Frequency (days)</label>
                  <input type="number" value={challengeForm.fundedSettings.withdrawalFrequencyDays} onChange={e => setChallengeForm(p => ({ ...p, fundedSettings: { ...p.fundedSettings, withdrawalFrequencyDays: Number(e.target.value) } }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setChallengeModal({ open: false, mode: 'add', editItem: null })} style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveChallenge} style={{ padding: '10px 24px', borderRadius: '8px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                {challengeModal.mode === 'edit' ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ACTION MODAL (Force Fail / Extend Time) ===== */}
      {actionModal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '30px', width: '400px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>
              {actionModal.type === 'force-fail' ? 'Force Fail Account' : 'Extend Challenge Time'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
              Account: <strong style={{ color: 'var(--text-primary)' }}>{actionModal.account?.accountId}</strong>
            </p>

            {actionModal.type === 'force-fail' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Reason</label>
                <textarea
                  value={actionForm.reason}
                  onChange={e => setActionForm(p => ({ ...p, reason: e.target.value }))}
                  rows={3}
                  placeholder="Enter reason for failing this account..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </div>
            )}

            {actionModal.type === 'extend-time' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Days to Extend</label>
                <input
                  type="number"
                  value={actionForm.days}
                  onChange={e => setActionForm(p => ({ ...p, days: Number(e.target.value) }))}
                  min="1"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setActionModal({ open: false, type: '', account: null })} style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={() => doAccountAction(actionModal.type, actionModal.account?._id)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  background: actionModal.type === 'force-fail' ? '#ef4444' : '#f59e0b',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {actionModal.type === 'force-fail' ? 'Force Fail' : 'Extend Time'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PAYOUT APPROVAL / REJECTION MODAL ===== */}
      {payoutModal.open && payoutModal.payout && (
        <div
          onClick={() => closePayoutModal()}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 520, color: 'var(--text-primary)' }}>
            <h3 style={{ margin: '0 0 6px' }}>{payoutModal.mode === 'approve' ? 'Approve Payout' : 'Reject Payout'}</h3>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
              {payoutModal.payout.user?.name} — Challenge {payoutModal.payout.challengeAccount?.accountId}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ padding: 10, background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>PROFIT</div>
                <div style={{ fontWeight: 700 }}>₹{Number(payoutModal.payout.profit || 0).toLocaleString('en-IN')}</div>
              </div>
              <div style={{ padding: 10, background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>REQUESTED ({payoutModal.payout.splitPercent}%)</div>
                <div style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(payoutModal.payout.requestedAmount || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>

            {payoutModal.mode === 'approve' ? (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Custom Amount (₹)</label>
                  <input
                    type="number"
                    value={payoutForm.customAmount}
                    onChange={(e) => setPayoutForm(f => ({ ...f, customAmount: e.target.value }))}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>Override the default split if needed. Leave as requested for the standard payout.</div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={payoutForm.overrideCooldown}
                    onChange={(e) => setPayoutForm(f => ({ ...f, overrideCooldown: e.target.checked }))}
                  />
                  Bypass withdrawal cooldown (frequency check)
                </label>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Admin Note (optional)</label>
                  <textarea
                    value={payoutForm.adminNote}
                    onChange={(e) => setPayoutForm(f => ({ ...f, adminNote: e.target.value }))}
                    rows={2}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }}
                  />
                </div>

                {payoutModal.payout.user?.kycStatus !== 'approved' && (
                  <div style={{ padding: 10, background: 'color-mix(in srgb, #f59e0b 10%, var(--bg-primary))', border: '1px solid color-mix(in srgb, #f59e0b 30%, var(--border-color))', borderRadius: 8, color: '#f59e0b', fontSize: 12, marginBottom: 12 }}>
                    ⚠ User KYC status is <strong>{payoutModal.payout.user?.kycStatus || 'not_submitted'}</strong>. Consider verifying KYC before releasing real funds.
                  </div>
                )}
              </>
            ) : (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Rejection Reason *</label>
                <textarea
                  value={payoutForm.reason}
                  onChange={(e) => setPayoutForm(f => ({ ...f, reason: e.target.value }))}
                  rows={3}
                  placeholder="Explain to the user why the payout is rejected…"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={closePayoutModal} style={{ flex: 1, padding: 12, borderRadius: 8, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>Cancel</button>
              {payoutModal.mode === 'approve' ? (
                <button onClick={submitApprovePayout} style={{ flex: 1, padding: 12, borderRadius: 8, background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Confirm Approve</button>
              ) : (
                <button onClick={submitRejectPayout} style={{ flex: 1, padding: 12, borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Confirm Reject</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropTrading;
