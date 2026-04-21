/**
 * Trade Hooks Service
 * Integrates IB commission with trade execution
 * Called by trading engines when trades open/close
 */

const commissionService = require('./commission.service');
const ChallengeAccount = require('../models/ChallengeAccount');

// Lazy-load to avoid circular dependency
let _propEngine = null;
function getPropEngine() {
  if (!_propEngine) _propEngine = require('./propTradingEngine');
  return _propEngine;
}

class TradeHooksService {
  /**
   * Called when a trade is opened
   */
  async onTradeOpen(tradeData) {
    const results = {};
    try {
      // Prop Trading hook — if user has active challenge, validate + track
      if (tradeData.userId) {
        const propResult = await this._propOnTradeOpen(tradeData);
        if (propResult) results.prop = propResult;
      }
      return results;
    } catch (error) {
      console.error('[TradeHooks] Error on trade open:', error);
      return { error: error.message };
    }
  }

  /**
   * Prop Trading: check active challenge accounts on trade open
   */
  async _propOnTradeOpen(tradeData) {
    try {
      const propEngine = getPropEngine();
      // Find user's ACTIVE or FUNDED challenge accounts
      const accounts = await ChallengeAccount.find({
        userId: tradeData.userId,
        status: { $in: ['ACTIVE', 'FUNDED'] }
      });
      if (!accounts.length) return null;

      const results = [];
      for (const acc of accounts) {
        // Validate trade against challenge rules
        const validation = await propEngine.validateTradeOpen(acc._id, {
          symbol: tradeData.symbol,
          segment: tradeData.segment || tradeData.exchange,
          quantity: tradeData.volume,
          sl: tradeData.stopLoss,
          stopLoss: tradeData.stopLoss
        });

        if (validation.valid) {
          // Track the trade open
          await propEngine.onTradeOpened(acc._id);
          results.push({ accountId: acc.accountId, status: 'tracked' });
        } else {
          results.push({ accountId: acc.accountId, status: 'violation', reason: validation.error });
        }
      }
      return results.length ? results : null;
    } catch (err) {
      console.error('[TradeHooks] Prop onTradeOpen error:', err.message);
      return null;
    }
  }

  /**
   * Called when a trade is closed
   * Triggers IB commission calculation
   */
  async onTradeClose(tradeData) {
    const {
      userId,
      oderId,
      tradeId,
      positionId,
      symbol,
      side,
      volume,
      entryPrice,
      closePrice,
      profit,
      spread,
      commission: platformCommission,
      mode
    } = tradeData;

    const results = {
      ibCommission: null
    };

    try {
      // Process IB commission
      const ibCommission = await commissionService.processTradeCommission({
        userId,
        oderId,
        tradeId,
        positionId,
        symbol,
        volume,
        entryPrice,
        closePrice,
        profit,
        spread,
        platformCommission
      });

      if (ibCommission) {
        results.ibCommission = ibCommission;
        console.log(`[TradeHooks] IB commission processed: $${ibCommission.amount}`);
      }

      // Prop Trading hook — update challenge account balance on trade close
      if (userId) {
        const propResult = await this._propOnTradeClose(userId, profit);
        if (propResult) results.prop = propResult;
      }

      return results;
    } catch (error) {
      console.error('[TradeHooks] Error on trade close:', error);
      return { ...results, error: error.message };
    }
  }

  /**
   * Prop Trading: update challenge accounts when a trade closes
   */
  async _propOnTradeClose(userId, pnl) {
    try {
      const propEngine = getPropEngine();
      const accounts = await ChallengeAccount.find({
        userId,
        status: { $in: ['ACTIVE', 'FUNDED'] }
      });
      if (!accounts.length) return null;

      const results = [];
      for (const acc of accounts) {
        const result = await propEngine.onTradeClosed(acc._id, Number(pnl) || 0);
        if (result) {
          results.push({
            accountId: acc.accountId,
            failed: result.failed || false,
            phaseCompleted: result.phaseCompleted || false,
            funded: result.funded || false,
            balance: result.account?.currentBalance
          });
          if (result.failed) {
            console.log(`[TradeHooks] Prop account ${acc.accountId} FAILED: ${result.reason}`);
          }
          if (result.funded) {
            console.log(`[TradeHooks] Prop account ${acc.accountId} FUNDED!`);
          }
        }
      }
      return results.length ? results : null;
    } catch (err) {
      console.error('[TradeHooks] Prop onTradeClose error:', err.message);
      return null;
    }
  }

  /**
   * Called when a trade is modified (SL/TP change)
   */
  async onTradeModify(tradeData) {
    const { positionId } = tradeData;

    try {
      console.log(`[TradeHooks] Trade modified: ${positionId}`);
      return { success: true };
    } catch (error) {
      console.error('[TradeHooks] Error on trade modify:', error);
      return { error: error.message };
    }
  }
}

module.exports = new TradeHooksService();
