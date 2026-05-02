import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { LuTrophy, LuWallet, LuClock, LuCheck } from 'react-icons/lu';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getAuthHeaders() {
  const authData = JSON.parse(localStorage.getItem('bharatfunded-auth') || '{}');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authData.token || ''}`
  };
}

const fmtINR = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function PassedChallengesPage() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingPayouts, setPendingPayouts] = useState({}); // { challengeAccountId: txId }

  // Withdraw modal state
  const [withdrawAccount, setWithdrawAccount] = useState(null);
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', upiId: '', holderName: '', note: '', qrImage: '' });
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/prop/my-accounts`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        // Only show accounts that have passed evaluation OR are funded
        const filtered = (data.accounts || []).filter(a =>
          a.status === 'PASSED' || a.status === 'FUNDED'
        );
        setAccounts(filtered);
      }
    } catch (e) { /* ignore */ }
    // Pull pending payout requests so we can hide "Withdraw" button on accounts with active request
    try {
      const r = await fetch(`${API_URL}/api/prop/my-payouts`, { headers: getAuthHeaders() });
      const d = await r.json();
      if (d.success) {
        const m = {};
        (d.payouts || []).forEach(p => {
          if (p.status === 'pending' && p.paymentDetails?.challengeAccountId) {
            m[String(p.paymentDetails.challengeAccountId)] = p._id;
          }
        });
        setPendingPayouts(m);
      }
    } catch (e) { /* ignore — endpoint may not exist; we just won't show pending markers */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openWithdraw = (acc) => {
    // `acc` may be null when user clicks the always-visible Withdraw CTA
    // without any funded account — we still open the modal so they can
    // fill UPI/QR/amount; the submit step then surfaces the actionable
    // "you need to win a challenge first" error from the engine.
    const max = acc ? computeWithdrawable(acc).withdrawable : 0;
    setWithdrawAccount(acc || { _placeholder: true });
    setWithdrawForm({
      amount: max > 0 ? String(max.toFixed(2)) : '',
      upiId: '',
      holderName: user?.name || '',
      note: '',
      qrImage: ''
    });
    setWithdrawMsg(null);
  };

  const handleQrUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setWithdrawMsg({ type: 'err', text: 'QR image too large (max 3 MB)' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setWithdrawForm(p => ({ ...p, qrImage: String(reader.result || '') }));
      setWithdrawMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const submitWithdraw = async () => {
    setWithdrawMsg(null);
    const amt = Number(withdrawForm.amount);
    if (!(amt > 0)) { setWithdrawMsg({ type: 'err', text: 'Enter a valid amount' }); return; }
    if (!withdrawForm.upiId.trim()) { setWithdrawMsg({ type: 'err', text: 'UPI ID required' }); return; }
    if (!withdrawForm.holderName.trim()) { setWithdrawMsg({ type: 'err', text: 'Holder name required' }); return; }
    // Placeholder account = user has no funded account yet. Show a clear
    // message instead of POSTing (would 400 from engine anyway).
    if (withdrawAccount?._placeholder) {
      setWithdrawMsg({
        type: 'err',
        text: 'You do not have any funds available for withdrawal. Please pass and fund a challenge first to request a payout.'
      });
      return;
    }
    setWithdrawBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/prop/withdraw`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          challengeAccountId: withdrawAccount._id,
          amount: amt,
          upiId: withdrawForm.upiId.trim(),
          holderName: withdrawForm.holderName.trim(),
          note: withdrawForm.note.trim(),
          qrImage: withdrawForm.qrImage || ''
        })
      });
      const d = await res.json();
      if (d.success) {
        setWithdrawMsg({ type: 'ok', text: `Withdrawal request submitted. Admin will transfer ₹${Number(d.requestedAmount || 0).toFixed(2)} to your UPI.` });
        setTimeout(() => { setWithdrawAccount(null); fetchAll(); }, 1500);
      } else {
        setWithdrawMsg({ type: 'err', text: d.message || 'Failed' });
      }
    } catch (e) { setWithdrawMsg({ type: 'err', text: e.message }); }
    setWithdrawBusy(false);
  };

  // Compute withdrawable amount for an account
  const computeWithdrawable = (acc) => {
    const initial = Number(acc.initialBalance) || 0;
    const balance = Number(acc.walletBalance || acc.currentBalance) || initial;
    const profit = Math.max(0, balance - initial);
    const splitPct = Number(acc.profitSplitPercent || 80);
    return {
      profit,
      withdrawable: (profit * splitPct) / 100,
      splitPct,
      balance,
      initial
    };
  };

  if (loading) {
    return <div style={{ padding: 24, color: 'var(--text-secondary)' }}>Loading passed challenges…</div>;
  }

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      <style>{`
        .pc-page { padding: 20px 28px 60px; max-width: 1200px; margin: 0 auto; }
        .pc-headline { color: var(--text-primary); margin: 0 0 6px; display: flex; align-items: center; gap: 10px; font-size: 26px; font-weight: 700; }
        .pc-subhead { color: var(--text-secondary); font-size: 13px; margin: 0 0 22px; }
        .pc-summary { padding: 18px; border-radius: 14px; margin-bottom: 18px;
          background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02));
          border: 2px solid rgba(16,185,129,0.3); }
        .pc-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 14px; }
        .pc-stat { padding: 0; }
        .pc-stat-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; line-height: 1.2; }
        .pc-stat-big { font-size: 28px; font-weight: 800; color: #10b981; margin-top: 4px; line-height: 1.15; }
        .pc-stat-num { font-size: 22px; font-weight: 700; margin-top: 4px; line-height: 1.15; }
        .pc-stat-sub { font-size: 11px; color: var(--text-secondary); margin-top: 2px; line-height: 1.25; }
        .pc-cta-row { display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding-top: 14px; border-top: 1px dashed rgba(16,185,129,0.3); flex-wrap: wrap; }
        .pc-cta-text { font-size: 13px; color: var(--text-secondary); flex: 1; min-width: 200px; }
        .pc-cta-btn { padding: 12px 22px; border-radius: 10px; border: none; background: #10b981;
          color: #fff; font-weight: 700; font-size: 14px; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; }
        .pc-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }

        @media (max-width: 640px) {
          .pc-page { padding: 14px 12px 80px; }
          .pc-headline { font-size: 20px; gap: 8px; }
          .pc-subhead { font-size: 12px; margin-bottom: 14px; }
          .pc-summary { padding: 12px; border-radius: 12px; margin-bottom: 14px; border-width: 1.5px; }
          .pc-summary-grid { grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
          .pc-stat { padding: 10px; border-radius: 10px;
            background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
          .pc-stat-label { font-size: 9px; letter-spacing: 0.3px; }
          .pc-stat-big { font-size: 18px; margin-top: 2px; }
          .pc-stat-num { font-size: 15px; margin-top: 2px; }
          .pc-stat-sub { font-size: 9px; margin-top: 1px; }
          .pc-cta-row { flex-direction: column; align-items: stretch; gap: 8px; padding-top: 10px; }
          .pc-cta-text { font-size: 11px; text-align: center; min-width: 0; line-height: 1.35; }
          .pc-cta-btn { width: 100%; padding: 11px 14px; font-size: 13px; }
          .pc-cards-grid { grid-template-columns: 1fr; gap: 12px; }
        }
      `}</style>
      <div className="pc-page">
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
          Home / <span style={{ color: 'var(--text-primary)' }}>Passed Challenges</span>
        </div>
        <h1 className="pc-headline">
          <LuTrophy size={22} /> Passed Challenges
        </h1>
        <p className="pc-subhead">
          Your funded accounts. Profit kamao aur direct UPI me withdraw karo.
        </p>

        {/* Always-visible top summary card */}
        {(() => {
          const fundedAccs = accounts.filter(a => a.status === 'FUNDED');
          const totalWithdrawable = fundedAccs.reduce((s, a) => s + computeWithdrawable(a).withdrawable, 0);
          const totalProfit = accounts.reduce((s, a) => s + computeWithdrawable(a).profit, 0);
          const totalWithdrawn = accounts.reduce((s, a) => s + (Number(a.totalWithdrawn) || 0), 0);
          // Pick the funded account with highest withdrawable for the global Withdraw button.
          const bestFunded = [...fundedAccs].sort(
            (a, b) => computeWithdrawable(b).withdrawable - computeWithdrawable(a).withdrawable
          )[0];
          const canWithdraw = !!bestFunded && totalWithdrawable > 0;
          return (
            <div className="pc-summary">
              <div className="pc-summary-grid">
                <div className="pc-stat">
                  <div className="pc-stat-label">Withdrawable</div>
                  <div className="pc-stat-big">{fmtINR(totalWithdrawable)}</div>
                  <div className="pc-stat-sub">Across funded a/c</div>
                </div>
                <div className="pc-stat">
                  <div className="pc-stat-label">Profit Earned</div>
                  <div className="pc-stat-num" style={{ color: 'var(--text-primary)' }}>{fmtINR(totalProfit)}</div>
                </div>
                <div className="pc-stat">
                  <div className="pc-stat-label">Already Withdrawn</div>
                  <div className="pc-stat-num" style={{ color: '#3b82f6' }}>{fmtINR(totalWithdrawn)}</div>
                </div>
                <div className="pc-stat">
                  <div className="pc-stat-label">Funded A/c</div>
                  <div className="pc-stat-num" style={{ color: '#f59e0b' }}>{fundedAccs.length}</div>
                  <div className="pc-stat-sub">
                    {accounts.filter(a => a.status === 'PASSED').length} awaiting funding
                  </div>
                </div>
              </div>

              {/* Always-visible Withdraw CTA — opens form regardless of
                  whether user has a funded account. If not funded, the
                  submit step shows a friendly message asking them to
                  pass a challenge first. */}
              <div className="pc-cta-row">
                <div className="pc-cta-text">
                  Fill your UPI details &amp; request withdrawal. Admin will verify and transfer.
                </div>
                <button
                  type="button"
                  onClick={() => openWithdraw(bestFunded || null)}
                  className="pc-cta-btn"
                >
                  <LuWallet size={16} />
                  {canWithdraw ? `Withdraw ${fmtINR(totalWithdrawable)}` : 'Withdraw'}
                </button>
              </div>
            </div>
          );
        })()}

        {accounts.length === 0 ? (
          <div style={{
            padding: 40, textAlign: 'center', borderRadius: 14,
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🏆</div>
            <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>No passed challenges yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 16px' }}>
              Pass an evaluation challenge to see it here. After passing, you can withdraw the profit split directly to your UPI.
            </p>
            <button
              onClick={() => navigate('/app/my-challenges')}
              style={{
                padding: '10px 22px', borderRadius: 10, border: 'none',
                background: '#3b82f6', color: '#fff', fontWeight: 600, cursor: 'pointer'
              }}
            >See My Challenges</button>
          </div>
        ) : (
          <div className="pc-cards-grid">
            {accounts.map(acc => {
              const { profit, withdrawable, splitPct, balance, initial } = computeWithdrawable(acc);
              const hasPendingPayout = !!pendingPayouts[String(acc._id)];
              const isFunded = acc.status === 'FUNDED';
              const isPassed = acc.status === 'PASSED';

              return (
                <div
                  key={acc._id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: `2px solid ${isFunded ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.4)'}`,
                    borderRadius: 14,
                    padding: 18,
                    position: 'relative'
                  }}
                >
                  {/* Status badge */}
                  <div style={{
                    position: 'absolute', top: 14, right: 14,
                    padding: '4px 12px', borderRadius: 999,
                    background: isFunded ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                    color: isFunded ? '#f59e0b' : '#10b981',
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    <LuCheck size={12} /> {isFunded ? 'FUNDED' : 'PASSED'}
                  </div>

                  {/* Header */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {acc.accountId}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                      {acc.challengeId?.name || 'Challenge'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Fund Size: <strong>{fmtINR(initial)}</strong> · Split: <strong>{splitPct}%</strong>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    <div style={{ padding: 10, borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Current Balance</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                        {fmtINR(balance)}
                      </div>
                    </div>
                    <div style={{ padding: 10, borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Profit</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: profit > 0 ? '#10b981' : 'var(--text-secondary)', marginTop: 2 }}>
                        {fmtINR(profit)}
                      </div>
                    </div>
                    <div style={{
                      padding: 10, borderRadius: 8,
                      background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
                      gridColumn: '1 / span 2'
                    }}>
                      <div style={{ fontSize: 10, color: '#10b981', textTransform: 'uppercase', fontWeight: 600 }}>
                        Withdrawable (Your {splitPct}% Share)
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                        {fmtINR(withdrawable)}
                      </div>
                    </div>
                  </div>

                  {/* History */}
                  {Number(acc.totalWithdrawn) > 0 && (
                    <div style={{
                      padding: 10, borderRadius: 8, marginBottom: 12,
                      background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)',
                      fontSize: 12, color: 'var(--text-secondary)'
                    }}>
                      Total already withdrawn: <strong style={{ color: '#3b82f6' }}>{fmtINR(acc.totalWithdrawn)}</strong>
                      {acc.lastWithdrawalDate && (
                        <span> · Last: {new Date(acc.lastWithdrawalDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => navigate(`/app/challenge/${acc._id}`)}
                      style={{
                        flex: 1, padding: '10px 12px', borderRadius: 8,
                        background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)', cursor: 'pointer',
                        fontWeight: 600, fontSize: 13
                      }}
                    >View Details</button>
                    {isFunded && hasPendingPayout ? (
                      <div style={{
                        flex: 1, padding: '10px 12px', borderRadius: 8,
                        background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                        color: '#f59e0b', fontWeight: 600, fontSize: 12, textAlign: 'center',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                      }}>
                        <LuClock size={14} /> Payout pending
                      </div>
                    ) : isFunded && withdrawable > 0 ? (
                      <button
                        onClick={() => openWithdraw(acc)}
                        style={{
                          flex: 1, padding: '10px 12px', borderRadius: 8,
                          background: '#10b981', color: '#fff', border: 'none',
                          cursor: 'pointer', fontWeight: 700, fontSize: 13,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5
                        }}
                      ><LuWallet size={14} /> Withdraw</button>
                    ) : isPassed ? (
                      <div style={{
                        flex: 1, padding: '10px 12px', borderRadius: 8,
                        background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                        color: '#10b981', fontWeight: 600, fontSize: 12, textAlign: 'center'
                      }}>Awaiting funding</div>
                    ) : (
                      <div style={{
                        flex: 1, padding: '10px 12px', borderRadius: 8,
                        background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                        fontWeight: 500, fontSize: 12, textAlign: 'center'
                      }}>No profit yet</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Withdraw modal */}
      {withdrawAccount && (
        <div
          onClick={() => !withdrawBusy && setWithdrawAccount(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
            overflowY: 'auto'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              borderRadius: 14, width: '100%', maxWidth: 460, padding: 18,
              color: 'var(--text-primary)', maxHeight: '92vh', overflowY: 'auto'
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>💸 Withdraw Profit</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              {withdrawAccount.accountId} · {withdrawAccount.challengeId?.name}<br />
              Maximum withdrawable: <strong style={{ color: '#10b981' }}>{fmtINR(computeWithdrawable(withdrawAccount).withdrawable)}</strong>
              <br />Admin will transfer to your UPI ID below.
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>
                Amount to withdraw (₹) *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max={computeWithdrawable(withdrawAccount).withdrawable}
                value={withdrawForm.amount}
                onChange={(e) => setWithdrawForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="e.g. 5000"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setWithdrawForm(p => ({ ...p, amount: String(computeWithdrawable(withdrawAccount).withdrawable.toFixed(2)) }))}
                  style={{ flex: 1, padding: '5px 10px', fontSize: 11, borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}
                >Withdraw all ({fmtINR(computeWithdrawable(withdrawAccount).withdrawable)})</button>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>UPI ID *</label>
              <input
                type="text"
                value={withdrawForm.upiId}
                onChange={(e) => setWithdrawForm(p => ({ ...p, upiId: e.target.value }))}
                placeholder="yourname@upi"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13 }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>Account Holder Name *</label>
              <input
                type="text"
                value={withdrawForm.holderName}
                onChange={(e) => setWithdrawForm(p => ({ ...p, holderName: e.target.value }))}
                placeholder="As per UPI account"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13 }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>
                UPI QR Code (optional)
              </label>
              <input type="file" accept="image/*" onChange={handleQrUpload} style={{ fontSize: 12 }} />
              {withdrawForm.qrImage && (
                <img src={withdrawForm.qrImage} alt="QR preview" style={{ marginTop: 8, maxHeight: 120, borderRadius: 6, border: '1px solid var(--border-color)' }} />
              )}
              <small style={{ color: 'var(--text-secondary)', fontSize: 10, display: 'block', marginTop: 4 }}>
                Apna UPI ka QR upload karo so admin can verify and transfer faster.
              </small>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>Note (optional)</label>
              <textarea
                value={withdrawForm.note}
                onChange={(e) => setWithdrawForm(p => ({ ...p, note: e.target.value }))}
                style={{ width: '100%', minHeight: 50, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13 }}
              />
            </div>

            {withdrawMsg && (
              <div style={{
                padding: '10px 12px', borderRadius: 8, marginBottom: 12, fontSize: 13,
                background: withdrawMsg.type === 'err' ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                border: `1px solid ${withdrawMsg.type === 'err' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                color: withdrawMsg.type === 'err' ? '#ef4444' : '#10b981'
              }}>{withdrawMsg.text}</div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setWithdrawAccount(null)}
                disabled={withdrawBusy}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)', cursor: withdrawBusy ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >Cancel</button>
              <button
                onClick={submitWithdraw}
                disabled={withdrawBusy}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  background: '#10b981', color: '#fff', border: 'none',
                  cursor: withdrawBusy ? 'not-allowed' : 'pointer', fontWeight: 700
                }}
              >{withdrawBusy ? 'Submitting…' : 'Request Withdrawal'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PassedChallengesPage;
