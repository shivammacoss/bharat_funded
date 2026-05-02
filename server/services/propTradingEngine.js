const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
const ChallengeAccount = require('../models/ChallengeAccount');
const PropSettings = require('../models/PropSettings');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const ibCouponService = require('./ibCoupon.service');

const ERROR_CODES = {
  CHALLENGE_MODE_DISABLED: 'CHALLENGE_MODE_DISABLED',
  CHALLENGE_NOT_FOUND: 'CHALLENGE_NOT_FOUND',
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  ACCOUNT_NOT_ACTIVE: 'ACCOUNT_NOT_ACTIVE',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  STOP_LOSS_REQUIRED: 'STOP_LOSS_REQUIRED',
  MAX_TRADES_PER_DAY: 'MAX_TRADES_PER_DAY',
  MAX_CONCURRENT_TRADES: 'MAX_CONCURRENT_TRADES',
  LOT_SIZE_VIOLATION: 'LOT_SIZE_VIOLATION',
  SYMBOL_NOT_ALLOWED: 'SYMBOL_NOT_ALLOWED',
  SEGMENT_NOT_ALLOWED: 'SEGMENT_NOT_ALLOWED',
  MIN_HOLD_TIME: 'MIN_HOLD_TIME',
  DAILY_DRAWDOWN_BREACH: 'DAILY_DRAWDOWN_BREACH',
  OVERALL_DRAWDOWN_BREACH: 'OVERALL_DRAWDOWN_BREACH',
  EXPIRED: 'EXPIRED',
  MAX_LEVERAGE_EXCEEDED: 'MAX_LEVERAGE_EXCEEDED',
  TAKE_PROFIT_REQUIRED: 'TAKE_PROFIT_REQUIRED',
  MAX_TOTAL_TRADES: 'MAX_TOTAL_TRADES',
  MIN_TRADES_NOT_MET: 'MIN_TRADES_NOT_MET',
  TRADING_DAYS_NOT_MET: 'TRADING_DAYS_NOT_MET',
  MAX_ONE_DAY_PROFIT: 'MAX_ONE_DAY_PROFIT',
  CONSISTENCY_RULE: 'CONSISTENCY_RULE'
};

class PropTradingEngine {
  constructor() {
    this.ERROR_CODES = ERROR_CODES;
  }

  /**
   * Check if challenge mode is enabled for an admin
   */
  async isChallengeEnabled(adminId) {
    const settings = await PropSettings.getSettings(adminId || null);
    return settings?.challengeModeEnabled === true;
  }

  /**
   * Compute challenge expiry date
   */
  computeExpiresAt(challenge) {
    const expiresAt = new Date();
    const expiryDays = challenge.rules?.challengeExpiryDays;
    if (challenge.stepsCount === 0 && !expiryDays) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 50); // instant fund = no expiry
    } else {
      const n = Number(expiryDays);
      expiresAt.setDate(expiresAt.getDate() + (Number.isFinite(n) && n > 0 ? n : 30));
    }
    return expiresAt;
  }

  /**
   * Buy challenge — deduct from wallet and create ChallengeAccount.
   * Optionally applies an IB coupon to discount the fee and credit the
   * IB's wallet with the configured commission percentage.
   */
  async buyChallenge(userId, challengeId, tierIndex, couponCode = null) {
    const challenge = await Challenge.findById(challengeId);
    if (!challenge || !challenge.isActive) {
      throw new Error('Challenge not found or inactive');
    }

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Check if challenge mode is enabled
    const enabled = await this.isChallengeEnabled(challenge.adminId);
    if (!enabled) throw new Error('Challenge mode is currently disabled');

    // Resolve the (fundSize, fee) pair the user is buying. Prefer the picked
    // tier; fall back to the legacy single fundSize/fee if the challenge has
    // no tiers or no tierIndex was sent.
    let fundSize, challengeFee;
    if (Array.isArray(challenge.tiers) && challenge.tiers.length > 0) {
      const idx = Number.isInteger(tierIndex) ? tierIndex : 0;
      if (idx < 0 || idx >= challenge.tiers.length) {
        throw new Error('Invalid tier selection');
      }
      const tier = challenge.tiers[idx];
      fundSize = Number(tier.fundSize);
      challengeFee = Number(tier.challengeFee);
    } else {
      fundSize = Number(challenge.fundSize);
      challengeFee = Number(challenge.challengeFee);
    }
    if (!(fundSize > 0) || !(challengeFee >= 0)) {
      throw new Error('Challenge pricing is misconfigured');
    }

    const originalFee = challengeFee;

    // Apply IB coupon if provided. Throws on any invalid state — message
    // is bubbled straight to the API response.
    let couponContext = null;
    let reservedCouponId = null;
    if (couponCode) {
      // 1) Read-only pre-flight validation (self-redemption, expiry,
      //    suspended IB, etc).
      couponContext = await ibCouponService.validateCouponForPurchase(couponCode, userId, originalFee);
      // 2) Atomically reserve a redemption slot. This is the cap-safety
      //    gate — concurrent buyers (e.g. user double-clicks Buy) cannot
      //    both pass this step.
      const reserved = await ibCouponService.reserveCouponSlot(couponCode);
      reservedCouponId = reserved._id;
      // Refresh context with the post-increment doc so couponSnapshot
      // reflects the actual count after this redemption.
      couponContext.coupon = reserved;
      challengeFee = couponContext.finalFee;
    }

    try {
      // Check user's wallet balance (stored on User.wallet embedded field)
      const userBalance = Number(user.wallet?.balance) || 0;
      if (userBalance < challengeFee) {
        throw new Error(`Insufficient balance. Need ₹${challengeFee}, available: ₹${userBalance.toFixed(2)}`);
      }

      // Deduct (discounted) fee from user's wallet
      user.wallet.balance = userBalance - challengeFee;
      await user.save();
    } catch (err) {
      // Roll back the reserved slot so the cap is intact for the next
      // buyer.
      if (reservedCouponId) {
        try { await ibCouponService.releaseCouponSlot(reservedCouponId); } catch (e) { /* swallow */ }
      }
      throw err;
    }

    // From here on, any failure must release the coupon slot reserved above
    // AND refund the user's wallet (we already debited it).
    let account;
    let couponResult = null;
    try {
    // Create challenge account
    const accountId = await ChallengeAccount.generateAccountId('CH');
    const totalPhases = challenge.stepsCount === 0 ? 0 : challenge.stepsCount;
    const expiresAt = this.computeExpiresAt(challenge);

    // Instant (0-step) with a configured profit target must go through
    // evaluation (ACTIVE) before becoming FUNDED.  Only skip to FUNDED
    // if no target is set (legacy instant-fund behaviour).
    const hasInstantTarget = challenge.stepsCount === 0
      && Number(challenge.rules?.profitTargetInstantPercent) > 0;
    const instantStatus = hasInstantTarget ? 'ACTIVE' : 'FUNDED';

    account = await ChallengeAccount.create({
      userId,
      challengeId: challenge._id,
      accountId,
      accountType: 'CHALLENGE',
      currentPhase: challenge.stepsCount === 0 ? 0 : 1,
      totalPhases,
      status: challenge.stepsCount === 0 ? instantStatus : 'ACTIVE',
      initialBalance: fundSize,
      currentBalance: fundSize,
      currentEquity: fundSize,
      phaseStartBalance: fundSize,
      dayStartEquity: fundSize,
      lowestEquityToday: fundSize,
      lowestEquityOverall: fundSize,
      highestEquity: fundSize,
      // Isolated sub-wallet — virtual money that the user trades on.
      walletBalance: fundSize,
      walletEquity: fundSize,
      walletCredit: 0,
      walletMargin: 0,
      walletFreeMargin: fundSize,
      walletMarginLevel: 0,
      profitSplitPercent: challenge.fundedSettings?.profitSplitPercent || 80,
      paymentStatus: 'COMPLETED',
      expiresAt
    });

    // If a coupon was applied, record the redemption: create the
    // IBCommission ledger row, credit the IB's wallet, and snapshot the
    // full coupon state onto the ChallengeAccount for audit.
    if (couponContext) {
      const commission = await ibCouponService.redeemCoupon({
        ib: couponContext.ib,
        coupon: couponContext.coupon,
        challengeAccount: account,
        buyerUserId: userId,
        originalFee: couponContext.originalFee,
        discountAmount: couponContext.discountAmount,
        finalFee: couponContext.finalFee,
        commissionAmount: couponContext.commissionAmount
      });
      account.couponSnapshot = {
        code: couponContext.coupon.code,
        ibId: couponContext.ib._id,
        ibUserId: couponContext.ib.userId,
        discountPercent: couponContext.discountPercent,
        originalFee: couponContext.originalFee,
        discountAmount: couponContext.discountAmount,
        finalFee: couponContext.finalFee,
        challengePurchaseCommissionPercent: couponContext.commissionPercent,
        ibCommissionAmount: couponContext.commissionAmount,
        ibCommissionId: commission._id,
        redeemedAt: new Date()
      };
      await account.save();

      couponResult = {
        applied: true,
        code: couponContext.coupon.code,
        discountPercent: couponContext.discountPercent,
        originalFee: couponContext.originalFee,
        discountAmount: couponContext.discountAmount,
        finalFee: couponContext.finalFee,
        ibCommissionAmount: couponContext.commissionAmount
      };
    }
    } catch (err) {
      // Rollback: refund wallet, release coupon slot, drop the partial
      // ChallengeAccount if it was created.
      try {
        const u = await User.findById(userId);
        if (u) {
          u.wallet.balance = (Number(u.wallet?.balance) || 0) + Number(challengeFee);
          await u.save();
        }
      } catch (e) { /* swallow */ }
      if (reservedCouponId) {
        try { await ibCouponService.releaseCouponSlot(reservedCouponId); } catch (e) { /* swallow */ }
      }
      if (account && account._id) {
        try { await ChallengeAccount.deleteOne({ _id: account._id }); } catch (e) { /* swallow */ }
      }
      throw err;
    }

    return { account, challenge, coupon: couponResult };
  }

  /**
   * Request a challenge purchase via direct UPI payment.
   *
   * The user pays admin's UPI externally and submits the txn reference +
   * screenshot through the buy-request modal. We:
   *   1. validate the challenge + tier + (optional) coupon (read-only)
   *   2. reserve the coupon slot atomically (so cap can't overflow even
   *      under double-submit) — released on rejection
   *   3. create a ChallengeAccount in PENDING / PAYMENT_PENDING state
   *      (wallet sub-fields populated so activation is just a status flip)
   *   4. create a Transaction (type='challenge_purchase', status='pending')
   *      that is what the admin sees in the Bank & Fund Management →
   *      Challenge Buys queue
   * No money is moved. The user's main wallet is never touched.
   */
  async requestChallengeBuy(userId, { challengeId, tierIndex, couponCode, paymentProof }) {
    const Transaction = require('../models/Transaction');

    if (!paymentProof || !paymentProof.adminUpiId || !paymentProof.transactionRef) {
      throw new Error('Admin UPI ID and transaction reference are required');
    }

    const challenge = await Challenge.findById(challengeId);
    if (!challenge || !challenge.isActive) {
      throw new Error('Challenge not found or inactive');
    }
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const enabled = await this.isChallengeEnabled(challenge.adminId);
    if (!enabled) throw new Error('Challenge mode is currently disabled');

    // Resolve tier
    let fundSize, challengeFee;
    if (Array.isArray(challenge.tiers) && challenge.tiers.length > 0) {
      const idx = Number.isInteger(tierIndex) ? tierIndex : 0;
      if (idx < 0 || idx >= challenge.tiers.length) throw new Error('Invalid tier selection');
      const tier = challenge.tiers[idx];
      fundSize = Number(tier.fundSize);
      challengeFee = Number(tier.challengeFee);
    } else {
      fundSize = Number(challenge.fundSize);
      challengeFee = Number(challenge.challengeFee);
    }
    if (!(fundSize > 0) || !(challengeFee >= 0)) {
      throw new Error('Challenge pricing is misconfigured');
    }

    const originalFee = challengeFee;
    let couponContext = null;
    let reservedCouponId = null;
    if (couponCode) {
      couponContext = await ibCouponService.validateCouponForPurchase(couponCode, userId, originalFee);
      const reserved = await ibCouponService.reserveCouponSlot(couponCode);
      reservedCouponId = reserved._id;
      couponContext.coupon = reserved;
      challengeFee = couponContext.finalFee;
    }

    let account = null;
    let tx = null;
    try {
      // Pre-populate the challenge account so activation is just a status flip.
      const accountId = await ChallengeAccount.generateAccountId('CH');
      const totalPhases = challenge.stepsCount === 0 ? 0 : challenge.stepsCount;

      account = await ChallengeAccount.create({
        userId,
        challengeId: challenge._id,
        accountId,
        accountType: 'CHALLENGE',
        currentPhase: challenge.stepsCount === 0 ? 0 : 1,
        totalPhases,
        status: 'PENDING',
        initialBalance: fundSize,
        currentBalance: fundSize,
        currentEquity: fundSize,
        phaseStartBalance: fundSize,
        dayStartEquity: fundSize,
        lowestEquityToday: fundSize,
        lowestEquityOverall: fundSize,
        highestEquity: fundSize,
        walletBalance: fundSize,
        walletEquity: fundSize,
        walletCredit: 0,
        walletMargin: 0,
        walletFreeMargin: fundSize,
        walletMarginLevel: 0,
        profitSplitPercent: challenge.fundedSettings?.profitSplitPercent || 80,
        paymentStatus: 'PAYMENT_PENDING',
        expiresAt: null
      });

      tx = await Transaction.create({
        oderId: user.oderId,
        type: 'challenge_purchase',
        amount: challengeFee,
        currency: 'INR',
        paymentMethod: 'upi',
        paymentDetails: {
          upiId: String(paymentProof.adminUpiId).trim(),
          referenceNumber: String(paymentProof.transactionRef).trim()
        },
        proofImage: paymentProof.screenshotBase64 || '',
        status: 'pending',
        userName: user.name || '',
        userNote: String(paymentProof.note || '').slice(0, 500),
        challengePurchaseInfo: {
          challengeId: challenge._id,
          challengeAccountId: account._id,
          challengeName: challenge.name || '',
          tierIndex: Number.isInteger(tierIndex) ? tierIndex : 0,
          fundSize,
          originalFee,
          finalFee: challengeFee,
          couponCode: couponContext ? couponContext.coupon.code : null,
          couponDiscountAmount: couponContext ? couponContext.discountAmount : 0,
          ibCouponId: couponContext ? couponContext.coupon._id : null
        }
      });

      account.pendingPurchaseTransactionId = tx._id;
      await account.save();

      return {
        account,
        transaction: tx,
        coupon: couponContext ? {
          applied: true,
          code: couponContext.coupon.code,
          discountPercent: couponContext.discountPercent,
          originalFee: couponContext.originalFee,
          discountAmount: couponContext.discountAmount,
          finalFee: couponContext.finalFee
        } : null
      };
    } catch (err) {
      // Rollback: release coupon slot, drop the partial account / tx.
      if (reservedCouponId) {
        try { await ibCouponService.releaseCouponSlot(reservedCouponId); } catch (e) { /* swallow */ }
      }
      if (account?._id) {
        try { await ChallengeAccount.deleteOne({ _id: account._id }); } catch (e) { /* swallow */ }
      }
      if (tx?._id) {
        try { await Transaction.deleteOne({ _id: tx._id }); } catch (e) { /* swallow */ }
      }
      throw err;
    }
  }

  /**
   * Validate trade open request against challenge rules
   */
  async validateTradeOpen(challengeAccountId, tradeParams) {
    const account = await ChallengeAccount.findById(challengeAccountId).populate('challengeId');
    if (!account) {
      return { valid: false, error: 'Challenge account not found', code: ERROR_CODES.ACCOUNT_NOT_FOUND };
    }
    if (account.status !== 'ACTIVE' && account.status !== 'FUNDED') {
      return { valid: false, error: `Account is ${account.status}`, code: ERROR_CODES.ACCOUNT_NOT_ACTIVE };
    }

    // Check expiry
    if (account.expiresAt && new Date() > new Date(account.expiresAt)) {
      account.status = 'EXPIRED';
      await account.save();
      return { valid: false, error: 'Challenge has expired', code: ERROR_CODES.EXPIRED };
    }

    const challenge = account.challengeId;
    const rules = challenge.rules || {};

    // SL / TP are optional on all challenges — users can trade without them.
    // (The schema keeps stopLossMandatory / takeProfitMandatory for historical
    // data compatibility but the validator no longer enforces them.)

    // Max leverage
    if (rules.maxLeverage && tradeParams.leverage && Number(tradeParams.leverage) > Number(rules.maxLeverage)) {
      return { valid: false, error: `Leverage ${tradeParams.leverage}x exceeds max ${rules.maxLeverage}x`, code: ERROR_CODES.MAX_LEVERAGE_EXCEEDED };
    }

    // Max trades per day
    if (rules.maxTradesPerDay && account.tradesToday >= rules.maxTradesPerDay) {
      return { valid: false, error: `Max ${rules.maxTradesPerDay} trades per day reached`, code: ERROR_CODES.MAX_TRADES_PER_DAY };
    }

    // Max total trades over the lifetime of the account
    if (rules.maxTotalTrades && account.totalTrades >= rules.maxTotalTrades) {
      return { valid: false, error: `Max total ${rules.maxTotalTrades} trades reached`, code: ERROR_CODES.MAX_TOTAL_TRADES };
    }

    // Max concurrent trades
    if (rules.maxConcurrentTrades && account.openTradesCount >= rules.maxConcurrentTrades) {
      return { valid: false, error: `Max ${rules.maxConcurrentTrades} concurrent trades reached`, code: ERROR_CODES.MAX_CONCURRENT_TRADES };
    }

    // Lot size validation
    const qty = tradeParams.quantity || tradeParams.lots;
    if (rules.minLotSize && qty < rules.minLotSize) {
      return { valid: false, error: `Minimum lot size is ${rules.minLotSize}`, code: ERROR_CODES.LOT_SIZE_VIOLATION };
    }
    if (rules.maxLotSize && qty > rules.maxLotSize) {
      return { valid: false, error: `Maximum lot size is ${rules.maxLotSize}`, code: ERROR_CODES.LOT_SIZE_VIOLATION };
    }
    // Whole-lots-only enforcement: when admin disables fractional lots,
    // values like 1.5 / 2.5 / 3.5 are rejected. Tolerance handles float drift.
    // Also enforce when minLotSize >= 1 (whole number) unless fractional is explicitly allowed.
    const wholeLotEnforced = rules.allowFractionalLots === false ||
      (rules.allowFractionalLots !== true && rules.minLotSize >= 1 && rules.minLotSize % 1 === 0);
    if (wholeLotEnforced) {
      const rounded = Math.round(qty);
      if (Math.abs(qty - rounded) > 1e-9) {
        return { valid: false, error: 'Fractional lots are not allowed on this challenge — use whole numbers (1, 2, 3 …)', code: ERROR_CODES.LOT_SIZE_VIOLATION };
      }
    }

    // Allowed symbols
    if (rules.allowedSymbols && rules.allowedSymbols.length > 0) {
      if (!rules.allowedSymbols.includes(tradeParams.symbol)) {
        return { valid: false, error: `Symbol ${tradeParams.symbol} is not allowed`, code: ERROR_CODES.SYMBOL_NOT_ALLOWED };
      }
    }

    // Allowed segments
    if (rules.allowedSegments && rules.allowedSegments.length > 0) {
      const seg = (tradeParams.segment || '').toUpperCase();
      if (!rules.allowedSegments.includes(seg)) {
        return { valid: false, error: `Segment ${tradeParams.segment} is not allowed`, code: ERROR_CODES.SEGMENT_NOT_ALLOWED };
      }
    }

    return { valid: true, account, challenge };
  }

  /**
   * Validate trade close request (min hold time)
   */
  async validateTradeClose(challengeAccountId, trade) {
    const account = await ChallengeAccount.findById(challengeAccountId).populate('challengeId');
    if (!account) return { valid: false, error: 'Account not found' };

    const rules = account.challengeId?.rules || {};

    if (rules.minTradeHoldTimeSeconds > 0 && trade.openedAt) {
      const holdTime = (Date.now() - new Date(trade.openedAt).getTime()) / 1000;
      if (holdTime < rules.minTradeHoldTimeSeconds) {
        const remaining = Math.ceil(rules.minTradeHoldTimeSeconds - holdTime);
        return { valid: false, error: `Wait ${remaining} more seconds (min hold time)`, code: ERROR_CODES.MIN_HOLD_TIME, remainingSeconds: remaining };
      }
    }
    return { valid: true, account };
  }

  /**
   * Called when a trade is opened on a challenge account
   */
  async onTradeOpened(challengeAccountId) {
    const account = await ChallengeAccount.findById(challengeAccountId);
    if (!account) return null;

    account.openTradesCount += 1;
    account.tradesToday += 1;
    account.totalTrades += 1;

    // Check if new trading day
    const today = new Date().toDateString();
    const todayIso = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const lastDay = account.lastTradingDay ? account.lastTradingDay.toDateString() : null;
    if (today !== lastDay) {
      account.tradingDaysCount += 1;
      account.lastTradingDay = new Date();
      account.tradesToday = 1;
      account.dayStartEquity = account.currentEquity;
      account.lowestEquityToday = account.currentEquity;
    }

    // Track unique trading days for tradingDaysRequired rule. We use an
    // array of ISO date strings because Mongoose doesn't support Set types
    // natively; duplicates are suppressed with a simple includes-check.
    if (!Array.isArray(account.uniqueTradingDays)) account.uniqueTradingDays = [];
    if (!account.uniqueTradingDays.includes(todayIso)) {
      account.uniqueTradingDays.push(todayIso);
    }

    await account.save();
    return account;
  }

  /**
   * Called when a trade is closed — updates balance, checks rules
   */
  async onTradeClosed(challengeAccountId, closePnL) {
    const account = await ChallengeAccount.findById(challengeAccountId).populate('challengeId');
    if (!account) return null;

    const challenge = account.challengeId;
    const rules = challenge.rules || {};

    // Update balance
    account.currentBalance += closePnL;
    account.currentEquity = account.currentBalance;
    account.openTradesCount = Math.max(0, account.openTradesCount - 1);
    account.totalProfitLoss += closePnL;

    // Update equity tracking
    await account.updateEquity(account.currentEquity);

    // Track daily PnL for max-one-day-profit / consistency rules
    const todayIso = new Date().toISOString().slice(0, 10);
    if (!account.dailyPnlMap) account.dailyPnlMap = new Map();
    const prevDayPnl = account.dailyPnlMap.get(todayIso) || 0;
    account.dailyPnlMap.set(todayIso, prevDayPnl + closePnL);
    account.markModified('dailyPnlMap');

    // Check drawdown breach
    const ddResult = await this.checkDrawdownBreach(account, rules);
    if (ddResult.breached) {
      return { account, failed: true, reason: ddResult.reason };
    }

    // Check max one-day profit rule
    const oneDayResult = await this.checkMaxOneDayProfit(account, challenge);
    if (oneDayResult.violated) {
      // Warn but don't fail — the account just can't pass while violated
    }

    // Check profit target (phase progression)
    const profitResult = await this.checkProfitTarget(account, challenge);
    if (profitResult.targetReached) {
      return { account, phaseCompleted: true, nextPhase: profitResult.nextPhase, funded: profitResult.funded };
    }

    await account.save();
    return { account, failed: false };
  }

  /**
   * Real-time equity update (called on price changes for open positions)
   */
  async updateRealTimeEquity(challengeAccountId, newEquity) {
    const account = await ChallengeAccount.findById(challengeAccountId).populate('challengeId');
    if (!account || (account.status !== 'ACTIVE' && account.status !== 'FUNDED')) return null;

    const rules = account.challengeId?.rules || {};
    await account.updateEquity(newEquity);

    const ddResult = await this.checkDrawdownBreach(account, rules);
    if (ddResult.breached) {
      return { account, breached: true, reason: ddResult.reason };
    }

    return {
      account,
      breached: false,
      dailyDrawdown: account.currentDailyDrawdownPercent,
      overallDrawdown: account.currentOverallDrawdownPercent,
      profitPercent: account.currentProfitPercent
    };
  }

  /**
   * Check daily and overall drawdown limits
   */
  async checkDrawdownBreach(account, rules) {
    let breachReason = null;

    // Daily drawdown
    if (rules.maxDailyDrawdownPercent && account.currentDailyDrawdownPercent >= rules.maxDailyDrawdownPercent) {
      breachReason = `Daily drawdown limit (${rules.maxDailyDrawdownPercent}%) exceeded`;
      await account.addViolation('DAILY_DRAWDOWN_BREACH', breachReason, 'FAIL');
    }

    // Overall drawdown
    if (!breachReason && rules.maxOverallDrawdownPercent && account.currentOverallDrawdownPercent >= rules.maxOverallDrawdownPercent) {
      breachReason = `Overall drawdown limit (${rules.maxOverallDrawdownPercent}%) exceeded`;
      await account.addViolation('OVERALL_DRAWDOWN_BREACH', breachReason, 'FAIL');
    }

    if (breachReason) {
      account.status = 'FAILED';
      account.failedAt = new Date();
      account.failReason = breachReason;
      await account.save();
      return { breached: true, reason: breachReason };
    }

    return { breached: false };
  }

  /**
   * Resolve the active profit target % for any challenge type / phase
   */
  getTargetPercent(account, challenge) {
    const rules = challenge.rules || {};
    if (challenge.stepsCount === 0) {
      return rules.profitTargetInstantPercent || 0;
    }
    if (account.currentPhase === 1) return rules.profitTargetPhase1Percent || 0;
    if (account.currentPhase === 2) return rules.profitTargetPhase2Percent || 0;
    return 0;
  }

  /**
   * Check max one-day profit rule (e.g. 40% of target)
   */
  async checkMaxOneDayProfit(account, challenge) {
    const rules = challenge.rules || {};
    const capPercent = rules.maxOneDayProfitPercentOfTarget;
    if (!capPercent || capPercent <= 0) return { violated: false };

    const targetPercent = this.getTargetPercent(account, challenge);
    if (!targetPercent) return { violated: false };

    const maxDayProfitAbs = (capPercent / 100) * (targetPercent / 100) * account.phaseStartBalance;
    const dailyPnlMap = account.dailyPnlMap || new Map();

    for (const [day, pnl] of dailyPnlMap) {
      if (pnl > maxDayProfitAbs) {
        const existing = (account.violations || []).find(
          v => v.rule === 'MAX_ONE_DAY_PROFIT' && v.description?.includes(day)
        );
        if (!existing) {
          await account.addViolation(
            'MAX_ONE_DAY_PROFIT',
            `Day ${day}: profit ₹${pnl.toFixed(2)} exceeds ${capPercent}% of target (max ₹${maxDayProfitAbs.toFixed(2)})`,
            'WARNING'
          );
        }
        return { violated: true, day, pnl, max: maxDayProfitAbs };
      }
    }
    return { violated: false };
  }

  /**
   * Check consistency rule at pass-time (e.g. no single day > 30% of total profit)
   */
  checkConsistencyRule(account, challenge) {
    const rules = challenge.rules || {};
    const consistencyPercent = rules.consistencyRulePercent;
    if (!consistencyPercent || consistencyPercent <= 0) return { passed: true };

    const dailyPnlMap = account.dailyPnlMap || new Map();
    let totalProfit = 0;
    let bestDay = 0;
    let bestDayKey = '';

    for (const [day, pnl] of dailyPnlMap) {
      if (pnl > 0) {
        totalProfit += pnl;
        if (pnl > bestDay) {
          bestDay = pnl;
          bestDayKey = day;
        }
      }
    }

    if (totalProfit <= 0) return { passed: true };

    const bestDayRatio = (bestDay / totalProfit) * 100;
    if (bestDayRatio > consistencyPercent) {
      return {
        passed: false,
        reason: `Consistency rule: best day (${bestDayKey}) is ${bestDayRatio.toFixed(1)}% of total profit, max allowed is ${consistencyPercent}%`,
        code: ERROR_CODES.CONSISTENCY_RULE,
        bestDayRatio
      };
    }
    return { passed: true, bestDayRatio };
  }

  /**
   * Check profit target for phase progression
   */
  async checkProfitTarget(account, challenge) {
    const rules = challenge.rules || {};
    const targetPercent = this.getTargetPercent(account, challenge);

    // No target configured — nothing to check
    if (!targetPercent) return { targetReached: false };

    if (account.currentProfitPercent >= targetPercent) {
      // Check for FAIL violations
      if (account.violations.some(v => v.severity === 'FAIL')) {
        return { targetReached: false };
      }

      // Gate: max one-day profit — if any day breaches, block passing
      const oneDayCheck = await this.checkMaxOneDayProfit(account, challenge);
      if (oneDayCheck.violated) {
        return {
          targetReached: false,
          reason: `Max one-day profit rule breached — cannot pass yet`,
          code: ERROR_CODES.MAX_ONE_DAY_PROFIT
        };
      }

      // Gate: consistency rule
      const consistencyCheck = this.checkConsistencyRule(account, challenge);
      if (!consistencyCheck.passed) {
        return {
          targetReached: false,
          reason: consistencyCheck.reason,
          code: ERROR_CODES.CONSISTENCY_RULE
        };
      }

      // Gate: minimum trades required for this phase
      if (rules.minTradesRequired && (account.totalTrades || 0) < rules.minTradesRequired) {
        return {
          targetReached: false,
          reason: `Need ${rules.minTradesRequired - (account.totalTrades || 0)} more trade(s) to qualify`,
          code: ERROR_CODES.MIN_TRADES_NOT_MET
        };
      }

      // Gate: minimum unique trading days required
      if (rules.tradingDaysRequired) {
        const days = Array.isArray(account.uniqueTradingDays) ? account.uniqueTradingDays.length : 0;
        if (days < rules.tradingDaysRequired) {
          return {
            targetReached: false,
            reason: `Need ${rules.tradingDaysRequired - days} more trading day(s) to qualify`,
            code: ERROR_CODES.TRADING_DAYS_NOT_MET
          };
        }
      }

      // For instant (0-step) with a profit target configured, passing means
      // we mark the account as PASSED and create a funded account.
      if (challenge.stepsCount === 0 || account.currentPhase >= account.totalPhases) {
        // Challenge PASSED — create funded account
        account.status = 'PASSED';
        account.passedAt = new Date();
        await account.save();

        const fundedAccount = await this.createFundedAccount(account);
        return { targetReached: true, funded: true, fundedAccount };
      } else if (account.currentPhase < account.totalPhases) {
        // Advance to next phase
        account.currentPhase += 1;
        account.phaseStartBalance = account.currentEquity;
        account.currentProfitPercent = 0;
        account.currentDailyDrawdownPercent = 0;
        account.maxDailyDrawdownHit = 0;
        await account.save();
        return { targetReached: true, nextPhase: account.currentPhase, funded: false };
      }
    }

    return { targetReached: false };
  }

  /**
   * Create funded account after challenge passed
   */
  async createFundedAccount(challengeAccount) {
    const challenge = await Challenge.findById(challengeAccount.challengeId);
    const accountId = await ChallengeAccount.generateAccountId('FND');
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const fundedAccount = await ChallengeAccount.create({
      userId: challengeAccount.userId,
      challengeId: challengeAccount.challengeId,
      accountId,
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
      walletBalance: challenge.fundSize,
      walletEquity: challenge.fundSize,
      walletCredit: 0,
      walletMargin: 0,
      walletFreeMargin: challenge.fundSize,
      walletMarginLevel: 0,
      profitSplitPercent: challenge.fundedSettings?.profitSplitPercent || 80,
      paymentStatus: 'COMPLETED',
      expiresAt
    });

    challengeAccount.fundedAccountId = fundedAccount._id;
    await challengeAccount.save();

    return fundedAccount;
  }

  /**
   * Withdraw profit from funded account
   */
  async withdrawProfit(challengeAccountId, userId, payoutDetails = {}) {
    const upiId = String(payoutDetails.upiId || '').trim();
    const holderName = String(payoutDetails.holderName || '').trim();
    if (!upiId) throw new Error('UPI ID is required');
    if (!holderName) throw new Error('Account holder name is required');

    const account = await ChallengeAccount.findById(challengeAccountId).populate('challengeId');
    if (!account) throw new Error('Account not found');
    if (account.status !== 'FUNDED') throw new Error('Only funded accounts can withdraw');
    if (String(account.userId) !== String(userId)) throw new Error('Not your account');

    const challenge = account.challengeId;
    const rules = challenge.fundedSettings || {};

    // Check withdrawal frequency
    if (rules.withdrawalFrequencyDays && account.lastWithdrawalDate) {
      const daysSince = (Date.now() - new Date(account.lastWithdrawalDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < rules.withdrawalFrequencyDays) {
        const remaining = Math.ceil(rules.withdrawalFrequencyDays - daysSince);
        throw new Error(`Can withdraw again in ${remaining} days`);
      }
    }

    // Any pending payout request blocks a new one so the admin queue stays
    // single-decision-per-account.
    const Transaction = require('../models/Transaction');
    const existingPending = await Transaction.findOne({
      oderId: String(account.userId),
      type: 'withdrawal',
      status: 'pending',
      'paymentDetails.challengeAccountId': String(account._id)
    });
    if (existingPending) {
      throw new Error('A payout request is already pending for this account');
    }

    // Compute default withdrawable. Use walletBalance if the new sub-wallet
    // has been populated; fall back to legacy currentBalance for pre-Phase-B
    // accounts.
    const balanceNow = Number(account.walletBalance) || Number(account.currentBalance) || 0;
    const profit = Math.max(0, balanceNow - Number(account.initialBalance));
    if (profit <= 0) throw new Error('No profit to withdraw');

    const splitPercent = account.profitSplitPercent || 80;
    const withdrawable = (profit * splitPercent) / 100;
    if (withdrawable <= 0) throw new Error('No withdrawable amount');

    // Create a pending Transaction. Admin reviews + approves in the payout
    // queue; admin approval is what actually moves real INR into
    // User.walletINR and resets the challenge account's wallet to initial.
    const tx = await Transaction.create({
      oderId: String(account.userId),
      type: 'withdrawal',
      amount: withdrawable,
      currency: 'INR',
      paymentMethod: 'upi',
      status: 'pending',
      userName: holderName,
      userNote: String(payoutDetails.note || `Prop profit payout · ${splitPercent}% of ₹${profit.toFixed(2)} profit · challenge ${account.accountId}`).slice(0, 500),
      paymentDetails: {
        upiId,
        challengeAccountId: String(account._id),
        challengeAccountCode: account.accountId,
        profit,
        splitPercent,
        kind: 'prop_payout'
      },
      withdrawalInfo: {
        method: 'upi',
        upiDetails: { upiId, name: holderName }
      }
    });

    return {
      pending: true,
      transactionId: tx._id,
      requestedAmount: withdrawable,
      profit,
      splitPercent,
      account
    };
  }

  /**
   * Get account dashboard data (for user view)
   */
  async getAccountDashboard(challengeAccountId, userId) {
    const account = await ChallengeAccount.findById(challengeAccountId)
      .populate('challengeId')
      .populate('userId', 'name email oderId');

    if (!account) return null;
    if (userId && String(account.userId._id || account.userId) !== String(userId)) return null;

    const challenge = account.challengeId;
    const rules = challenge.rules || {};

    // Remaining time
    const remainingMs = new Date(account.expiresAt) - new Date();
    const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

    // Target progress — works for instant, 1-step, and 2-step
    const targetPercent = this.getTargetPercent(account, challenge);
    const targetProgress = targetPercent > 0 ? Math.min(100, (Math.max(0, account.currentProfitPercent) / targetPercent) * 100) : 0;

    // Withdrawable profit (funded only)
    let withdrawable = 0;
    if (account.status === 'FUNDED') {
      const profit = Math.max(0, account.currentBalance - account.initialBalance);
      withdrawable = (profit * (account.profitSplitPercent || 80)) / 100;
    }

    return {
      account: {
        _id: account._id,
        accountId: account.accountId,
        accountType: account.accountType,
        status: account.status,
        currentPhase: account.currentPhase,
        totalPhases: account.totalPhases,
        failReason: account.failReason,
        passedAt: account.passedAt,
        failedAt: account.failedAt,
        createdAt: account.createdAt
      },
      balance: {
        initial: account.initialBalance,
        current: account.walletBalance ?? account.currentBalance,
        equity: account.walletEquity ?? account.currentEquity,
        profitLoss: account.totalProfitLoss
      },
      drawdown: {
        dailyUsed: account.currentDailyDrawdownPercent || 0,
        dailyMax: rules.maxDailyDrawdownPercent || 5,
        dailyRemaining: Math.max(0, (rules.maxDailyDrawdownPercent || 5) - (account.currentDailyDrawdownPercent || 0)),
        overallUsed: account.currentOverallDrawdownPercent || 0,
        overallMax: rules.maxOverallDrawdownPercent || 10,
        overallRemaining: Math.max(0, (rules.maxOverallDrawdownPercent || 10) - (account.currentOverallDrawdownPercent || 0))
      },
      profit: {
        currentPercent: account.currentProfitPercent || 0,
        targetPercent,
        targetProgress,
        amountToTarget: targetPercent > 0 ? Math.max(0, (targetPercent / 100) * account.phaseStartBalance - account.totalProfitLoss) : 0
      },
      trades: {
        today: account.tradesToday,
        maxPerDay: rules.maxTradesPerDay || null,
        openCount: account.openTradesCount,
        maxConcurrent: rules.maxConcurrentTrades || null,
        total: account.totalTrades,
        tradingDays: account.tradingDaysCount,
        requiredDays: rules.tradingDaysRequired || null
      },
      rules: {
        stopLossMandatory: rules.stopLossMandatory || false,
        minHoldTimeSeconds: rules.minTradeHoldTimeSeconds || 0,
        maxLeverage: rules.maxLeverage || 100,
        minLotSize: rules.minLotSize || 0.01,
        maxLotSize: rules.maxLotSize || 100
      },
      time: {
        expiresAt: account.expiresAt,
        remainingDays,
        createdAt: account.createdAt
      },
      funded: {
        profitSplitPercent: account.profitSplitPercent || 80,
        withdrawable,
        totalWithdrawn: account.totalWithdrawn || 0,
        lastWithdrawalDate: account.lastWithdrawalDate
      },
      violations: account.violations || [],
      challenge: {
        _id: challenge._id,
        name: challenge.name,
        fundSize: challenge.fundSize,
        stepsCount: challenge.stepsCount,
        challengeFee: challenge.challengeFee
      }
    };
  }
}

module.exports = new PropTradingEngine();
