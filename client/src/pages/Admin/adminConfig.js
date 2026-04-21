// Admin Configuration - Shared across all admin pages
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Icon component names — resolved in AdminLayout.jsx via ADMIN_ICON_MAP.
// We store string keys here (not JSX) so this file stays a plain .js module
// with no React dependency.
export const sidebarMenu = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/admin' },
  { id: 'user-management', label: 'User Management', icon: 'users', path: '/admin/users' },
  { id: 'trade-management', label: 'Trade Management', icon: 'trades', path: '/admin/trades' },
  { id: 'bank-fund-management', label: 'Bank & Fund Management', icon: 'bank', path: '/admin/funds' },
  { id: 'brand-management', label: 'Brand Management', icon: 'brand', path: '/admin/brand' },
  { id: 'binary-settings', label: 'Binary Mode Settings', icon: 'timer', path: '/admin/binary-settings' },
  { id: 'risk-management', label: 'Risk Management', icon: 'shield', path: '/admin/risk-management' },
  { id: 'netting-segment-management', label: 'Netting Segments', icon: 'netting', path: '/admin/netting-segments' },
  { id: 'bonus-management', label: 'Bonus Management', icon: 'gift', path: '/admin/bonus-management' },
  { id: 'zerodha-connect', label: 'Zerodha Connect', icon: 'radio', path: '/admin/zerodha' },
  { id: 'market-control', label: 'Market Control', icon: 'clock', path: '/admin/market-control' },
  { id: 'prop-trading', label: 'Prop Trading', icon: 'trophy', path: '/admin/prop-trading' },
  { id: 'reports', label: 'Reports & Analytics', icon: 'reports', path: '/admin/reports' },
  { id: 'activity-logs', label: 'Activity Logs', icon: 'activity', path: '/admin/activity-logs' },
  { id: 'notifications', label: 'Notifications', icon: 'bell', path: '/admin/notifications' },
  { id: 'settings', label: 'Settings', icon: 'settings', path: '/admin/settings' }
];

// Sub-tabs for each main section
export const sectionTabs = {
  'user-management': [
    { id: 'all-users', label: 'All Users', path: '' },
    { id: 'active-users', label: 'Active Users', path: 'active' },
    { id: 'blocked-users', label: 'Blocked Users', path: 'blocked' },
    { id: 'demo-users', label: 'Demo Users', path: 'demo' },
    { id: 'kyc-management', label: 'KYC Verification', path: 'kyc' },
    { id: 'user-logs', label: 'Activity Logs', path: 'logs' }
  ],
  'trade-management': [
    { id: 'combined', label: 'Combined Positions', path: '' },
    { id: 'open-positions', label: 'Open Positions', path: 'open' },
    { id: 'closed-positions', label: 'Closed Positions', path: 'closed' },
    { id: 'pending-orders', label: 'Pending Orders', path: 'pending' },
    { id: 'trade-history', label: 'Trade History', path: 'history' },
    { id: 'edited-trades', label: 'Edited Trades', path: 'edited' }
  ],
  'bank-fund-management': [
    { id: 'deposit-requests', label: 'Deposits', path: '' },
    { id: 'withdrawal-requests', label: 'Withdrawals', path: 'withdrawals' },
    { id: 'bank-accounts', label: 'Bank Accounts', path: 'banks' },
    { id: 'upi-management', label: 'UPI', path: 'upi' },
    { id: 'crypto-wallets', label: 'Crypto Wallets', path: 'crypto' },
    { id: 'transaction-history', label: 'History', path: 'history' }
  ],
  'admin-management': [
    { id: 'sub-admins', label: 'Sub-Admins', path: '' },
    { id: 'brokers', label: 'Brokers', path: 'brokers' },
    { id: 'hierarchy', label: 'Hierarchy View', path: 'hierarchy' },
    { id: 'fund-requests', label: 'Fund Requests', path: 'fund-requests' },
    { id: 'subadmin-logs', label: 'Sub-Admin Activity', path: 'subadmin-logs' },
    { id: 'broker-logs', label: 'Broker Activity', path: 'broker-logs' }
  ],
  'brand-management': [
    { id: 'banner-settings', label: 'Banners', path: '' }
  ],
  'netting-segment-management': [
    { id: 'netting-settings', label: 'Segment Settings', path: '' },
    { id: 'netting-scripts', label: 'Script Settings', path: 'scripts' },
    { id: 'netting-user-settings', label: 'User Settings', path: 'users' },
    { id: 'netting-copy-settings', label: 'Copy Settings', path: 'copy' }
  ],
  'reports': [
    { id: 'financial-reports', label: 'Financial Reports', path: '' },
    { id: 'user-reports', label: 'User Reports', path: 'users' },
    { id: 'trade-reports', label: 'Trade Reports', path: 'trades' },
    { id: 'commission-reports', label: 'Commission Reports', path: 'commissions' },
    { id: 'broker-reports', label: 'Broker Reports', path: 'brokers' },
    { id: 'subadmin-reports', label: 'Sub-Admin Reports', path: 'subadmins' }
  ],
  'notifications': [
    { id: 'push-notifications', label: 'Push Notifications', path: '' },
    { id: 'email-templates', label: 'Email Templates', path: 'email' }
  ],
  'settings': [
    { id: 'general-settings', label: 'General', path: '' },
    { id: 'admin-account', label: 'My account', path: 'account' }
  ]
};
