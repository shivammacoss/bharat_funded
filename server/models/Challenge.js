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

    // Lot Size Rules
    minLotSize: {
      type: Number,
      default: 0.01
    },
    maxLotSize: {
      type: Number,
      default: 100
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

    // Trade Behavior Rules
    stopLossMandatory: {
      type: Boolean,
      default: true
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
