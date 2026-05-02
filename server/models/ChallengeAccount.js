const mongoose = require('mongoose');

const challengeAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  accountId: {
    type: String,
    unique: true,
    required: true
  },

  // Account Type
  accountType: {
    type: String,
    enum: ['CHALLENGE', 'FUNDED'],
    default: 'CHALLENGE'
  },

  // Phase tracking
  currentPhase: {
    type: Number,
    default: 1
  },
  totalPhases: {
    type: Number,
    required: true
  },

  // Status
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'PASSED', 'FAILED', 'FUNDED', 'EXPIRED', 'CANCELLED'],
    default: 'ACTIVE'
  },
  failReason: {
    type: String,
    default: null
  },
  failedAt: {
    type: Date,
    default: null
  },
  passedAt: {
    type: Date,
    default: null
  },

  // Balance tracking
  initialBalance: {
    type: Number,
    required: true
  },
  currentBalance: {
    type: Number,
    required: true
  },
  currentEquity: {
    type: Number,
    required: true
  },

  // Isolated virtual sub-wallet (FTMO-style). These fields mirror
  // User.wallet but are fully independent per challenge account. Trades
  // placed on this account debit/credit ONLY these fields — the user's
  // main wallet is NEVER touched. At admin-approved payout time, the
  // platform transfers real INR from its treasury into the user's
  // walletINR, then resets these fields to initialBalance.
  walletBalance: { type: Number, default: 0 },
  walletCredit: { type: Number, default: 0 },
  walletEquity: { type: Number, default: 0 },
  walletMargin: { type: Number, default: 0 },
  walletFreeMargin: { type: Number, default: 0 },
  walletMarginLevel: { type: Number, default: 0 },

  // Phase start values (for drawdown calculation)
  phaseStartBalance: {
    type: Number,
    required: true
  },
  dayStartEquity: {
    type: Number,
    default: null
  },
  lowestEquityToday: {
    type: Number,
    default: null
  },
  lowestEquityOverall: {
    type: Number,
    default: null
  },
  highestEquity: {
    type: Number,
    default: null
  },

  // Drawdown tracking
  currentDailyDrawdownPercent: {
    type: Number,
    default: 0
  },
  currentOverallDrawdownPercent: {
    type: Number,
    default: 0
  },
  maxDailyDrawdownHit: {
    type: Number,
    default: 0
  },
  maxOverallDrawdownHit: {
    type: Number,
    default: 0
  },

  // Profit tracking
  currentProfitPercent: {
    type: Number,
    default: 0
  },
  totalProfitLoss: {
    type: Number,
    default: 0
  },

  // Trade tracking
  tradesToday: {
    type: Number,
    default: 0
  },
  openTradesCount: {
    type: Number,
    default: 0
  },
  totalTrades: {
    type: Number,
    default: 0
  },
  tradingDaysCount: {
    type: Number,
    default: 0
  },
  lastTradingDay: {
    type: Date,
    default: null
  },
  // ISO date strings (YYYY-MM-DD) of every day the user placed at least one
  // trade — enforced against Challenge.rules.tradingDaysRequired in
  // checkProfitTarget so a user can't farm a single-day 8% spike and pass.
  uniqueTradingDays: {
    type: [String],
    default: []
  },
  expiredAt: {
    type: Date,
    default: null
  },
  // Per-day PnL map (YYYY-MM-DD → profit/loss amount). Used by the
  // max-one-day-profit and consistency rules in propTradingEngine.
  dailyPnlMap: {
    type: Map,
    of: Number,
    default: () => new Map()
  },

  // Rule violations
  violations: [{
    rule: String,
    description: String,
    severity: {
      type: String,
      enum: ['WARNING', 'FAIL']
    },
    tradeId: mongoose.Schema.Types.ObjectId,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  warningsCount: {
    type: Number,
    default: 0
  },

  // Payment
  paymentId: {
    type: String,
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'REFUNDED', 'PAYMENT_PENDING', 'PAYMENT_REJECTED'],
    default: 'PENDING'
  },

  // Link to the pending challenge_purchase Transaction. Set when the
  // user submits a buy-request via the UPI flow; the admin approval
  // handler reads this back to activate the account.
  pendingPurchaseTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  },

  // IB coupon snapshot — populated only when this challenge was bought
  // with a coupon code. Captures all the params at the moment of redemption
  // so admin/IB dashboards can audit historical purchases even after the
  // IB's coupon is re-issued or revoked.
  couponSnapshot: {
    code: { type: String, default: null, uppercase: true },
    ibId: { type: mongoose.Schema.Types.ObjectId, ref: 'IB', default: null },
    ibUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    discountPercent: { type: Number, default: 0 },
    originalFee: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    finalFee: { type: Number, default: 0 },
    challengePurchaseCommissionPercent: { type: Number, default: 0 },
    ibCommissionAmount: { type: Number, default: 0 },
    ibCommissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'IBCommission', default: null },
    redeemedAt: { type: Date, default: null }
  },

  // Funded account specific
  fundedAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChallengeAccount',
    default: null
  },
  profitSplitPercent: {
    type: Number,
    default: 80
  },
  totalWithdrawn: {
    type: Number,
    default: 0
  },
  lastWithdrawalDate: {
    type: Date,
    default: null
  },

  // Timestamps. expiresAt is null while the account is in PENDING
  // (buy-request awaiting admin approval) — clock starts ticking only
  // when the admin activates the account.
  expiresAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for IB coupon redemption queries
challengeAccountSchema.index({ 'couponSnapshot.ibId': 1, createdAt: -1 });
challengeAccountSchema.index({ 'couponSnapshot.code': 1 });

// Generate unique account ID
challengeAccountSchema.statics.generateAccountId = async function (type = 'CH') {
  const prefix = type === 'FUNDED' ? 'FND' : 'CH';
  const random = Math.floor(100000 + Math.random() * 900000);
  const accountId = `${prefix}${random}`;
  const exists = await this.findOne({ accountId });
  if (exists) {
    return this.generateAccountId(type);
  }
  return accountId;
};

// Update equity and check drawdowns
challengeAccountSchema.methods.updateEquity = async function (newEquity) {
  const Challenge = mongoose.model('Challenge');
  const challenge = await Challenge.findById(this.challengeId);

  this.currentEquity = newEquity;

  if (this.lowestEquityToday === null || newEquity < this.lowestEquityToday) {
    this.lowestEquityToday = newEquity;
  }
  if (this.lowestEquityOverall === null || newEquity < this.lowestEquityOverall) {
    this.lowestEquityOverall = newEquity;
  }
  if (this.highestEquity === null || newEquity > this.highestEquity) {
    this.highestEquity = newEquity;
  }

  // Calculate daily drawdown
  if (this.dayStartEquity) {
    const dailyDD = ((this.dayStartEquity - this.lowestEquityToday) / this.dayStartEquity) * 100;
    this.currentDailyDrawdownPercent = Math.max(0, dailyDD);
    if (dailyDD > this.maxDailyDrawdownHit) {
      this.maxDailyDrawdownHit = dailyDD;
    }
  }

  // Calculate overall drawdown
  const overallDD = ((this.initialBalance - this.lowestEquityOverall) / this.initialBalance) * 100;
  this.currentOverallDrawdownPercent = Math.max(0, overallDD);
  if (overallDD > this.maxOverallDrawdownHit) {
    this.maxOverallDrawdownHit = overallDD;
  }

  // Calculate profit
  this.currentProfitPercent = ((newEquity - this.phaseStartBalance) / this.phaseStartBalance) * 100;
  this.totalProfitLoss = newEquity - this.initialBalance;

  this.updatedAt = new Date();
  await this.save();

  return {
    dailyDrawdown: this.currentDailyDrawdownPercent,
    overallDrawdown: this.currentOverallDrawdownPercent,
    profitPercent: this.currentProfitPercent
  };
};

// Reset daily stats
challengeAccountSchema.methods.resetDailyStats = async function () {
  this.dayStartEquity = this.currentEquity;
  this.lowestEquityToday = this.currentEquity;
  this.tradesToday = 0;
  this.currentDailyDrawdownPercent = 0;

  const today = new Date().toDateString();
  const lastDay = this.lastTradingDay ? this.lastTradingDay.toDateString() : null;
  if (today !== lastDay) {
    this.tradingDaysCount += 1;
    this.lastTradingDay = new Date();
  }
  await this.save();
};

// Add violation
challengeAccountSchema.methods.addViolation = async function (rule, description, severity, tradeId = null) {
  this.violations.push({ rule, description, severity, tradeId, timestamp: new Date() });
  if (severity === 'WARNING') {
    this.warningsCount += 1;
  }
  if (severity === 'FAIL') {
    this.status = 'FAILED';
    this.failReason = `${rule}: ${description}`;
    this.failedAt = new Date();
  }
  await this.save();
  return this;
};

module.exports = mongoose.model('ChallengeAccount', challengeAccountSchema);
