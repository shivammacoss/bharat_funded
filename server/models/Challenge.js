const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  stepsCount: {
    type: Number,
    enum: [0, 1, 2],
    required: true,
    default: 2
  },
  // Legacy single-tier fields — kept for back-compat so old challenges still
  // render. New challenges should populate `tiers` instead; if `tiers` is
  // non-empty the user UI iterates that. buyChallenge falls back to the
  // legacy pair when `tiers` is empty or `tierIndex` is not provided.
  fundSize: {
    type: Number,
    required: false,
    default: 0
  },
  challengeFee: {
    type: Number,
    required: false,
    default: 0
  },
  // Multi-tier pricing: admin can expose several (fundSize, fee) pairs per
  // challenge so the user can pick — e.g. ₹100 → ₹1,000 fund, ₹300 → ₹8,000
  // fund, etc. `label` is optional (e.g. "Starter", "Popular"); `isPopular`
  // makes the user UI badge the tier.
  tiers: [{
    fundSize: { type: Number, required: true },
    challengeFee: { type: Number, required: true },
    label: { type: String, default: '' },
    isPopular: { type: Boolean, default: false }
  }],
  currency: {
    type: String,
    default: 'INR'
  },

  // Risk Rules
  rules: {
    maxDailyDrawdownPercent: {
      type: Number,
      default: 5
    },
    maxDailyDrawdownAmount: {
      type: Number,
      default: null
    },
    maxOverallDrawdownPercent: {
      type: Number,
      default: 10
    },
    maxOverallDrawdownAmount: {
      type: Number,
      default: null
    },
    maxLossPerTradePercent: {
      type: Number,
      default: 2
    },

    // Profit Rules
    profitTargetPhase1Percent: {
      type: Number,
      default: null
    },
    profitTargetPhase2Percent: {
      type: Number,
      default: null
    },
    // Instant (0-step) challenge profit target — unlike 1/2-step which use
    // the phase fields above, instant funds use this dedicated target.
    profitTargetInstantPercent: {
      type: Number,
      default: null
    },
    // Max single-day profit as a percentage of the profit target. E.g. 40
    // means a trader cannot earn more than 40% of the total target in one day.
    // Excess profit on that day is still credited but the day is flagged as a
    // violation and the account cannot pass until the rule is met cleanly.
    maxOneDayProfitPercentOfTarget: {
      type: Number,
      default: null
    },
    // Consistency rule: no single profitable day can contribute more than
    // this percentage of the total profit. E.g. 30 means no day can be more
    // than 30% of cumulative profit. Checked at pass-time.
    consistencyRulePercent: {
      type: Number,
      default: null
    },

    // Lot Size Rules
    minLotSize: {
      type: Number,
      default: 0.01
    },
    maxLotSize: {
      type: Number,
      default: 100
    },
    // When false, only whole-number lots are accepted (1, 2, 3 …) and orders
    // like 1.5 / 2.5 / 3.5 are rejected. Default false for Indian instruments.
    allowFractionalLots: {
      type: Boolean,
      default: false
    },

    // Trade Count Rules
    minTradesRequired: {
      type: Number,
      default: 1
    },
    maxTradesPerDay: {
      type: Number,
      default: null
    },
    maxTotalTrades: {
      type: Number,
      default: null
    },
    maxConcurrentTrades: {
      type: Number,
      default: null
    },

    // Trade Behavior Rules (optional — validator no longer enforces these)
    stopLossMandatory: {
      type: Boolean,
      default: false
    },
    takeProfitMandatory: {
      type: Boolean,
      default: false
    },
    minTradeHoldTimeSeconds: {
      type: Number,
      default: 0
    },
    maxTradeHoldTimeSeconds: {
      type: Number,
      default: null
    },

    // Weekend/News Trading
    allowWeekendHolding: {
      type: Boolean,
      default: false
    },
    allowNewsTrading: {
      type: Boolean,
      default: true
    },

    // Leverage
    maxLeverage: {
      type: Number,
      default: 100
    },

    // Allowed Instruments
    allowedSymbols: [{
      type: String
    }],
    allowedSegments: [{
      type: String,
      enum: ['FOREX', 'CRYPTO', 'STOCKS', 'COMMODITIES', 'INDICES']
    }],

    // Time Rules
    tradingDaysRequired: {
      type: Number,
      default: null
    },
    challengeExpiryDays: {
      type: Number,
      default: 30
    },

    // Trading Hours (24h format)
    tradingHoursStart: {
      type: String,
      default: null
    },
    tradingHoursEnd: {
      type: String,
      default: null
    }
  },

  // Funded Account Settings
  fundedSettings: {
    profitSplitPercent: {
      type: Number,
      default: 80
    },
    maxWithdrawalPercent: {
      type: Number,
      default: null
    },
    withdrawalFrequencyDays: {
      type: Number,
      default: 14
    }
  },

  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
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

challengeSchema.pre('save', function () {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('Challenge', challengeSchema);
