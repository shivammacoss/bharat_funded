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

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'evaluation', label: 'Evaluation' },
  { key: 'funded', label: 'Funded' },
  { key: 'milestones', label: 'Milestones' },
];

function CertificatesPage() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
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
      console.error(err);
    }
    setLoading(false);
  };

  // Derive certificates from accounts
  const certificates = myAccounts
    .filter(a => a.status === 'PASSED' || a.status === 'FUNDED')
    .map(a => ({
      id: a._id,
      name: a.challengeId?.name || 'Challenge',
      fundSize: a.challengeId?.fundSize || a.initialBalance,
      type: a.status === 'FUNDED' ? 'funded' : 'evaluation',
      status: a.status,
      accountId: a.accountId,
      date: a.updatedAt || a.createdAt,
    }));

  const filtered = activeTab === 'all' ? certificates : certificates.filter(c => c.type === activeTab);
  const counts = {
    all: certificates.length,
    evaluation: certificates.filter(c => c.type === 'evaluation').length,
    funded: certificates.filter(c => c.type === 'funded').length,
    milestones: 0,
  };

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={{ padding: '24px 28px 60px' }}>

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Home / <span style={{ color: 'var(--text-primary)' }}>Certificates</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>My Certificates</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
              Verified achievements across evaluations, funded status, and payout milestones.
            </p>
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{certificates.length} total</span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '7px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                border: 'none', cursor: 'pointer',
                background: activeTab === t.key ? '#3b82f6' : 'var(--bg-secondary)',
                color: activeTab === t.key ? '#fff' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              {t.label}
              <span style={{
                padding: '1px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: '700',
                background: activeTab === t.key ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary, var(--bg-primary))',
                color: activeTab === t.key ? '#fff' : 'var(--text-secondary)'
              }}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</p>
        ) : filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(cert => (
              <div key={cert.id} style={{
                padding: '20px', borderRadius: '14px',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: cert.type === 'funded' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                  }}>
                    {cert.type === 'funded' ? '\u{1F3C6}' : '\u{1F4DC}'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px' }}>{cert.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      ${cert.fundSize?.toLocaleString()} &middot; {cert.accountId} &middot; {new Date(cert.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <span style={{
                  padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600',
                  background: cert.type === 'funded' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                  color: cert.type === 'funded' ? '#f59e0b' : '#10b981'
                }}>
                  {cert.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '60px 20px', borderRadius: '14px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.4 }}>&#x1F3C5;</div>
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px', fontSize: '16px' }}>No certificates issued yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 20px', maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto' }}>
              Successfully complete an evaluation to earn a verified trading certificate that demonstrates discipline, consistency, and risk management.
            </p>
            <button
              onClick={() => navigate('/app/challenges')}
              style={{
                padding: '10px 24px', borderRadius: '10px', border: '1px solid var(--border-color, #333)',
                background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer',
                fontWeight: '600', fontSize: '13px'
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

export default CertificatesPage;
