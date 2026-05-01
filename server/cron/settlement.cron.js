/**
 * Settlement Cron Jobs
 * Handles scheduled tasks for IB systems
 * Includes auto square-off for Indian markets (excludes MCX)
 */

const settlementService = require('../services/settlement.service');
const NettingEngine = require('../engines/NettingEngine');
const HedgingEngine = require('../engines/HedgingEngine');
const { NettingPosition } = require('../models/Position');

// Store interval references for cleanup
let dailySettlementInterval = null;
let endOfDayInterval = null;
let autoSquareOffInterval = null;
let optionExpirySettlementInterval = null;
let swapSchedulerInterval = null; // Fix 23: per-minute swap scheduler
let challengeExpirySweepInterval = null;
let challengeDailyResetTimeout = null;
let challengeDailyResetInterval = null;

// Netting engine instance for auto square-off
let nettingEngine = null;
// Socket.IO reference for notifications
let ioRef = null;

/**
 * Set Socket.IO reference for expiry notifications
 */
function setSocketIO(io) {
  ioRef = io;
}

/**
 * Initialize cron jobs
 */
function initializeCronJobs() {
  console.log('[Cron] Initializing settlement cron jobs...');

  // Daily settlement at midnight UTC
  // Using setInterval for simplicity - in production, use node-cron or similar
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0); // Next midnight UTC
  
  const msUntilMidnight = midnight.getTime() - now.getTime();
  
  // Schedule first run at midnight, then every 24 hours
  setTimeout(() => {
    runDailySettlement();
    dailySettlementInterval = setInterval(runDailySettlement, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);

  console.log(`[Cron] Daily settlement scheduled for ${midnight.toISOString()}`);

  // End of day settlement (5 PM UTC - typical market close).
  // Fix 23: this no longer applies overnight swap — swap is now driven by
  // the per-minute scheduler below using each segment's `swapTime` field.
  // Daily/EOD settlement still runs the legacy non-swap settlement service.
  const fivePM = new Date(now);
  fivePM.setUTCHours(17, 0, 0, 0);
  if (fivePM <= now) {
    fivePM.setDate(fivePM.getDate() + 1);
  }

  const msUntilFivePM = fivePM.getTime() - now.getTime();

  setTimeout(() => {
    runEndOfDaySettlement();
    endOfDayInterval = setInterval(runEndOfDaySettlement, 24 * 60 * 60 * 1000);
  }, msUntilFivePM);

  console.log(`[Cron] End-of-day settlement scheduled for ${fivePM.toISOString()}`);

  // Initialize netting engine for auto square-off
  nettingEngine = new NettingEngine(null);

  // Fix 23: per-minute swap scheduler. Replaces the once-per-day swap call
  // that used to run inside runEndOfDaySettlement(). Each tick checks every
  // NettingSegment doc; segments whose `swapTime` matches the current IST
  // minute (and haven't already had swap applied today) get processed.
  swapSchedulerInterval = setInterval(runSwapScheduler, 60 * 1000);
  // Run once immediately at startup so a process restart at e.g. 22:30:30
  // still catches the 22:30 segments instead of waiting until 22:31.
  runSwapScheduler().catch(err => console.error('[SwapScheduler] initial run error:', err.message));
  console.log('[Cron] Per-minute swap scheduler initialized (Fix 23)');
  
  // Auto square-off check - runs every minute during Indian market hours
  // Triggers at 15:15 for NSE/NFO/BSE/BFO, 16:55 for CDS
  // MCX is EXCLUDED from auto square-off
  autoSquareOffInterval = setInterval(checkAutoSquareOff, 60 * 1000); // Every 1 minute
  console.log('[Cron] Auto square-off scheduler initialized (excludes MCX)');

  // Prop-trading challenge expiry sweep — every 30 minutes.
  // Flips ACTIVE accounts past expiresAt to EXPIRED without waiting for the
  // user to trigger a trade (the on-trade check was the only enforcement).
  challengeExpirySweepInterval = setInterval(runChallengeExpirySweep, 30 * 60 * 1000);
  runChallengeExpirySweep().catch(err => console.error('[ChallengeExpiry] initial run error:', err.message));
  console.log('[Cron] Prop challenge expiry sweep scheduled (every 30 min)');

  // Prop-trading daily reset — at 00:05 IST every day, snapshots each active
  // challenge account's dayStartEquity and resets lowestEquityToday. Without
  // this, accounts that sit idle overnight never get their daily metrics
  // rolled and the next-day DD comparison is wrong.
  const nowForDailyReset = new Date();
  const next0005IST = new Date(nowForDailyReset);
  next0005IST.setUTCHours(18, 35, 0, 0); // 00:05 IST = 18:35 UTC (prev day)
  if (next0005IST <= nowForDailyReset) {
    next0005IST.setUTCDate(next0005IST.getUTCDate() + 1);
  }
  const msUntilNext = next0005IST.getTime() - nowForDailyReset.getTime();
  challengeDailyResetTimeout = setTimeout(() => {
    runChallengeDailyReset().catch(err => console.error('[ChallengeDailyReset] error:', err.message));
    challengeDailyResetInterval = setInterval(runChallengeDailyReset, 24 * 60 * 60 * 1000);
  }, msUntilNext);
  console.log(`[Cron] Prop challenge daily reset scheduled at ${next0005IST.toISOString()} (00:05 IST)`);

  // F&O option expiry: intrinsic settlement after exchange close on expiry day (IST)
  optionExpirySettlementInterval = setInterval(checkOptionExpirySettlement, 2 * 60 * 1000);
  console.log('[Cron] Option expiry settlement scheduler initialized (every 2 min, IST weekdays)');
}

/**
 * Cash-settle netting option positions at intrinsic value; cancel pending on expired contracts.
 * Also sends notifications to users about their expired positions.
 */
async function checkOptionExpirySettlement() {
  if (!nettingEngine) {
    nettingEngine = new NettingEngine(null);
  }
  try {
    const result = await nettingEngine.settleExpiredNettingOptionPositions(ioRef);
    
    // Notify users about their closed positions
    if (result && (result.settled > 0 || result.cancelled > 0) && ioRef) {
      // Get unique users who had positions settled
      const settledUsers = result.settledPositions || [];
      for (const pos of settledUsers) {
        if (pos.userId) {
          ioRef.to(pos.userId).emit('expirySettlement', {
            type: 'position_closed',
            symbol: pos.symbol,
            profit: pos.profit,
            message: `Your ${pos.symbol} position was automatically closed due to contract expiry. P/L: ${pos.profit >= 0 ? '+' : ''}${pos.profit?.toFixed(2) || 0}`
          });
          
          // Also emit position update
          const updatedPositions = await NettingPosition.find({ userId: pos.userId, status: 'open' }).lean();
          ioRef.to(pos.userId).emit('positionUpdate', { 
            mode: 'netting', 
            positions: updatedPositions.map(p => ({ ...p, mode: 'netting' }))
          });
        }
      }
    }
  } catch (error) {
    console.error('[Cron] Option expiry settlement error:', error.message);
  }
}

/**
 * Run daily settlement
 */
async function runDailySettlement() {
  console.log('[Cron] Running daily settlement...');
  try {
    const results = await settlementService.runDailySettlement();
    console.log('[Cron] Daily settlement completed:', results);
  } catch (error) {
    console.error('[Cron] Daily settlement error:', error);
  }
}

/**
 * Run end of day settlement.
 *
 * Fix 23: NETTING swap is no longer applied here — it's driven by the
 * per-minute scheduler `runSwapScheduler` which honors each NettingSegment's
 * configurable `swapTime` field. HEDGING swap still runs at 17:00 UTC EOD
 * via the legacy path because hedging segments don't have a swapTime field
 * yet.
 */
async function runEndOfDaySettlement() {
  console.log('[Cron] Running end-of-day settlement...');
  try {
    await settlementService.processEndOfDaySettlement();
    console.log('[Cron] End-of-day settlement completed');

    // Hedging swap (legacy 17:00 UTC trigger)
    await applyHedgingOvernightSwap();
  } catch (error) {
    console.error('[Cron] End-of-day settlement error:', error);
  }
}

/**
 * Per-minute swap scheduler — Fix 23.
 *
 * Walks every NettingSegment, finds the ones whose `swapTime` matches the
 * current IST minute, and applies overnight swap to all open positions in
 * those segments. Idempotent via `lastSwapAppliedDate` — a segment that's
 * already been processed for today's IST date is skipped on later ticks.
 */
async function runSwapScheduler() {
  try {
    const NettingSegment = require('../models/NettingSegment');

    // IST snapshot — we run on this clock regardless of server timezone.
    const nowUtc = new Date();
    const istNow = new Date(nowUtc.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const hh = String(istNow.getHours()).padStart(2, '0');
    const mm = String(istNow.getMinutes()).padStart(2, '0');
    const currentISTMinute = `${hh}:${mm}`;
    const todayISTDate = `${istNow.getFullYear()}-${String(istNow.getMonth() + 1).padStart(2, '0')}-${String(istNow.getDate()).padStart(2, '0')}`;

    // Find segments whose swapTime matches now AND haven't been processed today.
    // We do the date check in JS (not Mongo) so a null/undefined lastSwapAppliedDate
    // is also treated as "due".
    const segments = await NettingSegment.find({ swapTime: currentISTMinute }).lean();
    const dueSegments = segments.filter(s => s.lastSwapAppliedDate !== todayISTDate);

    if (dueSegments.length === 0) return;

    console.log(`[SwapScheduler] ${dueSegments.length} segment(s) due for swap at IST ${currentISTMinute}: ${dueSegments.map(s => s.name).join(', ')}`);

    if (!nettingEngine) {
      nettingEngine = new NettingEngine(null);
    }

    for (const seg of dueSegments) {
      try {
        const result = await nettingEngine.applyOvernightSwap({ segmentName: seg.name });
        // Mark this segment as processed for today, even if 0 positions matched
        // (otherwise we'd re-fire every minute until something opens).
        await NettingSegment.updateOne(
          { _id: seg._id },
          { $set: { lastSwapAppliedDate: todayISTDate } }
        );
        console.log(`[SwapScheduler] Segment ${seg.name} → ${result.positionsProcessed} position(s), total swap ${result.totalSwapCharged.toFixed(2)} (marked ${todayISTDate})`);
      } catch (err) {
        console.error(`[SwapScheduler] Error processing segment ${seg.name}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[SwapScheduler] Top-level error:', err.message);
  }
}

/**
 * Apply overnight swap to HEDGING-mode positions only — Fix 23.
 *
 * Netting positions are now handled by `runSwapScheduler` (per-minute, with
 * per-segment swapTime). This function preserves the legacy 17:00 UTC EOD
 * behavior for hedging until the same per-segment scheduling is added there.
 */
async function applyHedgingOvernightSwap() {
  console.log('[Cron] Applying overnight swap (hedging)...');
  try {
    const hedgingEngine = new HedgingEngine();
    const hedgingSwap = await hedgingEngine.applyOvernightSwap();
    console.log('[Cron] Hedging overnight swap:', {
      positionsProcessed: hedgingSwap.positionsProcessed,
      totalSwapCharged: hedgingSwap.totalSwapCharged.toFixed(2),
      dayOfWeek: hedgingSwap.dayOfWeek
    });
  } catch (error) {
    console.error('[Cron] Hedging overnight swap error:', error);
  }
}

/**
 * Check and execute auto square-off for Indian markets
 * Runs every minute during market hours
 * EXCLUDES: MCX (commodity futures/options)
 */
async function checkAutoSquareOff() {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = ist.getDay();
  
  // Skip weekends
  if (day === 0 || day === 6) return;
  
  const currentHour = ist.getHours();
  const currentMinute = ist.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  // Market square-off times (IST) — MUST match NettingEngine.marketTimings.squareOffTime.
  // Cutoff moved from 15:30 → 15:15 so prop traders get squared off and
  // blocked from placing new orders 15 minutes before the official close.
  const squareOffTimes = {
    NSE: 15 * 60 + 15,  // 15:15 IST
    NFO: 15 * 60 + 15,  // 15:15 IST
    BSE: 15 * 60 + 15,  // 15:15 IST
    BFO: 15 * 60 + 15,  // 15:15 IST
    CDS: 16 * 60 + 55   // 16:55 IST
    // MCX EXCLUDED - no auto square-off
  };

  // Check if any market needs square-off (within 10-minute window)
  const needsSquareOff = Object.values(squareOffTimes).some(time =>
    currentTime >= time && currentTime < time + 10
  );

  if (needsSquareOff && nettingEngine) {
    console.log(`[Auto Square-Off] Checking positions at ${ist.toLocaleTimeString('en-IN')}`);
    try {
      // Get current prices from Zerodha service (empty object as fallback)
      const ZerodhaService = require('../services/zerodha.service');
      const currentPrices = ZerodhaService.getLastPrices ? ZerodhaService.getLastPrices() : {};

      await nettingEngine.autoSquareOff(currentPrices);
    } catch (error) {
      console.error('[Auto Square-Off] Error:', error.message);
    }
  }

  // Prop-challenge intraday auto-close — fire ONCE per day, exactly at 15:15
  // IST. Always runs (no per-admin opt-in) so every ACTIVE/FUNDED challenge
  // account on Indian instruments is force-closed at the last-known LTP.
  // The exact-minute gate prevents double-firing across the cron's 10-minute
  // square-off window above.
  if (currentTime === 15 * 60 + 15) {
    runChallengeMarketCloseSquareOff().catch(err =>
      console.error('[ChallengeMarketClose] error:', err.message)
    );
  }
}

/**
 * Force-close every open ChallengePosition belonging to admins whose
 * PropSettings.autoCloseAtMarketClose is true. Called at 15:30 IST on
 * weekdays. Uses last-known Zerodha LTP as exit price; falls back to the
 * position's currentPrice / entryPrice when no live price is cached.
 */
async function runChallengeMarketCloseSquareOff() {
  const ChallengeAccount = require('../models/ChallengeAccount');
  const { ChallengePosition } = require('../models/Position');
  const challengePropEngine = require('../services/challengePropEngine.service');
  const ZerodhaService = require('../services/zerodha.service');

  // Always close every open Indian-segment position on every ACTIVE/FUNDED
  // challenge — no per-admin opt-in. Non-Indian segments (FOREX/CRYPTO etc.)
  // are skipped so 24/7 markets keep running.
  const accounts = await ChallengeAccount.find({
    status: { $in: ['ACTIVE', 'FUNDED'] }
  }).select('_id').lean();
  if (accounts.length === 0) return;
  const accountIds = accounts.map(a => a._id);

  const INDIAN_EX = new Set(['NSE', 'NFO', 'BSE', 'BFO', 'CDS']);
  const openPositions = await ChallengePosition.find({
    challengeAccountId: { $in: accountIds },
    status: 'open'
  }).lean();
  const indianOpen = openPositions.filter(p => INDIAN_EX.has(String(p.exchange || '').toUpperCase()));
  if (indianOpen.length === 0) return;

  console.log(`[ChallengeMarketClose] Closing ${indianOpen.length} open Indian challenge position(s) at 15:15 IST`);
  const lastPrices = ZerodhaService.getLastPrices ? ZerodhaService.getLastPrices() : {};
  let closed = 0;
  let failed = 0;
  for (const pos of indianOpen) {
    try {
      const lp = lastPrices[pos.symbol] || {};
      const px = pos.side === 'buy'
        ? Number(lp.bid ?? lp.last ?? pos.currentPrice ?? pos.entryPrice)
        : Number(lp.ask ?? lp.last ?? pos.currentPrice ?? pos.entryPrice);
      if (!Number.isFinite(px) || px <= 0) { failed++; continue; }
      const result = await challengePropEngine.closePosition(pos.positionId, px, 'auto-market-close');
      if (result?.success) closed++; else failed++;
    } catch (err) {
      console.error(`[ChallengeMarketClose] failed on ${pos.positionId}:`, err.message);
      failed++;
    }
  }
  console.log(`[ChallengeMarketClose] Done — ${closed} closed, ${failed} failed`);
}

/**
 * Manual trigger for daily settlement (admin use)
 */
async function triggerDailySettlement() {
  return await settlementService.runDailySettlement();
}

/**
 * Manual trigger for end-of-day settlement (admin use)
 */
async function triggerEndOfDaySettlement() {
  return await settlementService.processEndOfDaySettlement();
}

/**
 * Manual trigger: run F&O option expiry settlement (same logic as the 2‑minute cron).
 */
async function triggerOptionExpirySettlement() {
  if (!nettingEngine) {
    nettingEngine = new NettingEngine(null);
  }
  return await nettingEngine.settleExpiredNettingOptionPositions();
}

/**
 * Prop challenge expiry sweep — finds ACTIVE accounts past their expiresAt
 * and flips them to EXPIRED. Runs every 30 minutes. Idempotent.
 */
async function runChallengeExpirySweep() {
  try {
    const ChallengeAccount = require('../models/ChallengeAccount');
    const now = new Date();
    const result = await ChallengeAccount.updateMany(
      { status: 'ACTIVE', expiresAt: { $lt: now } },
      { $set: { status: 'EXPIRED', expiredAt: now } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[ChallengeExpiry] Marked ${result.modifiedCount} challenge account(s) as EXPIRED`);
    }
  } catch (err) {
    console.error('[ChallengeExpiry] sweep error:', err.message);
  }
}

/**
 * Prop challenge daily reset — at 00:05 IST, snapshots dayStartEquity and
 * resets lowestEquityToday + tradesToday on every ACTIVE/FUNDED account.
 * ChallengeAccount.resetDailyStats() already encapsulates the mutation.
 */
async function runChallengeDailyReset() {
  try {
    const ChallengeAccount = require('../models/ChallengeAccount');
    const accounts = await ChallengeAccount.find({ status: { $in: ['ACTIVE', 'FUNDED'] } });
    let touched = 0;
    for (const acc of accounts) {
      try {
        if (typeof acc.resetDailyStats === 'function') {
          await acc.resetDailyStats();
          touched += 1;
        } else {
          acc.dayStartEquity = acc.currentEquity;
          acc.lowestEquityToday = acc.currentEquity;
          acc.tradesToday = 0;
          acc.currentDailyDrawdownPercent = 0;
          await acc.save();
          touched += 1;
        }
      } catch (innerErr) {
        console.error(`[ChallengeDailyReset] account ${acc._id} error:`, innerErr.message);
      }
    }
    console.log(`[ChallengeDailyReset] Reset daily stats on ${touched} challenge account(s)`);
  } catch (err) {
    console.error('[ChallengeDailyReset] run error:', err.message);
  }
}

/**
 * Cleanup cron jobs on shutdown
 */
function cleanupCronJobs() {
  if (dailySettlementInterval) {
    clearInterval(dailySettlementInterval);
  }
  if (endOfDayInterval) {
    clearInterval(endOfDayInterval);
  }
  if (autoSquareOffInterval) {
    clearInterval(autoSquareOffInterval);
  }
  if (optionExpirySettlementInterval) {
    clearInterval(optionExpirySettlementInterval);
  }
  if (swapSchedulerInterval) {
    clearInterval(swapSchedulerInterval);
  }
  if (challengeExpirySweepInterval) {
    clearInterval(challengeExpirySweepInterval);
  }
  if (challengeDailyResetTimeout) {
    clearTimeout(challengeDailyResetTimeout);
  }
  if (challengeDailyResetInterval) {
    clearInterval(challengeDailyResetInterval);
  }
  console.log('[Cron] Cron jobs cleaned up');
}

module.exports = {
  initializeCronJobs,
  setSocketIO,
  triggerDailySettlement,
  triggerEndOfDaySettlement,
  triggerOptionExpirySettlement,
  triggerSwapScheduler: runSwapScheduler, // Fix 23: manual trigger for swap scheduler
  cleanupCronJobs
};
