import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  LuUsers, LuTrendingUp, LuBanknote, LuChartColumn,
  LuUserCheck, LuUserX, LuClock, LuGamepad2,
  LuBriefcase, LuHandshake, LuArrowDownToLine, LuHourglass
} from 'react-icons/lu';

// Auto-shrink stat value: full font at <=10 chars, scales down for longer text
function StatValue({ children, style }) {
  const text = String(children ?? '');
  const len = text.length;
  let fontSize = 22;
  if (len > 16) fontSize = 13;
  else if (len > 14) fontSize = 14;
  else if (len > 12) fontSize = 16;
  else if (len > 10) fontSize = 18;
  return <div className="fund-stat-card__value" style={{ fontSize, ...style }}>{text}</div>;
}

function Dashboard() {
  const { API_URL, adminCurrency, usdInrRate, formatAdminCurrency } = useOutletContext();
  
  // Local currency formatter that handles INR values (deposits/withdrawals are stored in INR)
  const formatCurrency = (value) => {
    const numValue = Number(value || 0);
    return `₹${numValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const [statsLoading, setStatsLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    demoUsers: 0,
    totalSubAdmins: 0,
    totalBrokers: 0,
    totalTrades: 0,
    openPositions: 0,
    closedTrades: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentTrades, setRecentTrades] = useState([]);

  const fetchDashboardStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/dashboard/stats`);
      const data = await res.json();
      if (data.success) {
        setDashboardStats(data.stats);
        setRecentUsers(data.recentUsers || []);
        setRecentTrades(data.recentTrades || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (statsLoading) {
    return <div className="loading-spinner">Loading dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="fund-stats-row">
        <div className="fund-stat-card">
          <div className="fund-stat-card__top">
            <div className="fund-stat-card__icon" style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.35)', color: '#60a5fa' }}><LuUsers size={18} /></div>
            <div className="fund-stat-card__meta">
              <div className="fund-stat-card__label">Total Users</div>
              <StatValue>{dashboardStats.totalUsers.toLocaleString()}</StatValue>
            </div>
          </div>
        </div>
        <div className="fund-stat-card">
          <div className="fund-stat-card__top">
            <div className="fund-stat-card__icon" style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.35)', color: '#4ade80' }}><LuTrendingUp size={18} /></div>
            <div className="fund-stat-card__meta">
              <div className="fund-stat-card__label">Total Trades</div>
              <StatValue>{dashboardStats.totalTrades.toLocaleString()}</StatValue>
            </div>
          </div>
        </div>
        <div className="fund-stat-card">
          <div className="fund-stat-card__top">
            <div className="fund-stat-card__icon" style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.35)', color: '#4ade80' }}><LuBanknote size={18} /></div>
            <div className="fund-stat-card__meta">
              <div className="fund-stat-card__label">Total Deposits</div>
              <StatValue>{formatCurrency(dashboardStats.totalDeposits)}</StatValue>
            </div>
          </div>
        </div>
        <div className="fund-stat-card">
          <div className="fund-stat-card__top">
            <div className="fund-stat-card__icon" style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.35)', color: '#c084fc' }}><LuChartColumn size={18} /></div>
            <div className="fund-stat-card__meta">
              <div className="fund-stat-card__label">Open Positions</div>
              <StatValue>{dashboardStats.openPositions}</StatValue>
            </div>
          </div>
        </div>
      </div>

      <div className="fund-stats-row">
        <div className="fund-stat-card">
          <div className="fund-stat-card__top">
            <div className="fund-stat-card__icon" style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.35)', color: '#4ade80' }}><LuUserCheck size={18} /></div>
            <div className="fund-stat-card__meta">
              <div className="fund-stat-card__label">Active Users</div>
              <StatValue>{dashboardStats.activeUsers}</StatValue>
            </div>
          </div>
        </div>
        <div className="fund-stat-card">
          <div className="fund-stat-card__top">
            <div className="fund-stat-card__icon" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171' }}><LuUserX size={18} /></div>
            <div className="fund-stat-card__meta">
              <div className="fund-stat-card__label">Blocked Users</div>
              <StatValue>{dashboardStats.blockedUsers}</StatValue>
            </div>
          </div>
        </div>
        <div className="fund-stat-card">
          <div className="fund-stat-card__top">
            <div className="fund-stat-card__icon" style={{ background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.35)', color: '#fbbf24' }}><LuClock size={18} /></div>
            <div className="fund-stat-card__meta">
              <div className="fund-stat-card__label">Pending Deposits</div>
              <StatValue>{dashboardStats.pendingDeposits}</StatValue>
            </div>
          </div>
        </div>
        <div className="fund-stat-card">
          <div className="fund-stat-card__top">
            <div className="fund-stat-card__icon" style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.35)', color: '#c084fc' }}><LuGamepad2 size={18} /></div>
            <div className="fund-stat-card__meta">
              <div className="fund-stat-card__label">Demo Users</div>
              <StatValue>{dashboardStats.demoUsers}</StatValue>
            </div>
          </div>
        </div>
      </div>

      <div className="fund-stats-row">
        <div className="fund-stat-card">
          <div className="fund-stat-card__top">
            <div className="fund-stat-card__icon" style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.35)', color: '#60a5fa' }}><LuBriefcase size={18} /></div>
            <div className="fund-stat-card__meta">
              <div className="fund-stat-card__label">Sub-Admins</div>
              <StatValue>{dashboardStats.totalSubAdmins}</StatValue>
            </div>
          </div>
        </div>
        <div className="fund-stat-card">
          <div className="fund-stat-card__top">
            <div className="fund-stat-card__icon" style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.35)', color: '#22d3ee' }}><LuHandshake size={18} /></div>
            <div className="fund-stat-card__meta">
              <div className="fund-stat-card__label">Brokers</div>
              <StatValue>{dashboardStats.totalBrokers}</StatValue>
            </div>
          </div>
        </div>
        <div className="fund-stat-card">
          <div className="fund-stat-card__top">
            <div className="fund-stat-card__icon" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171' }}><LuArrowDownToLine size={18} /></div>
            <div className="fund-stat-card__meta">
              <div className="fund-stat-card__label">Total Withdrawals</div>
              <StatValue>{formatCurrency(dashboardStats.totalWithdrawals)}</StatValue>
            </div>
          </div>
        </div>
        <div className="fund-stat-card">
          <div className="fund-stat-card__top">
            <div className="fund-stat-card__icon" style={{ background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.35)', color: '#fbbf24' }}><LuHourglass size={18} /></div>
            <div className="fund-stat-card__meta">
              <div className="fund-stat-card__label">Pending Withdrawals</div>
              <StatValue>{dashboardStats.pendingWithdrawals}</StatValue>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-card">
          <h3>Quick Stats</h3>
          <div style={{ padding: '20px' }}>
            <p><strong>Closed Trades:</strong> {dashboardStats.closedTrades}</p>
            <p><strong>Total Withdrawals:</strong> {formatCurrency(dashboardStats.totalWithdrawals)}</p>
            <p><strong>Pending Withdrawals:</strong> {dashboardStats.pendingWithdrawals}</p>
          </div>
        </div>
        <div className="chart-card">
          <h3>Recent Trades</h3>
          {recentTrades.length === 0 ? (
            <p style={{ padding: '20px', color: '#888' }}>No trades yet</p>
          ) : (
            <div style={{ maxHeight: '200px', overflow: 'auto' }}>
              <table className="admin-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Volume</th>
                    <th>P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.slice(0, 5).map((trade, idx) => (
                    <tr key={idx}>
                      <td>{trade.symbol}</td>
                      <td className={trade.side === 'buy' ? 'text-green' : 'text-red'}>{trade.side?.toUpperCase()}</td>
                      <td>{trade.volume}</td>
                      <td className={trade.profit >= 0 ? 'text-green' : 'text-red'}>
                        {trade.profit >= 0 ? '+' : ''}{formatCurrency(Math.abs(trade.profit || 0), false)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-tables">
        <div className="table-card">
          <h3>Recent Users</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#888' }}>No users yet</td></tr>
              ) : (
                recentUsers.map((user, idx) => (
                  <tr key={idx}>
                    <td>#{user.oderId || user._id?.slice(-6)}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{formatCurrency(user.wallet?.balance || 0, false)}</td>
                    <td>
                      <span className={`status-badge ${user.isActive === false ? 'blocked' : 'active'}`}>
                        {user.isActive === false ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
