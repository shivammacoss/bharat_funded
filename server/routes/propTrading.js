const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');
const ChallengeAccount = require('../models/ChallengeAccount');
const PropSettings = require('../models/PropSettings');
const { resolveAdminFromRequest, getScopedUserIds } = require('../middleware/adminPermission');

// Admin auth middleware (reuses existing admin resolution)
async function verifyAdminToken(req, res, next) {
  try {
    const admin = await resolveAdminFromRequest(req);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
}

// Helper: get user IDs scoped to this admin
async function getAdminUserIds(admin) {
  return getScopedUserIds(admin);
}

// ==================== ADMIN ROUTES ====================

// GET /api/prop/admin/settings
router.get('/admin/settings', verifyAdminToken, async (req, res) => {
  try {
    const settings = await PropSettings.getSettings(req.admin._id);
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/prop/admin/settings
router.put('/admin/settings', verifyAdminToken, async (req, res) => {
  try {
    const { challengeModeEnabled, displayName, description, termsAndConditions } = req.body;
    const settings = await PropSettings.updateSettings({
      challengeModeEnabled,
      displayName,
      description,
      termsAndConditions
    }, req.admin._id);
    res.json({ success: true, message: 'Settings updated', settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/prop/admin/challenges - Create new challenge
router.post('/admin/challenges', verifyAdminToken, async (req, res) => {
  try {
    const challengeData = { ...req.body };
    challengeData.adminId = req.admin._id;
    const challenge = await Challenge.create(challengeData);
    res.json({ success: true, message: 'Challenge created', challenge });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/prop/admin/challenges - Get all challenges
router.get('/admin/challenges', verifyAdminToken, async (req, res) => {
  try {
    const challengeQuery = { adminId: req.admin._id };
    const challenges = await Challenge.find(challengeQuery).sort({ sortOrder: 1, fundSize: 1 });
    res.json({ success: true, challenges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/prop/admin/challenges/:id - Update challenge
router.put('/admin/challenges/:id', verifyAdminToken, async (req, res) => {
  try {
    const existing = await Challenge.findById(req.params.id);
    if (!existing || existing.adminId?.toString() !== req.admin._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const challenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }
    res.json({ success: true, message: 'Challenge updated', challenge });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/prop/admin/challenges/:id - Delete challenge
router.delete('/admin/challenges/:id', verifyAdminToken, async (req, res) => {
  try {
    const existingChallenge = await Challenge.findById(req.params.id);
    if (!existingChallenge || existingChallenge.adminId?.toString() !== req.admin._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const accountsCount = await ChallengeAccount.countDocuments({ challengeId: req.params.id });
    if (accountsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete. ${accountsCount} accounts are using this challenge.`
      });
    }
    await Challenge.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Challenge deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/prop/admin/accounts - Get all challenge accounts
router.get('/admin/accounts', verifyAdminToken, async (req, res) => {
  try {
    const { status, challengeId, limit = 50, offset = 0 } = req.query;
    let query = {};
    if (status) query.status = status;
    if (challengeId) query.challengeId = challengeId;

    const acctUserIds = await getAdminUserIds(req.admin);
    if (acctUserIds) query.userId = { $in: acctUserIds };

    const accounts = await ChallengeAccount.find(query)
      .populate('userId', 'name email oderId')
      .populate('challengeId', 'name fundSize stepsCount')
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    const total = await ChallengeAccount.countDocuments(query);
    res.json({ success: true, accounts, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/prop/admin/force-pass/:id
router.post('/admin/force-pass/:id', verifyAdminToken, async (req, res) => {
  try {
    const account = await ChallengeAccount.findById(req.params.id);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    account.status = 'PASSED';
    account.passedAt = new Date();
    account.violations.push({
      rule: 'ADMIN_FORCE_PASS',
      description: `Forced pass by admin ${req.admin._id}`,
      severity: 'WARNING'
    });
    await account.save();

    // Create funded account
    const challenge = await Challenge.findById(account.challengeId);
    const fundedAccountId = await ChallengeAccount.generateAccountId('FND');
    const fundedExpiresAt = new Date();
    fundedExpiresAt.setFullYear(fundedExpiresAt.getFullYear() + 1);

    const fundedAccount = await ChallengeAccount.create({
      userId: account.userId,
      challengeId: account.challengeId,
      accountId: fundedAccountId,
      accountType: 'FUNDED',
      currentPhase: 0,
      totalPhases: 0,
      status: 'FUNDED',
      initialBalance: challenge.fundSize,
      currentBalance: challenge.fundSize,
      currentEquity: challenge.fundSize,
      phaseStartBalance: challenge.fundSize,
      dayStartEquity: challenge.fundSize,
      lowestEquityToday: challenge.fundSize,
      lowestEquityOverall: challenge.fundSize,
      highestEquity: challenge.fundSize,
      profitSplitPercent: challenge.fundedSettings?.profitSplitPercent || 80,
      paymentStatus: 'COMPLETED',
      expiresAt: fundedExpiresAt
    });

    account.fundedAccountId = fundedAccount._id;
    await account.save();

    res.json({ success: true, message: 'Challenge force passed', account, fundedAccount });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/prop/admin/force-fail/:id
router.post('/admin/force-fail/:id', verifyAdminToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const account = await ChallengeAccount.findById(req.params.id);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    account.status = 'FAILED';
    account.failedAt = new Date();
    account.failReason = reason || 'Admin force fail';
    account.violations.push({
      rule: 'ADMIN_FAIL',
      description: account.failReason,
      severity: 'FAIL',
      timestamp: new Date()
    });
    await account.save();
    res.json({ success: true, message: 'Challenge force failed', account });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/prop/admin/extend-time/:id
router.post('/admin/extend-time/:id', verifyAdminToken, async (req, res) => {
  try {
    const { days } = req.body;
    if (!days || days <= 0) {
      return res.status(400).json({ success: false, message: 'Days must be positive' });
    }
    const account = await ChallengeAccount.findById(req.params.id);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    const newExpiry = new Date(account.expiresAt);
    newExpiry.setDate(newExpiry.getDate() + days);
    account.expiresAt = newExpiry;
    account.violations.push({
      rule: 'ADMIN_EXTEND_TIME',
      description: `Extended ${days} days by admin ${req.admin._id}`,
      severity: 'WARNING'
    });
    await account.save();
    res.json({ success: true, message: `Extended by ${days} days`, account });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/prop/admin/reset/:id
router.post('/admin/reset/:id', verifyAdminToken, async (req, res) => {
  try {
    const account = await ChallengeAccount.findById(req.params.id).populate('challengeId');
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    const challenge = account.challengeId;
    const expiryDays = challenge.rules?.challengeExpiryDays;
    const expiresAt = new Date();
    if (challenge.stepsCount === 0 && (expiryDays === null || expiryDays === undefined)) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 50);
    } else {
      const n = Number(expiryDays);
      expiresAt.setDate(expiresAt.getDate() + (Number.isFinite(n) && n > 0 ? n : 30));
    }

    account.status = 'ACTIVE';
    account.currentPhase = 1;
    account.currentBalance = challenge.fundSize;
    account.currentEquity = challenge.fundSize;
    account.phaseStartBalance = challenge.fundSize;
    account.dayStartEquity = challenge.fundSize;
    account.lowestEquityToday = challenge.fundSize;
    account.lowestEquityOverall = challenge.fundSize;
    account.highestEquity = challenge.fundSize;
    account.currentDailyDrawdownPercent = 0;
    account.currentOverallDrawdownPercent = 0;
    account.maxDailyDrawdownHit = 0;
    account.maxOverallDrawdownHit = 0;
    account.currentProfitPercent = 0;
    account.totalProfitLoss = 0;
    account.tradesToday = 0;
    account.openTradesCount = 0;
    account.totalTrades = 0;
    account.tradingDaysCount = 0;
    account.warningsCount = 0;
    account.failReason = null;
    account.failedAt = null;
    account.passedAt = null;
    account.expiresAt = expiresAt;
    account.violations = [{
      rule: 'ADMIN_RESET',
      description: `Challenge reset by admin ${req.admin._id}`,
      severity: 'WARNING'
    }];
    await account.save();
    res.json({ success: true, message: 'Challenge reset', account });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/prop/admin/dashboard - Admin dashboard stats
router.get('/admin/dashboard', verifyAdminToken, async (req, res) => {
  try {
    let accountFilter = {};
    const statsUserIds = await getAdminUserIds(req.admin);
    if (statsUserIds) accountFilter.userId = { $in: statsUserIds };

    const challengeFilter = { isActive: true, adminId: req.admin._id };
    const totalChallenges = await Challenge.countDocuments(challengeFilter);
    const totalAccounts = await ChallengeAccount.countDocuments(accountFilter);
    const activeAccounts = await ChallengeAccount.countDocuments({ ...accountFilter, status: 'ACTIVE' });
    const passedAccounts = await ChallengeAccount.countDocuments({ ...accountFilter, status: 'PASSED' });
    const failedAccounts = await ChallengeAccount.countDocuments({ ...accountFilter, status: 'FAILED' });
    const fundedAccounts = await ChallengeAccount.countDocuments({ ...accountFilter, status: 'FUNDED' });

    const settings = await PropSettings.getSettings(req.admin._id);

    res.json({
      success: true,
      stats: {
        challengeModeEnabled: settings.challengeModeEnabled,
        totalChallenges,
        totalAccounts,
        activeAccounts,
        passedAccounts,
        failedAccounts,
        fundedAccounts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== USER ROUTES ====================

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const propTradingEngine = require('../services/propTradingEngine');
const JWT_SECRET = process.env.JWT_SECRET || 'BharatFundedTrade-secret-key-2024';

// User auth middleware
async function verifyUserToken(req, res, next) {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// GET /api/prop/status - Public: check if challenge mode enabled
router.get('/status', async (req, res) => {
  try {
    // Check global settings first, then any admin-level settings
    let settings = await PropSettings.findOne({ challengeModeEnabled: true });
    if (!settings) settings = await PropSettings.findOne({});
    res.json({
      success: true,
      enabled: settings?.challengeModeEnabled || false,
      displayName: settings?.displayName || 'Prop Trading Challenge',
      description: settings?.description || ''
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/prop/challenges - Public: list active challenges
router.get('/challenges', async (req, res) => {
  try {
    const challenges = await Challenge.find({ isActive: true })
      .select('name description stepsCount fundSize challengeFee currency rules.maxDailyDrawdownPercent rules.maxOverallDrawdownPercent rules.profitTargetPhase1Percent rules.profitTargetPhase2Percent rules.challengeExpiryDays rules.stopLossMandatory rules.maxLeverage fundedSettings.profitSplitPercent sortOrder')
      .sort({ sortOrder: 1, fundSize: 1 });
    res.json({ success: true, challenges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/prop/buy - User: buy a challenge
router.post('/buy', verifyUserToken, async (req, res) => {
  try {
    const { challengeId } = req.body;
    if (!challengeId) return res.status(400).json({ success: false, message: 'challengeId required' });

    const result = await propTradingEngine.buyChallenge(req.user._id, challengeId);
    res.json({
      success: true,
      message: 'Challenge purchased successfully!',
      account: result.account,
      challenge: { name: result.challenge.name, fundSize: result.challenge.fundSize }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/prop/my-accounts - User: list user's challenge accounts
router.get('/my-accounts', verifyUserToken, async (req, res) => {
  try {
    const accounts = await ChallengeAccount.find({ userId: req.user._id })
      .populate('challengeId', 'name fundSize stepsCount challengeFee fundedSettings.profitSplitPercent rules.maxDailyDrawdownPercent rules.maxOverallDrawdownPercent rules.profitTargetPhase1Percent rules.profitTargetPhase2Percent rules.challengeExpiryDays')
      .sort({ createdAt: -1 });
    res.json({ success: true, accounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/prop/account/:id/dashboard - User: detailed account dashboard
router.get('/account/:id/dashboard', verifyUserToken, async (req, res) => {
  try {
    const dashboard = await propTradingEngine.getAccountDashboard(req.params.id, req.user._id);
    if (!dashboard) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, ...dashboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/prop/validate-trade - User: validate before opening a trade
router.post('/validate-trade', verifyUserToken, async (req, res) => {
  try {
    const { challengeAccountId, symbol, segment, quantity, lots, sl, stopLoss, tp } = req.body;
    if (!challengeAccountId) return res.status(400).json({ success: false, message: 'challengeAccountId required' });

    const result = await propTradingEngine.validateTradeOpen(challengeAccountId, {
      symbol, segment, quantity: quantity || lots, sl, stopLoss, tp
    });

    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.error, code: result.code });
    }
    res.json({ success: true, message: 'Trade allowed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/prop/trade-opened - User: notify that a trade was opened
router.post('/trade-opened', verifyUserToken, async (req, res) => {
  try {
    const { challengeAccountId } = req.body;
    if (!challengeAccountId) return res.status(400).json({ success: false, message: 'challengeAccountId required' });

    const account = await propTradingEngine.onTradeOpened(challengeAccountId);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, tradesToday: account.tradesToday, openTradesCount: account.openTradesCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/prop/trade-closed - User: notify that a trade was closed
router.post('/trade-closed', verifyUserToken, async (req, res) => {
  try {
    const { challengeAccountId, pnl } = req.body;
    if (!challengeAccountId) return res.status(400).json({ success: false, message: 'challengeAccountId required' });

    const result = await propTradingEngine.onTradeClosed(challengeAccountId, Number(pnl) || 0);
    if (!result) return res.status(404).json({ success: false, message: 'Account not found' });

    res.json({
      success: true,
      failed: result.failed || false,
      failReason: result.reason || null,
      phaseCompleted: result.phaseCompleted || false,
      funded: result.funded || false,
      balance: result.account.currentBalance,
      equity: result.account.currentEquity,
      status: result.account.status
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/prop/withdraw - User: request a profit payout. Creates a pending
// Transaction that the admin must approve; nothing moves into the main wallet
// until approval.
router.post('/withdraw', verifyUserToken, async (req, res) => {
  try {
    const { challengeAccountId } = req.body;
    if (!challengeAccountId) return res.status(400).json({ success: false, message: 'challengeAccountId required' });

    const result = await propTradingEngine.withdrawProfit(challengeAccountId, req.user._id);
    res.json({
      success: true,
      pending: true,
      message: `Payout request of ₹${result.requestedAmount.toFixed(2)} submitted for admin approval`,
      transactionId: result.transactionId,
      requestedAmount: result.requestedAmount,
      profit: result.profit,
      splitPercent: result.splitPercent
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ============ ADMIN PAYOUT QUEUE ============
// (Transaction, User, ChallengeAccount already required at the top of the
//  file — reusing those. Don't re-require or Node throws a "const already
//  declared" error at module load and the server refuses to boot.)
const Transaction = require('../models/Transaction');

// GET /api/prop/admin/payouts — list pending prop-payout requests with
// enriched user + challenge-account info so the admin dashboard can show
// KYC badge, cooldown status, profit split, etc.
router.get('/admin/payouts', async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const query = { type: 'withdrawal', 'paymentDetails.kind': 'prop_payout' };
    if (status && status !== 'all') query.status = status;

    const txs = await Transaction.find(query).sort({ createdAt: -1 }).limit(200).lean();

    const enriched = await Promise.all(txs.map(async (tx) => {
      const user = await User.findById(tx.oderId).select('oderId name email kycStatus kycVerified walletINR').lean().catch(() => null);
      const chAccId = tx.paymentDetails?.challengeAccountId;
      let challengeAccount = null;
      if (chAccId) {
        challengeAccount = await ChallengeAccount.findById(chAccId).select('accountId status profitSplitPercent walletBalance currentBalance initialBalance lastWithdrawalDate').lean().catch(() => null);
      }
      return {
        _id: tx._id,
        createdAt: tx.createdAt,
        status: tx.status,
        requestedAmount: tx.amount,
        userNote: tx.userNote,
        user: user ? {
          _id: user._id,
          oderId: user.oderId,
          name: user.name,
          email: user.email,
          kycStatus: user.kycStatus || 'not_submitted',
          kycVerified: !!user.kycVerified,
          walletINRBalance: user.walletINR?.balance || 0
        } : null,
        challengeAccount,
        profit: tx.paymentDetails?.profit,
        splitPercent: tx.paymentDetails?.splitPercent,
        adminNote: tx.adminNote || '',
        rejectionReason: tx.rejectionReason || '',
        processedAt: tx.processedAt
      };
    }));

    res.json({ success: true, payouts: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/prop/admin/payouts/:id/approve
// body: { customAmount?, overrideCooldown?, adminNote? }
// Credits User.walletINR (and wallet.balance for immediate trading) with the
// approved amount and resets the challenge account's walletBalance to
// initialBalance so the next payout cycle starts fresh.
router.post('/admin/payouts/:id/approve', async (req, res) => {
  try {
    const { customAmount, overrideCooldown, adminNote } = req.body || {};
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Payout request not found' });
    if (tx.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request is ${tx.status}` });
    }

    const chAccId = tx.paymentDetails?.challengeAccountId;
    if (!chAccId) return res.status(400).json({ success: false, message: 'Missing challenge account reference' });

    const account = await ChallengeAccount.findById(chAccId);
    if (!account) return res.status(404).json({ success: false, message: 'Challenge account not found' });

    // Cooldown check (bypassable with overrideCooldown flag)
    if (!overrideCooldown && account.lastWithdrawalDate) {
      const Challenge = require('../models/Challenge');
      const challenge = await Challenge.findById(account.challengeId);
      const cooldownDays = challenge?.fundedSettings?.withdrawalFrequencyDays || 0;
      if (cooldownDays > 0) {
        const daysSince = (Date.now() - new Date(account.lastWithdrawalDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < cooldownDays) {
          return res.status(400).json({
            success: false,
            message: `Cooldown not met (${Math.ceil(cooldownDays - daysSince)} more day(s)). Pass overrideCooldown:true to bypass.`
          });
        }
      }
    }

    const amountToPay = Number(customAmount) > 0 ? Number(customAmount) : Number(tx.amount);
    if (!amountToPay || amountToPay <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payout amount' });
    }

    const user = await User.findById(tx.oderId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.walletINR) user.walletINR = { balance: 0, totalDeposits: 0, totalWithdrawals: 0 };
    user.walletINR.balance += amountToPay;
    user.wallet.balance = (user.wallet.balance || 0) + amountToPay;
    user.wallet.equity = (user.wallet.equity || 0) + amountToPay;
    user.wallet.freeMargin = (user.wallet.freeMargin || 0) + amountToPay;
    await user.save();

    // Reset the challenge account's wallet to initial so the next cycle
    // starts fresh. We leave totalWithdrawn + lastWithdrawalDate as a
    // historical record.
    const initial = Number(account.initialBalance) || 0;
    account.walletBalance = initial;
    account.walletEquity = initial;
    account.walletMargin = 0;
    account.walletFreeMargin = initial;
    account.walletMarginLevel = 0;
    account.currentBalance = initial;
    account.currentEquity = initial;
    account.phaseStartBalance = initial;
    account.totalWithdrawn = (Number(account.totalWithdrawn) || 0) + amountToPay;
    account.lastWithdrawalDate = new Date();
    await account.save();

    tx.status = 'approved';
    tx.amount = amountToPay;
    tx.adminNote = adminNote || '';
    tx.processedBy = 'admin';
    tx.processedAt = new Date();
    await tx.save();

    res.json({
      success: true,
      message: `Payout ₹${amountToPay.toFixed(2)} approved and credited`,
      transaction: tx,
      userWalletINRBalance: user.walletINR.balance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/prop/admin/payouts/:id/reject
// body: { reason }
router.post('/admin/payouts/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body || {};
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Payout request not found' });
    if (tx.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request is ${tx.status}` });
    }

    tx.status = 'rejected';
    tx.rejectionReason = String(reason).trim();
    tx.processedBy = 'admin';
    tx.processedAt = new Date();
    await tx.save();

    res.json({ success: true, message: 'Payout request rejected', transaction: tx });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
