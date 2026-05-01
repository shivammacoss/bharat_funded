const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');
const ChallengeAccount = require('../models/ChallengeAccount');
const ChallengePosition = require('../models/ChallengePosition');
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
    const { challengeModeEnabled, displayName, description, termsAndConditions, autoCloseAtMarketClose } = req.body;
    const settings = await PropSettings.updateSettings({
      challengeModeEnabled,
      displayName,
      description,
      termsAndConditions,
      autoCloseAtMarketClose
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
    // Check global settings
    let settings = await PropSettings.findOne({});
    
    // If challengeModeEnabled is explicitly true, use that
    // Otherwise, auto-enable if there are active challenges
    let isEnabled = settings?.challengeModeEnabled === true;
    if (!isEnabled) {
      const activeCount = await Challenge.countDocuments({ isActive: true });
      isEnabled = activeCount > 0;
    }
    
    res.json({
      success: true,
      enabled: isEnabled,
      displayName: settings?.displayName || 'Prop Trading Challenge',
      description: settings?.description || ''
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/prop/challenges - Public: list active challenges. The `tiers`
// array MUST be projected — without it the user sees only the legacy
// single (fundSize, challengeFee) pair and multi-tier admin pricing is
// invisible on the evaluation-plans grid.
router.get('/challenges', async (req, res) => {
  try {
    const challenges = await Challenge.find({ isActive: true })
      .select('name description stepsCount fundSize challengeFee tiers currency rules.maxDailyDrawdownPercent rules.maxOverallDrawdownPercent rules.maxLossPerTradePercent rules.profitTargetPhase1Percent rules.profitTargetPhase2Percent rules.profitTargetInstantPercent rules.maxOneDayProfitPercentOfTarget rules.consistencyRulePercent rules.minTradesRequired rules.maxTradesPerDay rules.minLotSize rules.maxLotSize rules.allowFractionalLots rules.challengeExpiryDays rules.stopLossMandatory rules.takeProfitMandatory rules.allowWeekendHolding rules.allowNewsTrading rules.maxLeverage rules.tradingDaysRequired fundedSettings.profitSplitPercent fundedSettings.withdrawalFrequencyDays sortOrder')
      .sort({ sortOrder: 1, fundSize: 1 });
    res.json({ success: true, challenges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/prop/buy - User: buy a challenge
router.post('/buy', verifyUserToken, async (req, res) => {
  try {
    const { challengeId, tierIndex } = req.body;
    if (!challengeId) return res.status(400).json({ success: false, message: 'challengeId required' });

    const result = await propTradingEngine.buyChallenge(
      req.user._id,
      challengeId,
      Number.isInteger(tierIndex) ? tierIndex : (tierIndex != null ? Number(tierIndex) : undefined)
    );
    res.json({
      success: true,
      message: 'Challenge purchased successfully!',
      account: result.account,
      challenge: { name: result.challenge.name, fundSize: result.account.initialBalance }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/prop/my-accounts - User: list user's challenge accounts
router.get('/my-accounts', verifyUserToken, async (req, res) => {
  try {
    const accounts = await ChallengeAccount.find({ userId: req.user._id })
      .populate('challengeId', 'name fundSize stepsCount challengeFee fundedSettings.profitSplitPercent rules.maxDailyDrawdownPercent rules.maxOverallDrawdownPercent rules.profitTargetPhase1Percent rules.profitTargetPhase2Percent rules.challengeExpiryDays rules.minLotSize rules.maxLotSize rules.allowFractionalLots')
      .sort({ createdAt: -1 })
      .lean();

    // Attach live open-position summary + floating P&L so the card can show
    // real-time values instead of only the stored close-time balance.
    const ids = accounts.map(a => a._id);
    const openPositions = await ChallengePosition.find({
      challengeAccountId: { $in: ids },
      status: 'open'
    }).lean();
    const byAccount = {};
    for (const pos of openPositions) {
      const key = String(pos.challengeAccountId);
      if (!byAccount[key]) byAccount[key] = { positions: [], floatingPnl: 0, openCount: 0 };
      byAccount[key].positions.push(pos);
      byAccount[key].floatingPnl += Number(pos.profit) || 0;
      byAccount[key].openCount += 1;
    }

    const enriched = accounts.map(a => {
      const live = byAccount[String(a._id)] || { positions: [], floatingPnl: 0, openCount: 0 };
      const balance = Number(a.walletBalance || a.currentBalance || 0);
      const liveEquity = balance + live.floatingPnl;
      const realisedPnl = balance - Number(a.initialBalance || 0);
      const totalPnl = realisedPnl + live.floatingPnl;
      return {
        ...a,
        openPositions: live.positions,
        openCount: live.openCount,
        floatingPnl: live.floatingPnl,
        liveEquity,
        realisedPnl,
        totalPnl
      };
    });

    res.json({ success: true, accounts: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/prop/my-positions - ALL positions for this user across every
// challenge account, normalised into trade-history shape so OrdersPage
// can render them alongside main-wallet trades with an Account column.
router.get('/my-positions', verifyUserToken, async (req, res) => {
  try {
    const accounts = await ChallengeAccount.find({ userId: req.user._id })
      .select('_id accountId challengeId')
      .populate('challengeId', 'name')
      .lean();
    const accMap = {};
    for (const a of accounts) {
      accMap[String(a._id)] = {
        accountId: a.accountId,
        challengeName: a.challengeId?.name || 'Challenge'
      };
    }
    const ids = accounts.map(a => a._id);
    if (ids.length === 0) return res.json({ success: true, open: [], closed: [] });

    const [open, closed] = await Promise.all([
      ChallengePosition.find({ challengeAccountId: { $in: ids }, status: 'open' })
        .sort({ openTime: -1 }).lean(),
      ChallengePosition.find({ challengeAccountId: { $in: ids }, status: 'closed' })
        .sort({ closeTime: -1 }).limit(200).lean()
    ]);

    const annotate = (p) => {
      const meta = accMap[String(p.challengeAccountId)] || {};
      return {
        ...p,
        accountContext: 'challenge',
        challengeAccountId: String(p.challengeAccountId),
        challengeAccountCode: meta.accountId,
        challengeName: meta.challengeName
      };
    };

    res.json({ success: true, open: open.map(annotate), closed: closed.map(annotate) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/prop/accounts/:id/positions - list open + recent closed positions
router.get('/accounts/:id/positions', verifyUserToken, async (req, res) => {
  try {
    const account = await ChallengeAccount.findOne({ _id: req.params.id, userId: req.user._id });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    const [open, closed] = await Promise.all([
      ChallengePosition.find({ challengeAccountId: account._id, status: 'open' }).sort({ openTime: -1 }).lean(),
      ChallengePosition.find({ challengeAccountId: account._id, status: 'closed' }).sort({ closeTime: -1 }).limit(50).lean()
    ]);

    res.json({ success: true, open, closed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/prop/account/:id/insights - rich analytics payload for the
// detail dashboard: equity curve (reconstructed from realised closed-
// position PnL), per-day breakdown for the calendar/summary, open +
// closed positions, and performance metrics (win rate, profit factor,
// expectancy, avg RRR, Sharpe, avg duration).
//
// All series are derived from existing ChallengePosition + ChallengeAccount
// data — no new schema fields, no background job. The client polls every
// 10–15s so numbers stay fresh as trades open/close.
router.get('/account/:id/insights', verifyUserToken, async (req, res) => {
  try {
    const account = await ChallengeAccount.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('challengeId');
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    const challenge = account.challengeId || {};
    const rules = challenge.rules || {};

    const [openRaw, closedRaw] = await Promise.all([
      ChallengePosition.find({ challengeAccountId: account._id, status: 'open' })
        .sort({ openTime: -1 })
        .lean(),
      ChallengePosition.find({ challengeAccountId: account._id, status: 'closed' })
        .sort({ closeTime: 1 }) // ascending for equity-curve accumulation
        .lean()
    ]);

    const initialBalance = Number(account.initialBalance) || 0;
    // Use walletBalance (live sub-wallet, same source as my-accounts card)
    // and fall back to currentBalance for legacy accounts.
    const currentBalance = Number(account.walletBalance || account.currentBalance) || initialBalance;
    // Recalculate equity from balance + open-position floating PnL so it
    // always matches the card view (which does the same arithmetic).
    const unrealizedPnl = Number(
      openRaw.reduce((sum, p) => sum + (Number(p.profit) || 0), 0)
    );
    const currentEquity = currentBalance + unrealizedPnl;

    // ── Equity curve: start at initialBalance, apply each closed
    // position's realised PnL in order. Final point == currentBalance
    // (sanity check).
    const equityCurve = [
      { t: account.createdAt || new Date(), equity: initialBalance }
    ];
    let running = initialBalance;
    for (const p of closedRaw) {
      running += Number(p.profit) || 0;
      equityCurve.push({
        t: p.closeTime || p.updatedAt || new Date(),
        equity: Number(running.toFixed(2))
      });
    }
    // Tail point: live equity (balance + floating). Only add if distinct
    // from the last anchor so we don't stutter the line.
    if (equityCurve[equityCurve.length - 1].equity !== currentEquity) {
      equityCurve.push({ t: new Date(), equity: Number(currentEquity.toFixed(2)) });
    }

    // ── Daily breakdown: group closed positions by close-date (ISO
    // YYYY-MM-DD in UTC for stable keys; the client formats to local).
    const dailyMap = new Map();
    for (const p of closedRaw) {
      if (!p.closeTime) continue;
      const key = new Date(p.closeTime).toISOString().slice(0, 10);
      if (!dailyMap.has(key)) {
        dailyMap.set(key, { date: key, pnl: 0, trades: 0, wins: 0, losses: 0, volume: 0 });
      }
      const d = dailyMap.get(key);
      const profit = Number(p.profit) || 0;
      d.pnl += profit;
      d.trades += 1;
      if (profit > 0) d.wins += 1;
      else if (profit < 0) d.losses += 1;
      d.volume += Number(p.volume) || 0;
    }
    const dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // ── Today's PnL: today's closed-position realised PnL + current
    // floating PnL. "Today" is the server-local calendar day.
    const todayKey = new Date().toISOString().slice(0, 10);
    const todaysClosedPnl = dailyMap.get(todayKey)?.pnl || 0;
    const todaysPnl = todaysClosedPnl + unrealizedPnl;

    // ── Performance metrics. Only closed positions feed these (open
    // positions have floating, not realised, results).
    const totalClosed = closedRaw.length;
    const wins = closedRaw.filter(p => (p.profit || 0) > 0);
    const losses = closedRaw.filter(p => (p.profit || 0) < 0);
    const grossProfit = wins.reduce((s, p) => s + (p.profit || 0), 0);
    const grossLoss = Math.abs(losses.reduce((s, p) => s + (p.profit || 0), 0));
    const avgWin = wins.length ? grossProfit / wins.length : 0;
    const avgLoss = losses.length ? grossLoss / losses.length : 0;
    const winRate = totalClosed ? (wins.length / totalClosed) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0);
    const expectancy = totalClosed
      ? (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss
      : 0;

    // Average trade duration (seconds) over closed positions.
    let avgDurationSec = 0;
    if (totalClosed > 0) {
      let totalMs = 0;
      let counted = 0;
      for (const p of closedRaw) {
        if (p.openTime && p.closeTime) {
          totalMs += new Date(p.closeTime) - new Date(p.openTime);
          counted += 1;
        }
      }
      avgDurationSec = counted > 0 ? Math.round(totalMs / counted / 1000) : 0;
    }

    // Average RRR: for positions that had both SL + TP set at open, the
    // nominal R:R is |TP-entry| / |entry-SL|. Positions without both are
    // skipped so the metric isn't skewed by empty fields.
    let avgRRR = 0;
    {
      const rrrs = [];
      for (const p of closedRaw) {
        const entry = Number(p.entryPrice);
        const sl = Number(p.stopLoss);
        const tp = Number(p.takeProfit);
        if (entry > 0 && sl > 0 && tp > 0) {
          const risk = Math.abs(entry - sl);
          const reward = Math.abs(tp - entry);
          if (risk > 0) rrrs.push(reward / risk);
        }
      }
      if (rrrs.length) avgRRR = rrrs.reduce((s, x) => s + x, 0) / rrrs.length;
    }

    // Annualised Sharpe ratio from daily returns vs initial balance.
    // Needs ≥ 2 distinct trading days to be meaningful.
    let sharpe = 0;
    if (dailyBreakdown.length >= 2 && initialBalance > 0) {
      const dailyReturns = dailyBreakdown.map(d => d.pnl / initialBalance);
      const mean = dailyReturns.reduce((s, x) => s + x, 0) / dailyReturns.length;
      const variance =
        dailyReturns.reduce((s, x) => s + (x - mean) ** 2, 0) / dailyReturns.length;
      const stdDev = Math.sqrt(variance);
      if (stdDev > 0) sharpe = (mean / stdDev) * Math.sqrt(252);
    }

    // ── Consistency score: the biggest single-day profit shouldn't
    // dominate total profit. Score = 100 × (1 − bestDay/totalProfit),
    // clamped to [0, 100]. Only defined if totalProfit > 0.
    let consistencyScore = null;
    let consistencyDaysTraded = dailyBreakdown.length;
    {
      const totalProfit = dailyBreakdown.reduce((s, d) => s + Math.max(0, d.pnl), 0);
      if (totalProfit > 0) {
        const best = dailyBreakdown.reduce((m, d) => Math.max(m, d.pnl), 0);
        const ratio = best / totalProfit;
        consistencyScore = Math.max(0, Math.min(100, Math.round((1 - ratio) * 100)));
      }
    }

    // ── Objectives table: the public, per-challenge gates a user must
    // clear to pass / avoid failing. Each entry is self-describing so the
    // UI can render it directly.
    const dailyMax = Number(rules.maxDailyDrawdownPercent || 5);
    const overallMax = Number(rules.maxOverallDrawdownPercent || 10);
    const tradingDaysRequired = Number(rules.tradingDaysRequired || 0);
    const targetPercent = challenge.stepsCount === 0
      ? Number(rules.profitTargetInstantPercent || 0)
      : account.currentPhase === 1
        ? Number(rules.profitTargetPhase1Percent || 8)
        : Number(rules.profitTargetPhase2Percent || 5);
    const dailyUsed = Number(account.currentDailyDrawdownPercent || 0);
    const overallUsed = Number(account.currentOverallDrawdownPercent || 0);
    const profitPercent = Number(account.currentProfitPercent || 0);

    const pctAmount = (pct) => Number(((pct / 100) * initialBalance).toFixed(2));

    const objectives = [];
    if (tradingDaysRequired > 0) {
      objectives.push({
        key: 'trading-days',
        label: `Minimum ${tradingDaysRequired} Trading Day${tradingDaysRequired === 1 ? '' : 's'}`,
        target: tradingDaysRequired,
        actual: Number(account.tradingDaysCount || 0),
        unit: 'days',
        passed: Number(account.tradingDaysCount || 0) >= tradingDaysRequired
      });
    }
    objectives.push({
      key: 'max-daily-loss',
      label: `Max Daily Loss −₹${pctAmount(dailyMax).toLocaleString('en-IN')}`,
      target: dailyMax,
      actual: dailyUsed,
      unit: '%',
      passed: dailyUsed < dailyMax
    });
    objectives.push({
      key: 'max-loss',
      label: `Max Loss −₹${pctAmount(overallMax).toLocaleString('en-IN')}`,
      target: overallMax,
      actual: overallUsed,
      unit: '%',
      passed: overallUsed < overallMax
    });
    if (account.accountType !== 'FUNDED' && targetPercent > 0) {
      objectives.push({
        key: 'profit-target',
        label: `Profit Target ₹${pctAmount(targetPercent).toLocaleString('en-IN')}`,
        target: targetPercent,
        actual: profitPercent,
        unit: '%',
        passed: profitPercent >= targetPercent
      });
    }

    // Max one-day profit objective
    const maxOneDayCap = Number(rules.maxOneDayProfitPercentOfTarget || 0);
    if (maxOneDayCap > 0 && targetPercent > 0) {
      const maxDayProfitAbs = (maxOneDayCap / 100) * (targetPercent / 100) * initialBalance;
      const dailyPnlMap = account.dailyPnlMap || new Map();
      let bestDayPnl = 0;
      for (const [, pnl] of dailyPnlMap) {
        if (pnl > bestDayPnl) bestDayPnl = pnl;
      }
      objectives.push({
        key: 'max-one-day-profit',
        label: `Max One-Day Profit ₹${maxDayProfitAbs.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
        target: maxOneDayCap,
        actual: maxDayProfitAbs > 0 ? Number(((bestDayPnl / maxDayProfitAbs) * 100).toFixed(1)) : 0,
        unit: '% used',
        passed: bestDayPnl <= maxDayProfitAbs
      });
    }

    // Consistency rule objective
    const consistencyLimit = Number(rules.consistencyRulePercent || 0);
    if (consistencyLimit > 0) {
      const dailyPnlMap = account.dailyPnlMap || new Map();
      let totalProfit = 0, bestDay = 0;
      for (const [, pnl] of dailyPnlMap) {
        if (pnl > 0) { totalProfit += pnl; if (pnl > bestDay) bestDay = pnl; }
      }
      const bestRatio = totalProfit > 0 ? (bestDay / totalProfit) * 100 : 0;
      objectives.push({
        key: 'consistency',
        label: `Consistency (no day > ${consistencyLimit}% of total profit)`,
        target: consistencyLimit,
        actual: Number(bestRatio.toFixed(1)),
        unit: '%',
        passed: totalProfit <= 0 || bestRatio <= consistencyLimit
      });
    }

    res.json({
      success: true,
      overview: {
        balance: Number(currentBalance.toFixed(2)),
        equity: Number(currentEquity.toFixed(2)),
        unrealizedPnl: Number(unrealizedPnl.toFixed(2)),
        todaysPnl: Number(todaysPnl.toFixed(2)),
        initialBalance: Number(initialBalance.toFixed(2)),
        totalPnl: Number((currentEquity - initialBalance).toFixed(2)),
        totalPnlPercent: initialBalance > 0
          ? Number((((currentEquity - initialBalance) / initialBalance) * 100).toFixed(2))
          : 0
      },
      objectives,
      stats: {
        winRate: Number(winRate.toFixed(2)),
        avgProfit: Number(avgWin.toFixed(2)),
        avgLoss: Number(avgLoss.toFixed(2)),
        numTrades: totalClosed,
        avgDurationSec,
        sharpe: Number(sharpe.toFixed(2)),
        avgRRR: Number(avgRRR.toFixed(2)),
        profitFactor: Number.isFinite(profitFactor) ? Number(profitFactor.toFixed(2)) : 999,
        expectancy: Number(expectancy.toFixed(2))
      },
      consistency: {
        score: consistencyScore,
        daysTraded: consistencyDaysTraded
      },
      equityCurve,
      dailyBreakdown,
      openTrades: openRaw,
      closedTrades: closedRaw.slice(-100).reverse(), // latest 100, newest first
      meta: {
        challengeName: challenge.name || 'Challenge',
        fundSize: Number(challenge.fundSize) || initialBalance,
        stepsCount: challenge.stepsCount || account.totalPhases || 2,
        currency: challenge.currency || 'INR',
        status: account.status,
        phase: account.currentPhase,
        totalPhases: account.totalPhases,
        createdAt: account.createdAt,
        expiresAt: account.expiresAt
      }
    });
  } catch (error) {
    console.error('[/account/:id/insights] error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/prop/positions/:positionId/sltp - modify SL/TP on an open
// challenge position. Pass `stopLoss` and/or `takeProfit` in the body;
// set to null/0 to clear. Values are stored as-is and evaluated on the
// next tick by challengePropEngine.refreshEquity().
router.put('/positions/:positionId/sltp', verifyUserToken, async (req, res) => {
  try {
    const { stopLoss, takeProfit } = req.body;
    const normalise = (v) => {
      if (v === null || v === undefined || v === '') return null;
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0) return null;
      return n;
    };
    const hasSL = Object.prototype.hasOwnProperty.call(req.body, 'stopLoss');
    const hasTP = Object.prototype.hasOwnProperty.call(req.body, 'takeProfit');
    if (!hasSL && !hasTP) {
      return res.status(400).json({ success: false, message: 'Provide stopLoss and/or takeProfit' });
    }

    const position = await ChallengePosition.findOne({
      positionId: req.params.positionId,
      userId: req.user._id,
      status: 'open'
    });
    if (!position) {
      return res.status(404).json({ success: false, message: 'Position not found or already closed' });
    }

    if (hasSL) position.stopLoss = normalise(stopLoss);
    if (hasTP) position.takeProfit = normalise(takeProfit);
    await position.save();

    try {
      const io = req.app.get('io');
      if (io) {
        io.to(String(req.user._id)).emit('challengePositionUpdate', {
          challengeAccountId: position.challengeAccountId,
          positionId: position.positionId,
          stopLoss: position.stopLoss,
          takeProfit: position.takeProfit
        });
      }
    } catch (_) { /* io optional */ }

    res.json({ success: true, position });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/prop/positions/:positionId/close - close a challenge position
router.post('/positions/:positionId/close', verifyUserToken, async (req, res) => {
  try {
    const { closePrice } = req.body;
    if (!closePrice || Number(closePrice) <= 0) {
      return res.status(400).json({ success: false, message: 'closePrice required' });
    }

    const position = await ChallengePosition.findOne({
      positionId: req.params.positionId,
      userId: req.user._id,
      status: 'open'
    });
    if (!position) return res.status(404).json({ success: false, message: 'Position not found or already closed' });

    const challengePropEngine = require('../services/challengePropEngine.service');
    const result = await challengePropEngine.closePosition(req.params.positionId, Number(closePrice), 'user');
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    // Broadcast account update so other tabs / pages refresh.
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(String(req.user._id)).emit('challengeAccountUpdate', {
          challengeAccountId: position.challengeAccountId,
          account: result.account,
          closedPosition: result.position
        });
      }
    } catch (_) { /* io optional */ }

    res.json({
      success: true,
      position: result.position,
      account: result.account,
      failed: result.failed,
      phaseCompleted: result.phaseCompleted,
      funded: result.funded
    });
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
