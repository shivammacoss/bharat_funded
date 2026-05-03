import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { compressImage, base64ByteSize } from '../../../utils/compressImage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getAuthHeaders() {
  const authData = JSON.parse(localStorage.getItem('bharatfunded-auth') || '{}');
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authData.token || ''}` };
}

const PROGRAMS = [
  { steps: 2, label: '2-Step', sub: 'Standard evaluation', icon: '\u2730', color: '#1a1a2e',
    phases: ['Qualifier', 'Validator', 'Rewards'],
    desc: 'Two-phase evaluation process. Pass Phase 1 and Phase 2 to receive your funded account with profit split.' },
  { steps: 1, label: '1-Step', sub: 'Single stage evaluation', icon: '\u26A1', color: '#3b82f6',
    phases: ['Qualifier', 'Rewards'],
    desc: 'Single-phase evaluation. Reach the profit target while respecting drawdown rules to get funded.' },
  { steps: 0, label: 'Instant', sub: 'Skip evaluation and get direct funded account', icon: '\u23F0', color: '#f59e0b',
    phases: ['Rewards'], isNew: true,
    desc: 'No evaluation phase. Trade a simulated funded account from day one with EOD trailing drawdown rules, starting with profit split. Complete KYC and e-sign contractor agreement from profile section before requesting payouts.' },
];

function PropChallengePage() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  // First-paint skeleton only — we never flip back to true during
  // re-fetches. buyChallenge just patches state directly.
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [propStatus, setPropStatus] = useState({ enabled: false });
  const [myAccounts, setMyAccounts] = useState([]);
  const [activeProgram, setActiveProgram] = useState(2);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmStage, setConfirmStage] = useState(1); // 1 = rules summary, 2 = UPI payment
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // IB coupon state — shared by the summary panel and the confirm modal.
  const [couponInput, setCouponInput] = useState('');
  const [couponState, setCouponState] = useState({ status: 'idle', applied: null, error: null });

  // Admin payment methods (UPI list) for the buy-request UPI dialog.
  const [adminUpiList, setAdminUpiList] = useState([]);
  const [selectedAdminUpiId, setSelectedAdminUpiId] = useState('');
  const [paymentForm, setPaymentForm] = useState({ transactionRef: '', screenshotBase64: '', note: '' });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  // Lightbox for QR enlargement.
  const [qrPreview, setQrPreview] = useState(null);

  // Fetch admin's active UPI list when the payment stage opens.
  useEffect(() => {
    if (!confirmOpen || confirmStage !== 2) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin-payment-details`);
        const data = await res.json();
        if (!cancelled && data.success) {
          const list = data.upiIds || [];
          setAdminUpiList(list);
          if (list.length > 0 && !selectedAdminUpiId) setSelectedAdminUpiId(list[0]._id);
        }
      } catch (e) { /* ignore */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmOpen, confirmStage]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Fire all three fetches in parallel, flip loading off as soon as the
  // first one returns so the UI paints progressively. No blocking
  // full-page "Loading…" screen.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const kickedFetches = [
        fetch(`${API_URL}/api/prop/status`).then(r => r.json())
          .then(s => { if (!cancelled && s.success) setPropStatus(s); })
          .catch(() => {}),
        fetch(`${API_URL}/api/prop/challenges`).then(r => r.json())
          .then(c => { if (!cancelled && c.success) setChallenges(c.challenges); })
          .catch(() => {}),
        fetch(`${API_URL}/api/prop/my-accounts`, { headers: getAuthHeaders() }).then(r => r.json())
          .then(a => { if (!cancelled && a.success) setMyAccounts(a.accounts); })
          .catch(() => {})
      ];
      // Flip loading off as soon as challenges land (the main content);
      // the other two panels just fill in when they arrive.
      await Promise.race(kickedFetches);
      if (!cancelled) setLoading(false);
      await Promise.all(kickedFetches);
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const refetchMyAccounts = () => {
    fetch(`${API_URL}/api/prop/my-accounts`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(a => { if (a.success) setMyAccounts(a.accounts); })
      .catch(() => {});
  };

  // Convert a screenshot file to a base64 data URL with client-side
  // compression. Mobile cameras produce 4-15 MB photos which break the
  // upload — compress to ~1600px / 80% JPEG so the payload stays
  // comfortably under the API limit (typical output: 200-500 KB).
  const handleScreenshotChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setPaymentError('Screenshot too large (max 25 MB)');
      return;
    }
    try {
      const compressed = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 });
      const sizeKb = Math.round(base64ByteSize(compressed) / 1024);
      console.log(`[ProofUpload] original=${(file.size / 1024).toFixed(0)} KB → compressed=${sizeKb} KB`);
      setPaymentForm(p => ({ ...p, screenshotBase64: compressed }));
      setPaymentError(null);
    } catch (err) {
      setPaymentError('Could not process image — try a different file');
    }
  };

  const submitBuyRequest = async (id, tierIndex) => {
    setPaymentError(null);
    if (!selectedAdminUpiId) { setPaymentError('Pick a UPI option to pay'); return; }
    const upi = adminUpiList.find(u => u._id === selectedAdminUpiId);
    if (!upi) { setPaymentError('Selected UPI not found'); return; }
    if (!paymentForm.transactionRef.trim()) { setPaymentError('Transaction reference number required'); return; }
    if (!paymentForm.screenshotBase64) { setPaymentError('Payment screenshot required'); return; }

    setPaymentSubmitting(true);
    setBuying(id);
    try {
      const res = await fetch(`${API_URL}/api/prop/buy-request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          challengeId: id,
          tierIndex: Number(tierIndex) || 0,
          couponCode: couponState.applied?.code || null,
          adminUpiId: upi.upiId,
          transactionRef: paymentForm.transactionRef.trim(),
          screenshotBase64: paymentForm.screenshotBase64,
          note: paymentForm.note.trim()
        })
      });
      const d = await res.json();
      if (d.success) {
        setSelectedId(null);
        setAgreeTerms(false);
        setCouponInput('');
        setCouponState({ status: 'idle', applied: null, error: null });
        setPaymentForm({ transactionRef: '', screenshotBase64: '', note: '' });
        setSelectedAdminUpiId('');
        setConfirmStage(1);
        setConfirmOpen(false);
        showToast(`${d.message} Check My Challenges.`, 'success');
        refetchMyAccounts();
        setTimeout(() => navigate('/app/my-challenges'), 600);
      } else {
        setPaymentError(d.message || 'Submission failed');
      }
    } catch (e) {
      setPaymentError('Network error: ' + e.message);
    }
    setPaymentSubmitting(false);
    setBuying(null);
  };

  const validateCoupon = async () => {
    const code = String(couponInput || '').trim().toUpperCase();
    if (!code) return;
    if (!selectedTier?.challengeFee) return;
    setCouponState({ status: 'checking', applied: null, error: null });
    try {
      const res = await fetch(
        `${API_URL}/api/ib/coupon/validate/${encodeURIComponent(code)}?challengeFee=${Number(selectedTier.challengeFee)}`,
        { headers: getAuthHeaders() }
      );
      const d = await res.json();
      if (d.success && d.data?.valid) {
        setCouponState({ status: 'applied', applied: d.data, error: null });
      } else {
        setCouponState({ status: 'error', applied: null, error: d.error || 'Invalid coupon' });
      }
    } catch (e) {
      setCouponState({ status: 'error', applied: null, error: 'Network error' });
    }
  };

  const clearCoupon = () => {
    setCouponInput('');
    setCouponState({ status: 'idle', applied: null, error: null });
  };

  // If user changes plan/tier after applying a coupon, re-validate against
  // the new fee (or just clear so the discount math doesn't go stale).
  useEffect(() => {
    if (couponState.applied) {
      setCouponState({ status: 'idle', applied: null, error: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selectedTierIndex]);

  const grouped = useMemo(() => {
    const m = {};
    challenges.forEach(c => { const k = c.stepsCount ?? 2; if (!m[k]) m[k] = []; m[k].push(c); });
    return m;
  }, [challenges]);

  const availablePrograms = PROGRAMS.filter(p => grouped[p.steps]?.length > 0);

  useEffect(() => {
    if (availablePrograms.length > 0 && !availablePrograms.find(p => p.steps === activeProgram))
      setActiveProgram(availablePrograms[0].steps);
  }, [availablePrograms]);

  const currentPlans = grouped[activeProgram] || [];
  const selectedPlan = currentPlans.find(c => c._id === selectedId);
  const pm = PROGRAMS.find(p => p.steps === activeProgram) || PROGRAMS[0];

  useEffect(() => {
    if (currentPlans.length > 0 && !currentPlans.find(c => c._id === selectedId)) setSelectedId(currentPlans[0]._id);
    setSelectedTierIndex(0);
    setAgreeTerms(false);
  }, [activeProgram, currentPlans.length]);

  // Normalize tiers for the currently-selected plan — fall back to the
  // legacy (fundSize, challengeFee) pair when the admin hasn't populated
  // the new tiers array.
  const planTiers = useMemo(() => {
    if (!selectedPlan) return [];
    if (Array.isArray(selectedPlan.tiers) && selectedPlan.tiers.length > 0) return selectedPlan.tiers;
    return [{
      fundSize: Number(selectedPlan.fundSize) || 0,
      challengeFee: Number(selectedPlan.challengeFee) || 0,
      label: '',
      isPopular: false
    }];
  }, [selectedPlan]);

  useEffect(() => {
    if (selectedTierIndex >= planTiers.length) setSelectedTierIndex(0);
  }, [planTiers.length, selectedTierIndex]);

  const selectedTier = planTiers[selectedTierIndex] || planTiers[0] || { fundSize: 0, challengeFee: 0 };

  if (loading) {
    // Shimmer-style skeleton that mirrors the real page layout so the user
    // never stares at bare "Loading…" text. Animations degrade gracefully.
    const shimmer = {
      background: 'linear-gradient(90deg, var(--bg-secondary) 0%, var(--bg-tertiary, var(--bg-primary)) 50%, var(--bg-secondary) 100%)',
      backgroundSize: '200% 100%',
      animation: 'bft-shimmer 1.2s ease-in-out infinite',
      borderRadius: '10px'
    };
    return (
      <div style={{ padding: '20px', maxWidth: 1200, margin: '0 auto' }}>
        <style>{`@keyframes bft-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {[1,2,3].map(i => <div key={i} style={{ ...shimmer, height: 64, flex: 1 }} />)}
        </div>
        <div style={{ ...shimmer, height: 88, marginBottom: 20 }} />
        <div style={{ height: 18, width: 180, ...shimmer, marginBottom: 14 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ ...shimmer, height: 140 }} />)}
        </div>
      </div>
    );
  }
  if (!propStatus.enabled) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-secondary)' }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: '40px', marginBottom: '12px' }}>🏆</div><h2 style={{ color: 'var(--text-primary)' }}>Prop Trading</h2><p>Challenges not available right now.</p></div></div>;

  const sty = {
    card: { background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px' },
    statBox: { padding: '10px 16px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '120px' },
  };

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={{ padding: '24px 28px 60px' }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Home / <span style={{ color: 'var(--text-primary)' }}>Start Evaluation</span>
        </div>

        {/* ===== MAIN 2-COL LAYOUT ===== */}
        <div className="prop-eval-layout" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

          {/* ===== LEFT COLUMN ===== */}
          <div style={{ flex: 1, minWidth: 0 }}>

            <h1 style={{ color: 'var(--text-primary)', fontSize: '22px', fontWeight: '700', margin: '0 0 16px' }}>About the Evaluation</h1>

            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>TRADING PROGRAMS</div>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px', fontSize: '13px' }}>
              Choose a path to your funded account. Complete objectives and unlock your rewards split.
            </p>

            {/* ===== PROGRAM TABS ===== */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {availablePrograms.map(p => {
                const active = activeProgram === p.steps;
                return (
                  <div key={p.steps} onClick={() => setActiveProgram(p.steps)} style={{
                    flex: '1 1 0', minWidth: '150px', cursor: 'pointer', borderRadius: '14px', padding: '16px 14px',
                    background: 'var(--bg-secondary)',
                    border: active ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                    transition: 'all 0.2s', position: 'relative'
                  }}>
                    {/* Radio dot */}
                    <div style={{
                      position: 'absolute', top: '14px', right: '14px', width: '16px', height: '16px',
                      borderRadius: '50%', border: `2px solid ${active ? '#3b82f6' : 'var(--border-color)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {active && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: active ? 'rgba(59,130,246,0.1)' : 'var(--bg-tertiary, var(--bg-primary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                      }}>{p.icon}</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>{p.label}</span>
                          {p.isNew && <span style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '8px', fontWeight: '800', background: '#10b981', color: '#fff' }}>NEW</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.sub}</div>
                      </div>
                    </div>

                    {/* Phase tags */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {p.phases.map((ph, idx) => (
                        <span key={idx} style={{
                          padding: '3px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '600',
                          background: active ? 'rgba(59,130,246,0.1)' : 'var(--bg-tertiary, var(--bg-primary))',
                          color: active ? '#3b82f6' : 'var(--text-secondary)'
                        }}>{ph}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ===== EXPANDED PROGRAM DETAILS ===== */}
            {selectedPlan && (
              <div style={{ ...sty.card, padding: '20px', marginBottom: '28px' }}>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 260px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>{pm.desc}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flex: '0 0 auto' }}>
                    <div style={sty.statBox}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Max loss</span>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>{selectedPlan.rules?.maxOverallDrawdownPercent || 10}%</span>
                    </div>
                    <div style={sty.statBox}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Daily loss</span>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>{selectedPlan.rules?.maxDailyDrawdownPercent || 5}%</span>
                    </div>
                    <div style={sty.statBox}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Drawdown</span>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>EOD</span>
                    </div>
                    <div style={sty.statBox}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Split</span>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>{selectedPlan.fundedSettings?.profitSplitPercent || 80}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== EVALUATION PLANS GRID =====
                 Each Challenge can expose several (fundSize, fee) tiers —
                 we flatten them so one card = one tier. Clicking a card
                 picks both the plan _id and the tier index, which then
                 drive the Summary panel and buy flow. */}
            <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: '700', margin: '0 0 16px' }}>Evaluation Plans</h2>
            {(() => {
              const flat = [];
              currentPlans.forEach(ch => {
                const tiers = Array.isArray(ch.tiers) && ch.tiers.length > 0
                  ? ch.tiers
                  : [{ fundSize: Number(ch.fundSize) || 0, challengeFee: Number(ch.challengeFee) || 0, label: '', isPopular: false }];
                tiers.forEach((t, tIdx) => flat.push({ ch, tier: t, tierIndex: tIdx }));
              });
              return (
                <div className="prop-plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                  {flat.map(({ ch, tier, tierIndex }) => {
                    const isSel = selectedId === ch._id && selectedTierIndex === tierIndex;
                    return (
                      <div
                        key={`${ch._id}-${tierIndex}`}
                        onClick={() => { setSelectedId(ch._id); setSelectedTierIndex(tierIndex); setAgreeTerms(false); }}
                        style={{
                          cursor: 'pointer', borderRadius: '14px', padding: '20px 18px', position: 'relative',
                          background: isSel ? (pm.steps === 0 ? '#fef3c7' : 'var(--bg-secondary)') : 'var(--bg-secondary)',
                          border: isSel ? '2px solid var(--text-primary)' : '1px solid var(--border-color)',
                          transition: 'all 0.15s'
                        }}
                      >
                        {tier.isPopular && (
                          <div style={{
                            position: 'absolute', top: '-10px', left: '14px',
                            background: '#f59e0b', color: '#000', fontSize: '9px', fontWeight: '800',
                            padding: '2px 10px', borderRadius: '4px', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px'
                          }}>⭐ POPULAR</div>
                        )}
                        {isSel && (
                          <div style={{
                            position: 'absolute', top: '14px', right: '14px', width: '22px', height: '22px',
                            borderRadius: '50%', background: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <span style={{ color: 'var(--bg-primary)', fontWeight: '800', fontSize: '13px' }}>✓</span>
                          </div>
                        )}
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {ch.name}{tier.label ? ` · ${tier.label}` : ''}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Balance</div>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px' }}>
                          ₹ {Number(tier.fundSize || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 14px', borderRadius: '10px',
                          background: 'var(--bg-tertiary, var(--bg-primary))', border: '1px solid var(--border-color)'
                        }}>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)' }}>Evaluation Fee</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>One time payment</div>
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                            ₹ {Number(tier.challengeFee || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Static info cards below the plans — Platform + Risk Rules.
                Hardcoded per product spec so the user always sees these two
                reassurance blurbs under whichever program tab they're on. */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 18px', borderRadius: '14px',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)'
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'var(--bg-tertiary, var(--bg-primary))',
                  color: 'var(--text-secondary)', fontSize: '16px'
                }}>🖥️</span>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Platform</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 700 }}>TradingView Web Terminal</div>
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 18px', borderRadius: '14px',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)'
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'var(--bg-tertiary, var(--bg-primary))',
                  color: 'var(--text-secondary)', fontSize: '16px'
                }}>🛡️</span>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Risk Rules</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 700 }}>Clear daily loss &amp; max loss rules.</div>
                </div>
              </div>
            </div>

            {/* My Challenges Banner */}
            {myAccounts.length > 0 && (
              <div onClick={() => navigate('/app/my-challenges')} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                padding: '14px 20px', borderRadius: '14px', marginTop: '24px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))',
                border: '1px solid rgba(99,102,241,0.12)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>📊</span>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>My Challenges</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{myAccounts.length} active account(s)</div>
                  </div>
                </div>
                <span style={{ color: '#818cf8', fontSize: '18px' }}>→</span>
              </div>
            )}
          </div>

          {/* ===== RIGHT: SUMMARY PANEL ===== */}
          {selectedPlan && (
            <div className="prop-summary-panel" style={{
              width: '300px', flexShrink: 0, position: 'sticky', top: '20px',
              ...sty.card, overflow: 'hidden'
            }}>
              <div style={{ padding: '20px' }}>
                <h3 style={{ color: 'var(--text-primary)', margin: '0 0 14px', fontSize: '16px', fontWeight: '700' }}>Summary</h3>

                {/* Total Payable */}
                <div style={{
                  padding: '14px', borderRadius: '10px', textAlign: 'center', marginBottom: '14px',
                  background: pm.steps === 0 ? '#fef3c7' : 'rgba(59,130,246,0.06)',
                  border: pm.steps === 0 ? '1px solid #fde68a' : '1px solid rgba(59,130,246,0.12)'
                }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', color: pm.steps === 0 ? '#92400e' : '#3b82f6', letterSpacing: '1px', marginBottom: '4px' }}>TOTAL PAYABLE</div>
                  {couponState.applied ? (
                    <>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>
                        ₹ {Number(couponState.applied.originalFee || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '26px', fontWeight: '800', color: '#10b981' }}>
                        ₹ {Number(couponState.applied.finalFee || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '11px', color: '#10b981', marginTop: 2 }}>
                        You save ₹ {Number(couponState.applied.discountAmount || 0).toLocaleString('en-IN')} ({couponState.applied.discountPercent}% off)
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)' }}>
                      ₹ {Number(selectedTier.challengeFee || 0).toLocaleString('en-IN')}
                    </div>
                  )}
                </div>

                {/* Coupon input */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '4px' }}>HAVE A COUPON?</div>
                  {couponState.applied ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderRadius: '8px',
                      background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)'
                    }}>
                      <div style={{ fontSize: 12 }}>
                        <strong style={{ color: '#10b981' }}>{couponState.applied.code}</strong>
                        {couponState.applied.ibName && <span style={{ color: 'var(--text-secondary)' }}> · {couponState.applied.ibName}</span>}
                      </div>
                      <button
                        onClick={clearCoupon}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                      >Remove</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="e.g. PRAVIN24"
                        style={{
                          flex: 1, padding: '8px 10px', borderRadius: 8,
                          border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
                          color: 'var(--text-primary)', fontSize: 13, textTransform: 'uppercase'
                        }}
                      />
                      <button
                        onClick={validateCoupon}
                        disabled={!couponInput.trim() || couponState.status === 'checking'}
                        style={{
                          padding: '8px 14px', borderRadius: 8, border: 'none',
                          background: couponInput.trim() ? '#3b82f6' : 'var(--border-color)',
                          color: '#fff', fontWeight: 700, fontSize: 12,
                          cursor: couponInput.trim() ? 'pointer' : 'not-allowed'
                        }}
                      >{couponState.status === 'checking' ? '…' : 'Apply'}</button>
                    </div>
                  )}
                  {couponState.error && (
                    <div style={{ marginTop: 6, fontSize: 11, color: '#ef4444' }}>❌ {couponState.error}</div>
                  )}
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '14px' }}>
                  {['✅ Secure', '⚡ Fast', '📌 Fixed Fee'].map((b, i) => (
                    <span key={i} style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500' }}>{b}</span>
                  ))}
                </div>

                {/* Details */}
                <div style={{ marginBottom: '14px' }}>
                  {[
                    { l: 'Selected Account', v: `₹ ${Number(selectedTier.fundSize || 0).toLocaleString('en-IN')}` },
                    { l: 'Account Type', v: pm.label },
                    { l: 'Evaluation Fee', v: `₹ ${Number(selectedTier.challengeFee || 0).toLocaleString('en-IN')}` },
                    { l: 'Currency', v: 'INR' },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{r.l}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: '600' }}>{r.v}</span>
                    </div>
                  ))}
                </div>

                {/* Payment Options */}
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '4px' }}>PAYMENT OPTIONS</div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: '16px' }}>UPI • Card • Netbanking</div>

                {/* Terms */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', marginBottom: '16px', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} style={{ marginTop: '3px', accentColor: pm.color }} />
                  <span><strong style={{ color: 'var(--text-primary)' }}>I agree to the payment & service terms.</strong> This is a digital evaluation service. Fees are non-refundable except for verified payment errors. Refund benefits may apply on success as per Refund Policy.</span>
                </label>

                {/* Pay Button — opens UPI payment modal directly */}
                <button
                  onClick={() => { setConfirmStage(2); setConfirmOpen(true); }}
                  disabled={!agreeTerms || buying}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
                    cursor: agreeTerms && !buying ? 'pointer' : 'not-allowed',
                    fontWeight: '700', fontSize: '14px', color: '#fff',
                    background: agreeTerms ? (pm.steps === 0 ? '#f59e0b' : '#1a1a2e') : 'var(--border-color)',
                    opacity: agreeTerms ? 1 : 0.5, transition: 'all 0.2s'
                  }}
                >
                  {buying
                    ? 'Processing...'
                    : `Pay ₹ ${Number((couponState.applied?.finalFee != null ? couponState.applied.finalFee : selectedTier.challengeFee) || 0).toLocaleString('en-IN')}`}
                </button>

                <div style={{ textAlign: 'center', fontSize: '9px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Payments are processed securely
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pre-purchase confirmation modal */}
      {confirmOpen && selectedPlan && (
        <div
          onClick={() => !buying && setConfirmOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary)', color: 'var(--text-primary)',
              border: '1px solid var(--border-color)', borderRadius: 16,
              width: '100%', maxWidth: 520, maxHeight: '88vh', overflowY: 'auto',
              padding: '24px 24px 20px'
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
              {confirmStage === 1 ? 'Confirm Purchase' : `Pay ₹${Number((couponState.applied?.finalFee != null ? couponState.applied.finalFee : selectedTier.challengeFee) || 0).toLocaleString('en-IN')} via UPI`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
              {confirmStage === 1
                ? 'Please review the rules before continuing to payment.'
                : 'Pay using any UPI app to the admin\'s UPI ID below, then enter your transaction reference + screenshot.'}
            </div>

            {confirmStage === 1 && (<>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>FUND SIZE</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>₹ {Number(selectedTier.fundSize || 0).toLocaleString('en-IN')}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>EVALUATION FEE</div>
                {couponState.applied ? (
                  <>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'line-through' }}>
                      ₹ {Number(couponState.applied.originalFee || 0).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>
                      ₹ {Number(couponState.applied.finalFee || 0).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: 10, color: '#10b981' }}>
                      Coupon {couponState.applied.code} · −{couponState.applied.discountPercent}%
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>₹ {Number(selectedTier.challengeFee || 0).toLocaleString('en-IN')}</div>
                )}
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, marginBottom: 8 }}>RULES YOU MUST FOLLOW</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.8 }}>
              {selectedPlan.rules?.maxDailyDrawdownPercent != null && (
                <li>Daily drawdown limit: <strong>{selectedPlan.rules.maxDailyDrawdownPercent}%</strong></li>
              )}
              {selectedPlan.rules?.maxOverallDrawdownPercent != null && (
                <li>Overall drawdown limit: <strong>{selectedPlan.rules.maxOverallDrawdownPercent}%</strong></li>
              )}
              {selectedPlan.rules?.profitTargetPhase1Percent != null && selectedPlan.stepsCount >= 1 && (
                <li>Phase 1 profit target: <strong>{selectedPlan.rules.profitTargetPhase1Percent}%</strong></li>
              )}
              {selectedPlan.rules?.profitTargetPhase2Percent != null && selectedPlan.stepsCount === 2 && (
                <li>Phase 2 profit target: <strong>{selectedPlan.rules.profitTargetPhase2Percent}%</strong></li>
              )}
              {selectedPlan.rules?.profitTargetInstantPercent != null && selectedPlan.stepsCount === 0 && (
                <li>Profit target: <strong>{selectedPlan.rules.profitTargetInstantPercent}%</strong></li>
              )}
              {selectedPlan.rules?.maxOneDayProfitPercentOfTarget != null && (
                <li>Max one-day profit: <strong>{selectedPlan.rules.maxOneDayProfitPercentOfTarget}%</strong> of target</li>
              )}
              {selectedPlan.rules?.consistencyRulePercent != null && (
                <li>Consistency rule: no single day can exceed <strong>{selectedPlan.rules.consistencyRulePercent}%</strong> of total profit</li>
              )}
              {selectedPlan.rules?.maxLeverage != null && (
                <li>Max leverage: <strong>1:{selectedPlan.rules.maxLeverage}</strong></li>
              )}
              {selectedPlan.rules?.stopLossMandatory && <li>Stop-loss is <strong>mandatory</strong> on every trade.</li>}
              {selectedPlan.rules?.takeProfitMandatory && <li>Take-profit is <strong>mandatory</strong> on every trade.</li>}
              {selectedPlan.rules?.tradingDaysRequired ? (
                <li>Minimum trading days: <strong>{selectedPlan.rules.tradingDaysRequired}</strong></li>
              ) : null}
              {selectedPlan.rules?.challengeExpiryDays ? (
                <li>Challenge must be completed within <strong>{selectedPlan.rules.challengeExpiryDays} days</strong></li>
              ) : null}
              <li>Profit split on funded account: <strong>{selectedPlan.fundedSettings?.profitSplitPercent || 80}%</strong> to you.</li>
              <li>Spreads, commission and swap apply during the evaluation as per platform settings.</li>
            </ul>

            <div style={{
              marginTop: 16, padding: 12, background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10,
              fontSize: 12, color: '#ef4444'
            }}>
              ⚠ The evaluation fee is <strong>non-refundable</strong>. Breaching any rule above will fail the account — the fee will not be returned.
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                onClick={() => setConfirmOpen(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)', cursor: 'pointer',
                  fontWeight: 600
                }}
              >Cancel</button>
              <button
                onClick={() => setConfirmStage(2)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  background: '#3b82f6', color: '#fff', border: 'none',
                  cursor: 'pointer', fontWeight: 700
                }}
              >Continue to Payment →</button>
            </div>
            </>)}

            {confirmStage === 2 && (<>
              {/* UPI list */}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, marginBottom: 6 }}>SELECT ADMIN UPI</div>
              {adminUpiList.length === 0 ? (
                <div style={{ padding: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 12, color: '#ef4444', marginBottom: 14 }}>
                  ⚠ Admin has not set up any UPI yet. Please contact support.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {adminUpiList.map(upi => {
                    const sel = selectedAdminUpiId === upi._id;
                    // Build a UPI deep-link with the payee + amount pre-filled.
                    // Any UPI app scanning this QR will open with the
                    // recipient + amount already populated. Falls back to
                    // admin's uploaded QR image if present (preferred).
                    const amount = Number((couponState.applied?.finalFee != null ? couponState.applied.finalFee : selectedTier.challengeFee) || 0);
                    const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upi.upiId)}&pn=${encodeURIComponent(upi.name || 'Bharat Funded Trader')}&am=${amount}&cu=INR`;
                    const qrSrc = upi.qrImage
                      || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiDeepLink)}`;
                    return (
                      <div
                        key={upi._id}
                        onClick={() => setSelectedAdminUpiId(upi._id)}
                        style={{
                          padding: 12, borderRadius: 10, cursor: 'pointer',
                          border: sel ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                          background: sel ? 'rgba(59,130,246,0.06)' : 'var(--bg-primary)',
                          display: 'flex', alignItems: 'center', gap: 12
                        }}
                      >
                        <img
                          src={qrSrc}
                          alt="QR"
                          onClick={(e) => { e.stopPropagation(); setQrPreview(qrSrc); }}
                          style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--border-color)', cursor: 'zoom-in', background: '#fff' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{upi.name}</div>
                          <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{upi.upiId}</div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(upi.upiId); showToast('UPI ID copied', 'success'); }}
                              style={{ padding: '3px 10px', fontSize: 10, borderRadius: 4, border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}
                            >📋 Copy ID</button>
                          </div>
                          {!upi.qrImage && (
                            <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 2 }}>QR auto-generated · ₹{amount} included</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Payment proof form */}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, marginBottom: 6 }}>YOUR PAYMENT DETAILS</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>Transaction Reference / UTR *</label>
                <input
                  type="text"
                  value={paymentForm.transactionRef}
                  onChange={(e) => setPaymentForm(p => ({ ...p, transactionRef: e.target.value }))}
                  placeholder="From your UPI app"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>Payment Screenshot *</label>
                <input type="file" accept="image/*" onChange={handleScreenshotChange} style={{ fontSize: 12 }} />
                {paymentForm.screenshotBase64 && (
                  <img src={paymentForm.screenshotBase64} alt="preview" style={{ marginTop: 8, maxHeight: 120, borderRadius: 6, border: '1px solid var(--border-color)' }} />
                )}
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>Note (optional)</label>
                <textarea
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm(p => ({ ...p, note: e.target.value }))}
                  placeholder="Anything you want admin to know"
                  style={{ width: '100%', minHeight: 60, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13 }}
                />
              </div>

              {paymentError && (
                <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 13, color: '#ef4444', marginBottom: 12 }}>
                  ⚠ {paymentError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setConfirmOpen(false)}
                  disabled={paymentSubmitting}
                  style={{
                    padding: '8px 16px', borderRadius: 8, height: 38,
                    background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)', cursor: paymentSubmitting ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap'
                  }}
                >Cancel</button>
                <button
                  onClick={() => submitBuyRequest(selectedPlan._id, selectedTierIndex)}
                  disabled={paymentSubmitting || adminUpiList.length === 0}
                  style={{
                    padding: '8px 18px', borderRadius: 8, height: 38,
                    background: '#10b981', color: '#fff', border: 'none',
                    cursor: paymentSubmitting ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13,
                    opacity: paymentSubmitting ? 0.7 : 1, whiteSpace: 'nowrap'
                  }}
                >{paymentSubmitting ? 'Submitting…' : 'Submit Request'}</button>
              </div>
            </>)}
          </div>
        </div>
      )}

      {/* QR enlargement lightbox */}
      {qrPreview && (
        <div
          onClick={() => setQrPreview(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out'
          }}
        >
          <img src={qrPreview} alt="QR" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }} onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .prop-eval-layout { flex-direction: column !important; }
          .prop-summary-panel { width: 100% !important; position: static !important; }
        }
        @media (max-width: 600px) {
          .prop-plans-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '14px 24px',
          borderRadius: '12px',
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: '#fff',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          zIndex: 9999,
          maxWidth: '400px',
          animation: 'slideIn 0.3s ease'
        }}>
          {toast.type === 'error' ? '❌ ' : '✅ '}{toast.message}
        </div>
      )}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default PropChallengePage;
