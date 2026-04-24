import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * InstrumentPickerModal
 *
 * Opens from the chart-tabs "+" button. Fetches option / futures / equity
 * instruments live from the existing /api/zerodha/instruments/search
 * endpoint (the same one the side-panel Indian search uses), then groups
 * them into an option-chain table (CE | STRIKE | PE) per expiry.
 *
 * Rendered through a React portal to document.body so the card escapes
 * the page's fixed .main-content stacking context — otherwise the
 * topbar would render over the search input.
 */

const CATEGORIES = [
  { key: 'all',        label: 'All',         color: '#64748b',  kind: 'search' },
  { key: 'nifty',      label: 'Nifty',       color: '#10b981',  kind: 'chain',  query: 'NIFTY',      segment: 'nseOpt' },
  { key: 'banknifty',  label: 'BankNifty',   color: '#8b5cf6',  kind: 'chain',  query: 'BANKNIFTY',  segment: 'nseOpt' },
  { key: 'finnifty',   label: 'FinNifty',    color: '#10b981',  kind: 'chain',  query: 'FINNIFTY',   segment: 'nseOpt' },
  { key: 'midcpnifty', label: 'MidcapNifty', color: '#f59e0b',  kind: 'chain',  query: 'MIDCPNIFTY', segment: 'nseOpt' },
  { key: 'sensex',     label: 'Sensex',      color: '#ef4444',  kind: 'chain',  query: 'SENSEX',     segment: 'bseOpt' },
  { key: 'equity',     label: 'Equity',      color: '#3b82f6',  kind: 'flat',   segment: 'nseEq' },
  { key: 'commodity',  label: 'Commodity',   color: '#f97316',  kind: 'flat',   segment: 'mcxFut' }
];

/**
 * The server's search endpoint returns expiry pre-formatted as
 * "30 Apr 2026". Accept either that, a raw ISO string, or anything Date
 * can parse, and output a compact "30 APR 26" pill label.
 */
function formatExpiryDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = String(d.getFullYear()).slice(-2);
    return `${day} ${month} ${year}`;
  }
  // Already a formatted string — normalise "30 Apr 2026" → "30 APR 26".
  return String(value)
    .replace(/(\w{3})/g, (m) => m.toUpperCase())
    .replace(/(\d{4})$/, (y) => y.slice(-2));
}

function pickLtp(inst, livePriceOf) {
  if (!inst) return 0;
  const live = livePriceOf ? livePriceOf(inst) : null;
  const src = live || inst;
  return Number(src?.lastPrice ?? src?.last ?? src?.ltp ?? src?.bid ?? src?.ask ?? 0) || 0;
}

export default function InstrumentPickerModal({
  open,
  onClose,
  onSelect,
  apiUrl,
  getInstrumentWithLivePrice,
  zerodhaTicks
}) {
  const [category, setCategory] = useState('nifty');
  const [expiry, setExpiry] = useState(null);
  const [query, setQuery] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  // Cache fetched instruments per category so re-opening is instant.
  const [cache, setCache] = useState({});        // { [catKey]: Instrument[] }
  // Flat-mode search results (separate from the category cache).
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const searchRef = useRef(null);
  const atmRowRef = useRef(null);
  const fetchAbortRef = useRef(null);
  const searchAbortRef = useRef(null);

  const activeCategory = useMemo(
    () => CATEGORIES.find(c => c.key === category) || CATEGORIES[1],
    [category]
  );

  // Focus search on open + reset transient state.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setQuery('');
      searchRef.current?.focus();
    }, 60);
    return () => clearTimeout(t);
  }, [open]);

  // Close on Esc.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  /* ── Per-category instrument fetch ────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    if (activeCategory.kind === 'search') return;                 // "All"
    if (cache[category]) return;                                  // cached
    if (!activeCategory.query && !activeCategory.segment) return; // nothing to fetch

    // Abort any in-flight fetch from a prior category switch.
    fetchAbortRef.current?.abort();
    const ctrl = new AbortController();
    fetchAbortRef.current = ctrl;

    const params = new URLSearchParams();
    // Server requires `query` ≥ 2 chars. For flat categories without an
    // obvious query, use a broad prefix so we get a first page of rows.
    const q = activeCategory.query
      || (activeCategory.segment === 'nseEq' ? 'A' : 'GOLD');
    params.set('query', q);
    if (activeCategory.segment) params.set('segment', activeCategory.segment);

    // Defer the initial setState + network call so the setState isn't
    // synchronous-in-effect (react-hooks linter complains otherwise). The
    // microtask runs before the browser paints so the user still sees the
    // loading spinner on the next frame.
    queueMicrotask(() => {
      if (ctrl.signal.aborted) return;
      setFetching(true);
      setFetchError(null);
      fetch(`${apiUrl}/api/zerodha/instruments/search?${params.toString()}`, { signal: ctrl.signal })
        .then(r => r.json())
        .then(data => {
          if (ctrl.signal.aborted) return;
          if (data?.success) {
            const list = Array.isArray(data.instruments) ? data.instruments : [];
            setCache(prev => ({ ...prev, [category]: list }));
          } else {
            setFetchError(data?.error || 'Failed to load instruments');
          }
        })
        .catch(err => {
          if (err?.name === 'AbortError') return;
          setFetchError(err?.message || 'Network error');
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setFetching(false);
        });
    });

    return () => ctrl.abort();
  }, [open, category, activeCategory, cache, apiUrl]);

  /* ── Flat-mode search (All tab OR user types anywhere) ────────────── */
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    const shouldSkip =
      (activeCategory.kind === 'chain' && (q === '' || /^\d+$/.test(q))) ||
      q.length < 2;

    searchAbortRef.current?.abort();
    const ctrl = new AbortController();
    searchAbortRef.current = ctrl;

    // Defer all setState to a microtask so the effect body stays clean
    // (react-hooks lint rule).
    let timer = null;
    queueMicrotask(() => {
      if (ctrl.signal.aborted) return;
      if (shouldSkip) {
        setSearchResults([]);
        setSearchLoading(false);
        return;
      }
      const params = new URLSearchParams();
      params.set('query', q);
      const seg = activeCategory.segment || 'nseEq';
      params.set('segment', seg);

      setSearchLoading(true);
      timer = setTimeout(() => {
        fetch(`${apiUrl}/api/zerodha/instruments/search?${params.toString()}`, { signal: ctrl.signal })
          .then(r => r.json())
          .then(data => {
            if (ctrl.signal.aborted) return;
            setSearchResults(Array.isArray(data?.instruments) ? data.instruments : []);
          })
          .catch(err => { if (err?.name !== 'AbortError') setSearchResults([]); })
          .finally(() => { if (!ctrl.signal.aborted) setSearchLoading(false); });
      }, 220);
    });

    return () => { if (timer) clearTimeout(timer); ctrl.abort(); };
  }, [open, query, category, activeCategory, apiUrl]);

  const scopedInstruments = useMemo(
    () => cache[category] || [],
    [cache, category]
  );

  // Expiries for the current chain category, sorted ascending.
  const expiries = useMemo(() => {
    if (activeCategory.kind !== 'chain') return [];
    const set = new Set();
    for (const i of scopedInstruments) {
      const t = String(i.instrumentType || i.instrument_type || '').toUpperCase();
      if ((t === 'CE' || t === 'PE') && i.expiry) set.add(i.expiry);
    }
    const arr = Array.from(set);
    arr.sort((a, b) => {
      const da = new Date(a).getTime();
      const db = new Date(b).getTime();
      if (Number.isNaN(da) && Number.isNaN(db)) return a.localeCompare(b);
      if (Number.isNaN(da)) return 1;
      if (Number.isNaN(db)) return -1;
      return da - db;
    });
    return arr;
  }, [scopedInstruments, activeCategory]);

  // Derive the effective expiry so we don't need a useEffect to keep it
  // in sync with the category switch.
  const effectiveExpiry = useMemo(() => {
    if (expiries.length === 0) return null;
    if (expiry && expiries.includes(expiry)) return expiry;
    return expiries[0];
  }, [expiries, expiry]);

  /* ── Live-price resolver ──────────────────────────────────────────── */
  const livePriceOf = useMemo(() => {
    return (inst) => {
      if (!inst) return null;
      // 1. Zerodha ticks by instrument token (WebSocket stream).
      if (zerodhaTicks && inst.token && zerodhaTicks[inst.token]) {
        return zerodhaTicks[inst.token];
      }
      // 2. Outlet helper merges static + live, already in use by MarketPage.
      if (getInstrumentWithLivePrice) {
        try { return getInstrumentWithLivePrice(inst); } catch { /* ignore */ }
      }
      return inst;
    };
  }, [zerodhaTicks, getInstrumentWithLivePrice]);

  /* ── Option-chain rows for the selected expiry ───────────────────── */
  const chainRows = useMemo(() => {
    if (activeCategory.kind !== 'chain' || !effectiveExpiry) return [];
    const byStrike = new Map();
    for (const i of scopedInstruments) {
      if (i.expiry !== effectiveExpiry) continue;
      const t = String(i.instrumentType || i.instrument_type || '').toUpperCase();
      if (t !== 'CE' && t !== 'PE') continue;
      const strike = Number(i.strike);
      if (!Number.isFinite(strike) || strike <= 0) continue;
      if (!byStrike.has(strike)) byStrike.set(strike, { strike, ce: null, pe: null });
      byStrike.get(strike)[t === 'CE' ? 'ce' : 'pe'] = i;
    }
    return Array.from(byStrike.values()).sort((a, b) => a.strike - b.strike);
  }, [scopedInstruments, effectiveExpiry, activeCategory]);

  // ATM detection + live underlying spot, both derived from option LTPs
  // via put-call parity: for any strike with both CE & PE quoted,
  //   spot ≈ strike + (CE_LTP − PE_LTP)
  // We pick the strike whose CE ≈ PE as the ATM row (tightest spread =
  // nearest to spot), then average the parity estimate across the handful
  // of strikes closest to that one so the spot number is stable and ticks
  // live as LTPs change. Falls back to the chain midpoint / null if
  // nothing's streaming yet.
  const { atmStrike, atmSpot } = useMemo(() => {
    if (chainRows.length === 0) return { atmStrike: null, atmSpot: null };

    // 1. Find the strike where CE and PE are closest (ATM proxy).
    let best = null;
    let bestSpread = Infinity;
    const parityEstimates = [];
    for (const r of chainRows) {
      const ce = pickLtp(r.ce, livePriceOf);
      const pe = pickLtp(r.pe, livePriceOf);
      if (ce > 0 && pe > 0) {
        parityEstimates.push({ strike: r.strike, spot: r.strike + (ce - pe) });
        const spread = Math.abs(ce - pe);
        if (spread < bestSpread) { bestSpread = spread; best = r; }
      }
    }

    const strike = best
      ? best.strike
      : (chainRows[Math.floor(chainRows.length / 2)]?.strike ?? null);

    if (parityEstimates.length === 0) return { atmStrike: strike, atmSpot: null };

    // 2. Average the parity estimate across the 5 strikes nearest the ATM.
    //    Distant deep-ITM / deep-OTM strikes are noisier (wide bid-ask),
    //    so we only trust the cluster around the money.
    const near = [...parityEstimates]
      .sort((a, b) => Math.abs(a.strike - strike) - Math.abs(b.strike - strike))
      .slice(0, 5);
    const spot = near.reduce((s, x) => s + x.spot, 0) / near.length;

    return { atmStrike: strike, atmSpot: Number.isFinite(spot) ? spot : null };
  }, [chainRows, livePriceOf]);

  // Scroll ATM into view when the chain (re)loads.
  useEffect(() => {
    if (!open || !atmStrike) return;
    const t = setTimeout(() => {
      atmRowRef.current?.scrollIntoView({ behavior: 'auto', block: 'center' });
    }, 120);
    return () => clearTimeout(t);
  }, [open, atmStrike, effectiveExpiry, category]);

  /* ── What to render ──────────────────────────────────────────────── */
  const showSearchList = (
    activeCategory.kind === 'search' ||
    activeCategory.kind === 'flat' ||
    (activeCategory.kind === 'chain' && query.trim().length >= 2 && !/^\d+$/.test(query.trim()))
  );

  const flatRows = showSearchList
    ? (query.trim().length >= 2 ? searchResults : scopedInstruments)
    : [];

  if (!open) return null;

  const body = (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
          zIndex: 99998
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
          width: 'min(860px, 96vw)', height: 'min(760px, 92vh)',
          background: 'var(--bg-primary, #0f172a)',
          border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          zIndex: 99999
        }}
      >
        {/* Header: search + close */}
        <div style={{
          padding: '14px 16px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0
        }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 10, padding: '10px 14px'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>🔍</span>
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search instruments..."
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                color: 'var(--text-primary)', fontSize: 14
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}
              >
                ×
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', cursor: 'pointer', fontSize: 16
            }}
          >
            ×
          </button>
        </div>

        {/* Category pills */}
        <div style={{
          padding: '10px 16px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0
        }}>
          {CATEGORIES.map(c => {
            const active = category === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => { setCategory(c.key); setExpiry(null); }}
                style={{
                  flex: '0 0 auto', padding: '6px 14px', borderRadius: 999,
                  border: `1px solid ${active ? 'var(--text-primary)' : 'var(--border-color)'}`,
                  background: active ? 'var(--bg-secondary)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  whiteSpace: 'nowrap'
                }}
              >
                {c.color && c.key !== 'all' && (
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: c.color }} />
                )}
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Expiry pills (chain mode only) */}
        {activeCategory.kind === 'chain' && expiries.length > 0 && (
          <div style={{
            padding: '10px 16px', borderBottom: '1px solid var(--border-color)',
            display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0
          }}>
            {expiries.map(e => {
              const active = e === effectiveExpiry;
              return (
                <button
                  key={e}
                  type="button"
                  onClick={() => setExpiry(e)}
                  style={{
                    flex: '0 0 auto', padding: '6px 12px', borderRadius: 999,
                    border: `1px solid ${active ? 'var(--text-primary)' : 'var(--border-color)'}`,
                    background: active ? 'var(--bg-secondary)' : 'transparent',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {formatExpiryDate(e)}
                </button>
              );
            })}
          </div>
        )}

        {/* Body: chain / flat / empty / loading */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
          {(fetching || searchLoading) && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>⏳</div>
              Loading instruments…
            </div>
          )}

          {!fetching && fetchError && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#ef4444', fontSize: 13 }}>
              Failed to load: {fetchError}
            </div>
          )}

          {/* Option chain */}
          {!fetching && !fetchError && activeCategory.kind === 'chain' && !showSearchList && chainRows.length > 0 && (
            <OptionChain
              rows={chainRows}
              expiry={effectiveExpiry}
              atmStrike={atmStrike}
              atmSpot={atmSpot}
              atmRowRef={atmRowRef}
              query={query}
              livePriceOf={livePriceOf}
              onPick={(sym) => { onSelect?.(sym); onClose?.(); }}
            />
          )}

          {/* Flat list / search-results view */}
          {!fetching && !fetchError && !searchLoading && showSearchList && flatRows.length > 0 && (
            <FlatList
              rows={flatRows}
              livePriceOf={livePriceOf}
              onPick={(sym) => { onSelect?.(sym); onClose?.(); }}
            />
          )}

          {/* Empty states */}
          {!fetching && !fetchError && !searchLoading && activeCategory.kind === 'chain' && !showSearchList && chainRows.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
                No contracts found
              </div>
              <div style={{ fontSize: 12 }}>
                {scopedInstruments.length === 0
                  ? 'Nothing returned for this index — the Zerodha instrument list may still be syncing.'
                  : 'Pick another expiry or category.'}
              </div>
            </div>
          )}

          {!fetching && !fetchError && !searchLoading && showSearchList && flatRows.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔎</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
                {query.trim().length < 2 ? 'Start typing to search' : 'No matches'}
              </div>
              <div style={{ fontSize: 12 }}>
                {query.trim().length < 2
                  ? 'Search across every tradable symbol.'
                  : 'Try a different keyword.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // Portal to body so the modal escapes MarketPage's fixed .main-content
  // stacking context — otherwise the topbar would paint over the header.
  return createPortal(body, document.body);
}

/* ────────────────────────────────────────────────────────────────────── */
/* Option chain                                                          */
/* ────────────────────────────────────────────────────────────────────── */
function OptionChain({ rows, expiry, atmStrike, atmSpot, atmRowRef, query, livePriceOf, onPick }) {
  const expiryLabel = formatExpiryDate(expiry);
  const atmLabel = Number.isFinite(atmSpot)
    ? `ATM ${Number(atmSpot).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`
    : 'ATM';

  const filteredRows = useMemo(() => {
    const q = query.trim();
    if (!q) return rows;
    if (/^\d+$/.test(q)) return rows.filter(r => String(r.strike).includes(q));
    return rows;
  }, [rows, query]);

  return (
    <div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 160px 1fr',
        padding: '10px 20px', fontSize: 11, fontWeight: 700,
        letterSpacing: 0.4, color: 'var(--text-secondary)',
        background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 2,
        borderBottom: '1px solid var(--border-color)'
      }}>
        <span style={{ color: '#10b981', textAlign: 'center' }}>CE</span>
        <span style={{ textAlign: 'center' }}>STRIKE</span>
        <span style={{ color: '#ef4444', textAlign: 'center' }}>PE</span>
      </div>

      {filteredRows.map(r => {
        const isATM = r.strike === atmStrike;
        const ceLtp = pickLtp(r.ce, livePriceOf);
        const peLtp = pickLtp(r.pe, livePriceOf);
        return (
          <div
            key={r.strike}
            ref={isATM ? atmRowRef : null}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 160px 1fr',
              borderBottom: '1px solid var(--border-color)',
              background: isATM ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
              position: 'relative'
            }}
          >
            {isATM && (
              <div style={{
                position: 'absolute',
                top: -1, left: '50%', transform: 'translate(-50%, -100%)',
                background: '#f59e0b', color: '#fff',
                padding: '3px 12px', borderRadius: '8px 8px 0 0',
                fontSize: 11, fontWeight: 700, letterSpacing: 0.4,
                pointerEvents: 'none', whiteSpace: 'nowrap',
                boxShadow: '0 -2px 8px rgba(245, 158, 11, 0.3)'
              }}>
                {atmLabel}
              </div>
            )}

            <ChainCell inst={r.ce} ltp={ceLtp} expiryLabel={expiryLabel} align="left"  onPick={onPick} />
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700,
              color: isATM ? '#f59e0b' : 'var(--text-primary)'
            }}>
              {r.strike.toLocaleString('en-IN')}
            </div>
            <ChainCell inst={r.pe} ltp={peLtp} expiryLabel={expiryLabel} align="right" onPick={onPick} />
          </div>
        );
      })}
    </div>
  );
}

function ChainCell({ inst, ltp, expiryLabel, align, onPick }) {
  if (!inst) {
    return (
      <div style={{ padding: '14px 18px', color: 'var(--text-secondary)', textAlign: align, fontSize: 12, opacity: 0.4 }}>
        —
      </div>
    );
  }
  const sym = inst.tradingsymbol || inst.symbol || '';
  return (
    <button
      type="button"
      onClick={() => onPick?.(sym)}
      style={{
        padding: '14px 18px', textAlign: align,
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: 'var(--text-primary)', width: '100%'
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.2 }}>
        {inst.name || sym}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
        {expiryLabel}{ltp > 0 ? ` · LTP ₹${ltp.toFixed(2)}` : ''}
      </div>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Flat list — equity / commodity / search                               */
/* ────────────────────────────────────────────────────────────────────── */
function FlatList({ rows, livePriceOf, onPick }) {
  return (
    <div>
      {rows.slice(0, 500).map((inst, idx) => {
        const sym = inst.tradingsymbol || inst.symbol || '';
        const ltp = pickLtp(inst, livePriceOf);
        const live = livePriceOf ? livePriceOf(inst) : null;
        const change = Number(live?.change) || 0;
        return (
          <button
            key={`${sym}-${idx}`}
            type="button"
            onClick={() => onPick?.(sym)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
              width: '100%', padding: '12px 20px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-primary)', textAlign: 'left',
              borderBottom: '1px solid var(--border-color)'
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {sym}
              </div>
              {inst.name && inst.name !== sym && (
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {inst.name}{inst.expiry ? ` · ${formatExpiryDate(inst.expiry)}` : ''}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {ltp > 0 ? `₹${ltp.toFixed(2)}` : '—'}
              </div>
              {change !== 0 && (
                <div style={{ fontSize: 10, color: change >= 0 ? '#10b981' : '#ef4444' }}>
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
