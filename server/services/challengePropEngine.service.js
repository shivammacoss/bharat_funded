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
const NettingSegment = require('../models/NettingSegment');
const NettingScriptOverride = require('../models/NettingScriptOverride');
const propTradingEngine = require('./propTradingEngine');

function genPositionId() {
  return `CHP-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

/**
 * Effective contract units for a position, i.e. the number we must
 * multiply the per-unit price diff by to get INR P&L.
 *
 * Priority:
 *   1. `quantity` if it's already been computed and stored
 *      (full contract count = lots × lotSize).
 *   2. `volume × lotSize` when both are present.
 *   3. `volume` as a last resort (equivalent to the legacy 1:1 behaviour
 *      that existed before this helper — keeps main-wallet-style symbols
 *      with a 1:1 contract size working).
 *
 * Used by openPosition (margin math), closePosition (realised PnL) and
 * refreshEquity (floating PnL) so every code path agrees on the same
 * multiplier. Previously each path used only `volume`, which meant F&O
 * positions booked PnL of only the price diff × lots — missing the
 * lot-size multiplier entirely (e.g. NIFTY options 1 lot = 65 units).
 */
function pnlUnits(pos) {
  const qty = Number(pos?.quantity);
  if (Number.isFinite(qty) && qty > 0) return qty;
  const vol = Number(pos?.volume) || 0;
  const lot = Number(pos?.lotSize);
  if (Number.isFinite(lot) && lot > 0) return vol * lot;
  return vol;
}

/**
 * Resolve the NettingSegment name from exchange + symbol (mirrors NettingEngine logic).
 */
function resolveSegmentName(exchange, symbol) {
  const ex = String(exchange || '').toUpperCase();
  const sym = String(symbol || '').toUpperCase();
  const isOptions = sym.endsWith('CE') || sym.endsWith('PE');
  const isFutures = sym.endsWith('FUT') || sym.includes('FUT');

  if (ex === 'NSE') return isOptions ? 'NSE_OPT' : isFutures ? 'NSE_FUT' : 'NSE_EQ';
  if (ex === 'BSE') return isOptions ? 'BSE_OPT' : isFutures ? 'BSE_FUT' : 'BSE_EQ';
  if (ex === 'MCX') return isOptions ? 'MCX_OPT' : 'MCX_FUT';
  if (ex === 'NFO') return isOptions ? 'NSE_OPT' : 'NSE_FUT';
  if (ex === 'BFO') return isOptions ? 'BSE_OPT' : 'BSE_FUT';
  if (ex === 'FOREX') return 'FOREX';
  if (ex === 'INDICES') return 'INDICES';
  if (ex === 'COMMODITIES' || ex === 'COMEX') return 'COMMODITIES';
  if (ex === 'STOCKS') return 'STOCKS';
  if (ex === 'DELTA') return 'CRYPTO_PERPETUAL';
  // Fallback: try to infer from symbol
  if (isOptions) return 'NSE_OPT';
  if (isFutures) return 'NSE_FUT';
  return null;
}

/**
 * Compute margin using admin segment settings (same logic as NettingEngine).
 * Returns margin in INR for Indian segments.
 * Falls back to simple (price × qty) / leverage if no segment settings found.
 */
async function computeSegmentMargin(orderData, volume, effectiveQty, entryPrice, leverage) {
  const segName = resolveSegmentName(orderData.exchange, orderData.symbol);
  if (!segName) return (entryPrice * effectiveQty) / leverage;

  const seg = await NettingSegment.findOne({ name: segName }).lean();
  if (!seg) return (entryPrice * effectiveQty) / leverage;

  // Look up per-script override (e.g. NIFTY, BANKNIFTY, SENSEX can each
  // have their own optionSellIntraday). Match by base symbol extracted
  // from the full trading symbol (NIFTY2650524100PE → NIFTY).
  const sym = String(orderData.symbol || '').toUpperCase();
  let scriptOverride = null;
  const baseMatch = sym.match(/^([A-Z&]+(?:-[A-Z&]+)?)(?=\d|$)/);
  const baseSymbol = baseMatch ? baseMatch[1] : sym;
  const symVariants = [sym];
  if (baseSymbol !== sym) symVariants.push(baseSymbol);
  if (symVariants.length > 0) {
    const matches = await NettingScriptOverride.find({
      segmentId: seg._id,
      symbol: { $in: symVariants }
    }).lean();
    if (matches.length > 0) {
      // Prefer longer (more specific) match
      matches.sort((a, b) => b.symbol.length - a.symbol.length);
      scriptOverride = matches[0];
    }
  }

  const isOptions = sym.endsWith('CE') || sym.endsWith('PE') ||
    ['NSE_OPT', 'BSE_OPT', 'MCX_OPT', 'CRYPTO_OPTIONS'].includes(segName);
  const side = String(orderData.side || '').toLowerCase();

  // Determine raw margin value — script override takes precedence over segment
  let rawMarginValue = null;
  let calcMode = scriptOverride?.marginCalcMode || seg.marginCalcMode || 'fixed';
  if (isOptions) {
    if (side === 'buy') {
      rawMarginValue = scriptOverride?.optionBuyIntraday ?? seg.optionBuyIntraday;
      // Option BUY: if no specific buy margin set, charge premium only
      // (real brokers charge premium for buying options, not full margin)
      if (!(Number(rawMarginValue) > 0)) {
        return effectiveQty * entryPrice;
      }
    } else {
      rawMarginValue = scriptOverride?.optionSellIntraday ?? seg.optionSellIntraday;
    }
  }
  // Fallback to base intraday margin if option-specific not set (SELL / non-option)
  if (!(Number(rawMarginValue) > 0)) {
    rawMarginValue =
      scriptOverride?.intradayHolding ??
      scriptOverride?.intradayMargin ??
      seg.intradayMargin ??
      seg.intradayHolding;
  }

  // If still no admin margin configured, simple formula
  if (!(Number(rawMarginValue) > 0)) {
    return (entryPrice * effectiveQty) / leverage;
  }

  // Apply margin calc mode (same as NettingEngine.nettingFixedMarginAmount)
  const r = Number(rawMarginValue);
  switch (calcMode) {
    case 'percent': {
      const cappedPct = Math.min(r, 100);
      return effectiveQty * entryPrice * (cappedPct / 100);
    }
    case 'times': {
      const effectiveMultiplier = r * (leverage / 100);
      return (effectiveQty * entryPrice) / effectiveMultiplier;
    }
    case 'fixed':
    default:
      return r * volume; // per-lot fixed margin × lots
  }
}

/**
 * Compute open/close commission from NettingSegment settings (mirrors NettingEngine).
 * Returns commission in INR. chargePhase = 'open' | 'close'.
 */
async function computeCommission(orderData, volume, effectiveQty, entryPrice, chargePhase) {
  const segName = resolveSegmentName(orderData.exchange, orderData.symbol);
  if (!segName) return 0;

  const seg = await NettingSegment.findOne({ name: segName }).lean();
  if (!seg) return 0;

  // Script override may have its own commission/chargeOn
  const sym = String(orderData.symbol || '').toUpperCase();
  let scriptOverride = null;
  const baseMatch = sym.match(/^([A-Z&]+(?:-[A-Z&]+)?)(?=\d|$)/);
  const baseSymbol = baseMatch ? baseMatch[1] : sym;
  const symVariants = [sym];
  if (baseSymbol !== sym) symVariants.push(baseSymbol);
  if (symVariants.length > 0) {
    const matches = await NettingScriptOverride.find({
      segmentId: seg._id,
      symbol: { $in: symVariants }
    }).lean();
    if (matches.length > 0) {
      matches.sort((a, b) => b.symbol.length - a.symbol.length);
      scriptOverride = matches[0];
    }
  }

  const chargeOn = scriptOverride?.chargeOn || seg.chargeOn || 'open';
  const shouldCharge =
    (chargePhase === 'open'  && (chargeOn === 'open' || chargeOn === 'both')) ||
    (chargePhase === 'close' && (chargeOn === 'close' || chargeOn === 'both'));
  if (!shouldCharge) return 0;

  // Pick commission rate (option-side-specific or base, script override first)
  const isOptions = sym.endsWith('CE') || sym.endsWith('PE') ||
    ['NSE_OPT', 'BSE_OPT', 'MCX_OPT', 'CRYPTO_OPTIONS'].includes(segName);
  const side = String(orderData.side || '').toLowerCase();
  let rate = 0;
  if (isOptions) {
    rate = side === 'buy'
      ? Number(scriptOverride?.optionBuyCommission ?? seg.optionBuyCommission) || 0
      : Number(scriptOverride?.optionSellCommission ?? seg.optionSellCommission) || 0;
  }
  if (!rate) rate = Number(scriptOverride?.commission ?? seg.commission) || 0;
  if (!rate) return 0;

  // Calculate using commissionType (same as NettingEngine.calculateCommission)
  const commType = scriptOverride?.commissionType || seg.commissionType || 'per_lot';
  const typeNorm = String(commType).toLowerCase().replace(/-/g, '_');
  switch (typeNorm) {
    case 'per_lot':      return rate * volume;
    case 'per_crore':    return (effectiveQty * entryPrice / 10000000) * rate;
    case 'percentage':   return (effectiveQty * entryPrice * rate) / 100;
    case 'fixed':        return rate;
    default:             return rate * volume;
  }
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

// Indian equity / index F&O segments stop accepting new orders at 15:15 IST
// (15-min cutoff before the official 15:30 close) and don't trade outside
// 09:15-15:15 on weekdays. MCX (commodities) keeps its longer window. Other
// segments (FOREX/CRYPTO etc.) are 24/7 and skip this gate entirely.
function isIndianMarketOpenForNewOrders(exchange) {
  const ex = String(exchange || '').toUpperCase();
  const INDIAN = new Set(['NSE', 'NFO', 'BSE', 'BFO', 'CDS']);
  if (!INDIAN.has(ex)) return { allowed: true };

  const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = ist.getDay();
  if (day === 0 || day === 6) {
    return { allowed: false, reason: 'Indian market is closed on weekends. New orders are not allowed.' };
  }
  const minutes = ist.getHours() * 60 + ist.getMinutes();
  const open = 9 * 60 + 15;   // 09:15 IST
  const cutoff = 15 * 60 + 15; // 15:15 IST — order entry stops here
  if (minutes < open) {
    return { allowed: false, reason: 'Indian market opens at 09:15 IST. New orders cannot be placed yet.' };
  }
  if (minutes >= cutoff) {
    return { allowed: false, reason: 'Indian market order cutoff is 15:15 IST. All open positions are auto-squared-off at 15:15.' };
  }
  return { allowed: true };
}

async function openPosition(challengeAccountId, orderData) {
  const account = await ChallengeAccount.findById(challengeAccountId).populate('challengeId');
  if (!account) return { success: false, error: 'Challenge account not found' };
  if (!['ACTIVE', 'FUNDED'].includes(account.status)) {
    return { success: false, error: `Account is ${account.status}` };
  }

  // Block new orders on Indian segments outside 09:15-15:15 IST.
  const marketCheck = isIndianMarketOpenForNewOrders(orderData.exchange || orderData.segment);
  if (!marketCheck.allowed) {
    return { success: false, error: marketCheck.reason, code: 'MARKET_CLOSED' };
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

  // Margin math — uses admin NettingSegment settings (same as real brokers
  // like Upstox). Option SELL uses the configured fixed/percent margin,
  // option BUY uses premium, futures use intradayMargin. Falls back to
  // (price × qty) / leverage only if admin hasn't configured any margin.
  const volume = Number(orderData.volume || orderData.quantity) || 0;
  const entryPrice = Number(orderData.entryPrice || orderData.price) || 0;
  const leverage = Number(orderData.leverage) || 100;
  const lotSize = Number(orderData.lotSize) > 0 ? Number(orderData.lotSize) : 1;
  // Effective contract count for PnL — mirrors the same formula
  // used below in closePosition / refreshEquity so margin reserved and
  // PnL booked always agree on "units traded".
  const effectiveQty =
    Number(orderData.quantity) > 0 ? Number(orderData.quantity) : volume * lotSize;
  if (!volume || !entryPrice) {
    return { success: false, error: 'Missing volume or entry price' };
  }
  const marginRequired = await computeSegmentMargin(orderData, volume, effectiveQty, entryPrice, leverage);
  const openCommission = await computeCommission(orderData, volume, effectiveQty, entryPrice, 'open');
  const totalRequired = marginRequired + openCommission;

  if (account.walletFreeMargin < totalRequired) {
    return {
      success: false,
      error: `Insufficient free margin on challenge account. Available ₹${account.walletFreeMargin.toFixed(2)}, required ₹${totalRequired.toFixed(2)}` +
        (openCommission > 0 ? ` (Margin ₹${marginRequired.toFixed(2)} + Commission ₹${openCommission.toFixed(2)})` : '')
    };
  }

  // Debit commission from balance (like NettingEngine)
  if (openCommission > 0) {
    account.walletBalance = Number(account.walletBalance) - openCommission;
  }

  const position = await ChallengePosition.create({
    challengeAccountId: account._id,
    userId: account.userId,
    positionId: genPositionId(),
    symbol: orderData.symbol,
    side: orderData.side,
    volume,
    quantity: effectiveQty,
    lotSize,
    entryPrice,
    currentPrice: entryPrice,
    stopLoss: orderData.stopLoss || null,
    takeProfit: orderData.takeProfit || null,
    leverage,
    marginUsed: marginRequired,
    commission: openCommission,
    openCommission: openCommission,
    commissionInr: openCommission,
    openCommissionInr: openCommission,
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

  // Realised P&L in INR = per-unit price diff × total contract count.
  // Contract count respects lotSize (e.g. NIFTY options 1 lot = 65 units)
  // via the pnlUnits() helper so F&O P&L matches the "₹X per point × N
  // units per lot × M lots" formula users expect.
  const priceDiff = position.side === 'buy'
    ? Number(closePrice) - Number(position.entryPrice)
    : Number(position.entryPrice) - Number(closePrice);
  const realisedPnl = priceDiff * pnlUnits(position);

  // Close commission
  const closeComm = await computeCommission({
    exchange: position.exchange,
    symbol: position.symbol,
    side: position.side
  }, Number(position.volume), pnlUnits(position), Number(closePrice), 'close');

  position.status = 'closed';
  position.closePrice = Number(closePrice);
  position.closeTime = new Date();
  position.closedBy = reason;
  position.profit = realisedPnl - closeComm;
  position.closeCommission = closeComm;
  position.closeCommissionInr = closeComm;
  const totalComm = (Number(position.openCommission) || 0) + closeComm;
  position.commission = totalComm;
  position.commissionInr = totalComm;
  await position.save();

  // Settle on the sub-wallet: balance gets the PnL minus close commission, margin is released.
  account.walletBalance = Number(account.walletBalance) + realisedPnl - closeComm;
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

  let openPositions = await ChallengePosition.find({ challengeAccountId, status: 'open' });

  // Phase 1 — SL/TP trigger evaluation. Trigger conventions match MT5 / the
  // netting engine's _checkPerFillSLTP:
  //   BUY  position marks-to-market at bid. SL hit when bid <= sl, TP when bid >= tp.
  //   SELL position marks-to-market at ask. SL hit when ask >= sl, TP when ask <= tp.
  // The position is closed at the SL/TP level itself (not the crossing
  // price) so realised PnL is deterministic and fair.
  const triggered = [];
  for (const pos of openPositions) {
    const lp = livePrices?.[pos.symbol];
    if (!lp) continue;
    const bid = Number(lp.bid);
    const ask = Number(lp.ask);
    const sl = pos.stopLoss != null ? Number(pos.stopLoss) : null;
    const tp = pos.takeProfit != null ? Number(pos.takeProfit) : null;
    const side = String(pos.side || '').toLowerCase();

    let triggerPrice = null;
    let reason = null;
    if (side === 'buy') {
      if (sl != null && bid > 0 && bid <= sl) { triggerPrice = sl; reason = 'sl'; }
      else if (tp != null && bid > 0 && bid >= tp) { triggerPrice = tp; reason = 'tp'; }
    } else if (side === 'sell') {
      if (sl != null && ask > 0 && ask >= sl) { triggerPrice = sl; reason = 'sl'; }
      else if (tp != null && ask > 0 && ask <= tp) { triggerPrice = tp; reason = 'tp'; }
    }
    if (triggerPrice != null && reason) {
      triggered.push({ positionId: pos.positionId, symbol: pos.symbol, triggerPrice, reason });
    }
  }

  for (const t of triggered) {
    try {
      await closePosition(t.positionId, t.triggerPrice, t.reason);
      console.log(
        `[Challenge SL/TP] ${t.reason.toUpperCase()} hit on ${t.symbol} (${t.positionId}): closed @ ${t.triggerPrice}`
      );
    } catch (err) {
      console.error('[Challenge SL/TP] close error for', t.positionId, err.message);
    }
  }

  // If any positions closed, re-fetch the remaining open list so the
  // mark-to-market + wallet recompute below reflects the closures.
  if (triggered.length > 0) {
    openPositions = await ChallengePosition.find({ challengeAccountId, status: 'open' });
  }

  // Phase 2 — mark-to-market the still-open positions. Floating P&L
  // uses the same pnlUnits() helper as realised P&L so the number the
  // user sees before/after close never jumps.
  for (const pos of openPositions) {
    const lp = livePrices?.[pos.symbol];
    if (!lp) continue;
    const currentPrice = pos.side === 'buy' ? (lp.bid ?? lp.last ?? pos.currentPrice) : (lp.ask ?? lp.last ?? pos.currentPrice);
    pos.currentPrice = Number(currentPrice);
    const priceDiff = pos.side === 'buy'
      ? Number(currentPrice) - Number(pos.entryPrice)
      : Number(pos.entryPrice) - Number(currentPrice);
    pos.profit = priceDiff * pnlUnits(pos);
    await pos.save();
  }

  // Re-read the account — closePosition() above already mutated
  // walletBalance/walletEquity/etc. The `account` variable held the
  // pre-close snapshot.
  const fresh = triggered.length > 0
    ? await ChallengeAccount.findById(challengeAccountId).populate('challengeId')
    : account;
  if (!fresh) return null;

  recomputeWallet(fresh, openPositions);
  fresh.currentBalance = fresh.walletBalance;
  fresh.currentEquity = fresh.walletEquity;
  await fresh.save();

  // Use propTradingEngine's drawdown check (it also handles auto-fail).
  return await propTradingEngine.updateRealTimeEquity(challengeAccountId, fresh.walletEquity);
}

module.exports = {
  openPosition,
  closePosition,
  refreshEquity
};
