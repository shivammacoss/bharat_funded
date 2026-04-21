import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';

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
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [propStatus, setPropStatus] = useState({ enabled: false });
  const [myAccounts, setMyAccounts] = useState([]);
  const [activeProgram, setActiveProgram] = useState(2);
  const [selectedId, setSelectedId] = useState(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, c, a] = await Promise.all([
        fetch(`${API_URL}/api/prop/status`).then(r => r.json()),
        fetch(`${API_URL}/api/prop/challenges`).then(r => r.json()),
        fetch(`${API_URL}/api/prop/my-accounts`, { headers: getAuthHeaders() }).then(r => r.json()),
      ]);
      if (s.success) setPropStatus(s);
      if (c.success) setChallenges(c.challenges);
      if (a.success) setMyAccounts(a.accounts);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const buyChallenge = async (id) => {
    setBuying(id);
    try {
      const res = await fetch(`${API_URL}/api/prop/buy`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ challengeId: id }) });
      const d = await res.json();
      if (d.success) { setSelectedId(null); setAgreeTerms(false); alert(`${d.message}\nAccount ID: ${d.account.accountId}`); fetchAll(); }
      else alert(d.message || 'Purchase failed');
    } catch (e) { alert('Error purchasing challenge'); }
    setBuying(null);
  };

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
    setAgreeTerms(false);
  }, [activeProgram, currentPlans.length]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-secondary)' }}>Loading challenges...</div>;
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

            {/* ===== EVALUATION PLANS GRID ===== */}
            <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: '700', margin: '0 0 16px' }}>Evaluation Plans</h2>
            <div className="prop-plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              {currentPlans.map((ch, i) => {
                const isSel = selectedId === ch._id;
                const popIdx = currentPlans.length > 2 ? Math.floor(currentPlans.length / 2) : -1;
                return (
                  <div key={ch._id} onClick={() => { setSelectedId(ch._id); setAgreeTerms(false); }} style={{
                    cursor: 'pointer', borderRadius: '14px', padding: '20px 18px', position: 'relative',
                    background: isSel ? (pm.steps === 0 ? '#fef3c7' : 'var(--bg-secondary)') : 'var(--bg-secondary)',
                    border: isSel ? '2px solid var(--text-primary)' : '1px solid var(--border-color)',
                    transition: 'all 0.15s'
                  }}>
                    {i === popIdx && (
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
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Balance</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px' }}>
                      ₹ {(ch.fundSize * 85).toLocaleString('en-IN')}
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
                        ₹ {(ch.challengeFee * 85).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                );
              })}
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
                  <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    ₹ {(selectedPlan.challengeFee * 85).toLocaleString('en-IN')}
                  </div>
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
                    { l: 'Selected Account', v: `₹ ${(selectedPlan.fundSize * 85).toLocaleString('en-IN')}` },
                    { l: 'Account Type', v: pm.label },
                    { l: 'Evaluation Fee', v: `₹ ${(selectedPlan.challengeFee * 85).toLocaleString('en-IN')}` },
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

                {/* Pay Button — opens confirm modal first */}
                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={!agreeTerms || buying}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
                    cursor: agreeTerms && !buying ? 'pointer' : 'not-allowed',
                    fontWeight: '700', fontSize: '14px', color: '#fff',
                    background: agreeTerms ? (pm.steps === 0 ? '#f59e0b' : '#1a1a2e') : 'var(--border-color)',
                    opacity: agreeTerms ? 1 : 0.5, transition: 'all 0.2s'
                  }}
                >
                  {buying ? 'Processing...' : `Pay ₹ ${(selectedPlan.challengeFee * 85).toLocaleString('en-IN')}`}
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
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Confirm Purchase</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Please review the rules before paying the non-refundable evaluation fee.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>FUND SIZE</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>₹ {(Number(selectedPlan.fundSize) * 85).toLocaleString('en-IN')}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>EVALUATION FEE</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>₹ {(Number(selectedPlan.challengeFee) * 85).toLocaleString('en-IN')}</div>
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
                disabled={buying}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)', cursor: buying ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => { await buyChallenge(selectedPlan._id); setConfirmOpen(false); }}
                disabled={buying}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  background: '#10b981', color: '#fff', border: 'none',
                  cursor: buying ? 'not-allowed' : 'pointer', fontWeight: 700
                }}
              >
                {buying ? 'Processing…' : `Confirm & Pay ₹ ${(Number(selectedPlan.challengeFee) * 85).toLocaleString('en-IN')}`}
              </button>
            </div>
          </div>
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
    </div>
  );
}

export default PropChallengePage;
