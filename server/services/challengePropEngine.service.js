/**
 * ChallengePropEngine — isolated trading engine for prop-challenge accounts.
 *
 * Every operation here debits/credits ONLY the ChallengeAccount's virtual
 * sub-wallet (walletBalance / walletEquity / walletMargin / walletFreeMargin).
 * The user's User.wallet is never touched by this engine. Real INR only
 * leaves the platform when a payout request is approved by an admin.
 *
 * Contract:
 *   - openPosition(challengeAccountId, orderData)   → validates rules,
 *     debits walletMargin, creates ChallengePosition
 *   - closePosition(positionId, closePrice, reason) → realises P&L into
 *     walletBalance, releases margin, runs drawdown / profit-target checks
 *   - refreshEquity(challengeAccountId, livePrices) → recomputes
 *     walletEquity from open positions' floating P&L, fires drawdown check
 */

const ChallengeAccount = require('../models/ChallengeAccount');
const ChallengePosition = require('../models/ChallengePosition');
const propTradingEngine = require('./propTradingEngine');

function genPositionId() {
  return `CHP-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

/**
 * Recompute wallet aggregates from balance + open positions.
 */
function recomputeWallet(account, openPositions) {
  const balance = Number(account.walletBalance) || 0;
  const credit = Number(account.walletCredit) || 0;
  let floatingPnl = 0;
  let margin = 0;
  for (const pos of openPositions) {
    floatingPnl += Number(pos.profit) || 0;
    margin += Number(pos.marginUsed) || 0;
  }
  const equity = balance + credit + floatingPnl;
  const freeMargin = Math.max(0, equity - margin);
  const marginLevel = margin > 0 ? (equity / margin) * 100 : 0;

  account.walletMargin = margin;
  account.walletEquity = equity;
  account.walletFreeMargin = freeMargin;
  account.walletMarginLevel = marginLevel;
  return account;
}

async function openPosition(challengeAccountId, orderData) {
  const account = await ChallengeAccount.findById(challengeAccountId).populate('challengeId');
  if (!account) return { success: false, error: 'Challenge account not found' };
  if (!['ACTIVE', 'FUNDED'].includes(account.status)) {
    return { success: false, error: `Account is ${account.status}` };
  }

  // Run the full rule-based validator (extends to maxLeverage,
  // takeProfitMandatory, etc. — all rules live in propTradingEngine).
  const validation = await propTradingEngine.validateTradeOpen(challengeAccountId, {
    symbol: orderData.symbol,
    segment: orderData.segment || orderData.exchange,
    quantity: orderData.volume || orderData.quantity,
    leverage: orderData.leverage,
    sl: orderData.stopLoss,
    stopLoss: orderData.stopLoss,
    tp: orderData.takeProfit,
    takeProfit: orderData.takeProfit
  });
  if (!validation.valid) {
    return { success: false, error: validation.error, code: validation.code };
  }

  // Margin math — simple: (price × volume) / leverage. Indian instruments
  // typically trade 1 unit; contract-size concerns are handled inside the
  // main engines. For the challenge's virtual wallet we use this simple
  // formula so the user sees consistent numbers.
  const volume = Number(orderData.volume || orderData.quantity) || 0;
  const entryPrice = Number(orderData.entryPrice || orderData.price) || 0;
  const leverage = Number(orderData.leverage) || 100;
  if (!volume || !entryPrice) {
    return { success: false, error: 'Missing volume or entry price' };
  }
  const marginRequired = (entryPrice * volume) / leverage;

  if (account.walletFreeMargin < marginRequired) {
    return {
      success: false,
      error: `Insufficient free margin on challenge account. Available ₹${account.walletFreeMargin.toFixed(2)}, required ₹${marginRequired.toFixed(2)}`
    };
  }

  const position = await ChallengePosition.create({
    challengeAccountId: account._id,
    userId: account.userId,
    positionId: genPositionId(),
    symbol: orderData.symbol,
    side: orderData.side,
    volume,
    quantity: orderData.quantity || volume,
    lotSize: orderData.lotSize || 1,
    entryPrice,
    currentPrice: entryPrice,
    stopLoss: orderData.stopLoss || null,
    takeProfit: orderData.takeProfit || null,
    leverage,
    marginUsed: marginRequired,
    exchange: orderData.exchange || 'NSE',
    segment: orderData.segment || '',
    session: orderData.session || 'intraday',
    orderType: orderData.orderType || 'market',
    status: 'open'
  });

  // Update the account's trade counters via propTradingEngine.
  await propTradingEngine.onTradeOpened(account._id);

  // Re-read to get fresh counters, then recompute wallet aggregates.
  const fresh = await ChallengeAccount.findById(account._id);
  const openPositions = await ChallengePosition.find({ challengeAccountId: account._id, status: 'open' });
  recomputeWallet(fresh, openPositions);
  await fresh.save();

  return { success: true, position, account: fresh };
}

async function closePosition(positionId, closePrice, reason = 'user') {
  const position = await ChallengePosition.findOne({ positionId, status: 'open' });
  if (!position) return { success: false, error: 'Position not found or already closed' };

  const account = await ChallengeAccount.findById(position.challengeAccountId);
  if (!account) return { success: false, error: 'Challenge account not found' };

  // Realised P&L in INR (Indian instruments use 1:1 contract size).
  const priceDiff = position.side === 'buy'
    ? Number(closePrice) - Number(position.entryPrice)
    : Number(position.entryPrice) - Number(closePrice);
  const realisedPnl = priceDiff * Number(position.volume);

  position.status = 'closed';
  position.closePrice = Number(closePrice);
  position.closeTime = new Date();
  position.closedBy = reason;
  position.profit = realisedPnl;
  await position.save();

  // Settle on the sub-wallet: balance gets the PnL, margin is released.
  account.walletBalance = Number(account.walletBalance) + realisedPnl;
  // Re-read counters and recompute aggregates from remaining open positions.
  const openPositions = await ChallengePosition.find({ challengeAccountId: account._id, status: 'open' });
  recomputeWallet(account, openPositions);

  // Mirror to the legacy scorecard fields the dashboard reads.
  account.currentBalance = account.walletBalance;
  account.currentEquity = account.walletEquity;
  await account.save();

  // Kick the phase/drawdown machinery (uses currentBalance/currentEquity).
  const result = await propTradingEngine.onTradeClosed(account._id, realisedPnl);

  return {
    success: true,
    position,
    account: result?.account || account,
    failed: result?.failed || false,
    phaseCompleted: result?.phaseCompleted || false,
    funded: result?.funded || false,
    reason: result?.reason
  };
}

/**
 * Recompute floating P&L on open challenge positions using the given live
 * price map (symbol -> { bid, ask, last }). Then refresh the sub-wallet
 * aggregates and run the drawdown-breach check. Intended to be called from
 * the same tick loop that updates main-wallet positions.
 */
async function refreshEquity(challengeAccountId, livePrices) {
  const account = await ChallengeAccount.findById(challengeAccountId).populate('challengeId');
  if (!account) return null;

  const openPositions = await ChallengePosition.find({ challengeAccountId, status: 'open' });
  for (const pos of openPositions) {
    const lp = livePrices?.[pos.symbol];
    if (!lp) continue;
    const currentPrice = pos.side === 'buy' ? (lp.bid ?? lp.last ?? pos.currentPrice) : (lp.ask ?? lp.last ?? pos.currentPrice);
    pos.currentPrice = Number(currentPrice);
    const priceDiff = pos.side === 'buy'
      ? Number(currentPrice) - Number(pos.entryPrice)
      : Number(pos.entryPrice) - Number(currentPrice);
    pos.profit = priceDiff * Number(pos.volume);
    await pos.save();
  }

  recomputeWallet(account, openPositions);
  account.currentBalance = account.walletBalance;
  account.currentEquity = account.walletEquity;
  await account.save();

  // Use propTradingEngine's drawdown check (it also handles auto-fail).
  return await propTradingEngine.updateRealTimeEquity(challengeAccountId, account.walletEquity);
}

module.exports = {
  openPosition,
  closePosition,
  refreshEquity
};
