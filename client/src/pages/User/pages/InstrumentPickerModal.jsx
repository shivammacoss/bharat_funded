import { useState, useMemo, useEffect, useRef } from 'react';

/**
 * InstrumentPickerModal
 *
 * Full-screen (desktop-centered / mobile-sheet) picker that opens from the
 * chart tabs "+" button. It renders:
 *   1. A top search bar that filters across every loaded instrument.
 *   2. A category pill row (All · Nifty · BankNifty · FinNifty · MidcapNifty
 *      · Sensex · Equity · Commodity · Futures).
 *   3. For index-option categories, an expiry pill row + an option-chain
 *      table (CE | STRIKE | PE) with live LTPs per cell and an "ATM"
 *      highlight row on the nearest strike.
 *   4. For flat categories (Equity, Commodity, Futures, All-search), a
 *      simple list view of instruments with LTP.
 *
 * No backend call — everything is derived from `allInstruments` which is
 * already preloaded in MarketPage's outlet context. Clicking any instrument
 * calls `onSelect(symbol)`; the parent wires that to `addChartTab`.
 */

const CATEGORIES = [
  { key: 'all',       label: 'All',         color: '#64748b' },
  { key: 'nifty',     label: 'Nifty',       color: '#10b981', underlying: 'NIFTY',      optCat: 'nse_opt', futCat: 'nse_fut' },
  { key: 'banknifty', label: 'BankNifty',   color: '#8b5cf6', underlying: 'BANKNIFTY',  optCat: 'nse_opt', futCat: 'nse_fut' },
  { key: 'finnifty',  label: 'FinNifty',    color: '#10b981', underlying: 'FINNIFTY',   optCat: 'nse_opt', futCat: 'nse_fut' },
  { key: 'midcpnifty',label: 'MidcapNifty', color: '#f59e0b', underlying: 'MIDCPNIFTY', optCat: 'nse_opt', futCat: 'nse_fut' },
  { key: 'sensex',    label: 'Sensex',      color: '#ef4444', underlying: 'SENSEX',     optCat: 'bse_opt', futCat: 'bse_fut' },
  { key: 'equity',    label: 'Equity',      color: '#3b82f6', flat: true, listCats: ['nse_eq', 'bse_eq'] },
  { key: 'commodity', label: 'Commodity',   color: '#f97316', flat: true, listCats: ['mcx_fut', 'mcx_opt'] }
];

function formatExpiryDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const year = String(d.getFullYear()).slice(-2);
  return `${day} ${month} ${year}`;
}

function normaliseLtp(inst, getInstrumentWithLivePrice) {
  if (!inst) return null;
  try {
    const live = getInstrumentWithLivePrice ? getInstrumentWithLivePrice(inst) : inst;
    return Number(live?.lastPrice ?? live?.last ?? live?.bid ?? live?.ask ?? 0) || 0;
  } catch {
    return 0;
  }
}

export default function InstrumentPickerModal({
  open,
  onClose,
  onSelect,
  allInstruments = [],
  getInstrumentWithLivePrice
}) {
  const [category, setCategory] = useState('nifty');
  const [expiry, setExpiry] = useState(null);
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);
  const chainScrollRef = useRef(null);
  const atmRowRef = useRef(null);

  // Focus the search bar when the modal opens. The state-reset + focus
  // are both done inside the timeout so the effect body doesn't
  // trigger a cascading render (eslint react-hooks rule).
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

  const activeCategory = useMemo(
    () => CATEGORIES.find(c => c.key === category) || CATEGORIES[1],
    [category]
  );

  // Instruments filtered to the current category (before expiry / search).
  const scopedInstruments = useMemo(() => {
    if (!Array.isArray(allInstruments) || allInstruments.length === 0) return [];
    if (category === 'all') return allInstruments;
    if (activeCategory.flat) {
      return allInstruments.filter(i =>
        activeCategory.listCats.includes(String(i.category || '').toLowerCase())
      );
    }
    // Index option chain (+ futures of that underlying).
    const root = activeCategory.underlying;
    return allInstruments.filter(i => {
      const name = String(i.name || '').toUpperCase();
      const sym  = String(i.symbol || '').toUpperCase();
      return (
        (name === root || sym.startsWith(root)) &&
        // Exclude accidental matches (e.g. MIDCPNIFTY starts with NIFTY? No
        // — but BANKNIFTY does NOT start with NIFTY so safe, and MIDCPNIFTY
        // doesn't either. Still, belt-and-braces by also checking the
        // stored name when present.)
        (name === '' || name === root)
      );
    });
  }, [allInstruments, category, activeCategory]);

  // Expiries available for the current index (sorted ascending).
  const expiries = useMemo(() => {
    if (activeCategory.flat || category === 'all') return [];
    const set = new Set();
    for (const i of scopedInstruments) {
      const t = String(i.instrumentType || '').toUpperCase();
      if ((t === 'CE' || t === 'PE' || t === 'FUT') && i.expiry) set.add(i.expiry);
    }
    return Array.from(set).sort((a, b) => new Date(a) - new Date(b));
  }, [scopedInstruments, activeCategory, category]);

  // Effective expiry — derive rather than store, so we never have to run
  // an effect just to keep state in sync with the category switch.
  const effectiveExpiry = useMemo(() => {
    if (expiries.length === 0) return null;
    if (expiry && expiries.includes(expiry)) return expiry;
    return expiries[0];
  }, [expiries, expiry]);

  // ── Option chain rows for the selected expiry ────────────────────────
  const chainRows = useMemo(() => {
    if (activeCategory.flat || category === 'all' || !effectiveExpiry) return [];
    const byStrike = new Map();
    for (const i of scopedInstruments) {
      if (i.expiry !== effectiveExpiry) continue;
      const t = String(i.instrumentType || '').toUpperCase();
      if (t !== 'CE' && t !== 'PE') continue;
      const strike = Number(i.strike);
      if (!Number.isFinite(strike) || strike <= 0) continue;
      if (!byStrike.has(strike)) byStrike.set(strike, { strike, ce: null, pe: null });
      byStrike.get(strike)[t === 'CE' ? 'ce' : 'pe'] = i;
    }
    return Array.from(byStrike.values()).sort((a, b) => a.strike - b.strike);
  }, [scopedInstruments, effectiveExpiry, activeCategory, category]);

  // Underlying spot — find an instrument whose symbol matches the root
  // (index itself, e.g. NIFTY50, BANKNIFTY) and pull its LTP. Fall back to
  // the midpoint of all strikes if the underlying isn't quoted.
  const atmStrike = useMemo(() => {
    if (chainRows.length === 0) return null;
    const root = activeCategory.underlying;
    if (!root) return null;
    // Try a few common forms the underlying may be stored under.
    const candidates = [root, `${root}50`, `${root} 50`, `${root}IDX`, `${root}INDEX`];
    let spot = 0;
    for (const s of candidates) {
      const inst = allInstruments.find(i => String(i.symbol || '').toUpperCase() === s);
      if (inst) {
        spot = normaliseLtp(inst, getInstrumentWithLivePrice);
        if (spot > 0) break;
      }
    }
    if (!(spot > 0)) {
      // Midpoint fallback.
      const mid = Math.floor(chainRows.length / 2);
      return chainRows[mid]?.strike ?? null;
    }
    // Strike closest to spot.
    let best = chainRows[0];
    let bestDiff = Math.abs(spot - best.strike);
    for (const r of chainRows) {
      const d = Math.abs(spot - r.strike);
      if (d < bestDiff) { best = r; bestDiff = d; }
    }
    return best.strike;
  }, [chainRows, activeCategory, allInstruments, getInstrumentWithLivePrice]);

  // Scroll ATM into view when the chain loads.
  useEffect(() => {
    if (!open) return;
    if (!atmStrike) return;
    const t = setTimeout(() => {
      atmRowRef.current?.scrollIntoView({ behavior: 'auto', block: 'center' });
    }, 120);
    return () => clearTimeout(t);
  }, [open, atmStrike, effectiveExpiry, category]);

  // ── Flat-list rows (Equity / Commodity / All-search) ─────────────────
  const flatRows = useMemo(() => {
    const q = query.trim().toUpperCase();
    let list = scopedInstruments;
    if (q) {
      list = list.filter(i =>
        String(i.symbol || '').toUpperCase().includes(q) ||
        String(i.name || '').toUpperCase().includes(q)
      );
    }
    // Keep equity / futures only in flat views — not options (chain covers those).
    if (category === 'all' || activeCategory.flat) {
      return list.slice(0, 300); // cap to keep DOM light
    }
    return [];
  }, [scopedInstruments, query, category, activeCategory]);

  const renderFlat = flatRows.length > 0 && (activeCategory.flat || category === 'all' || query.trim() !== '');

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
          zIndex: 1200
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
          zIndex: 1201
        }}
      >
        {/* Header: search + close */}
        <div style={{
          padding: '14px 16px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', gap: 10
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
          display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none'
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

        {/* Expiry pills (only for index-option categories) */}
        {!activeCategory.flat && category !== 'all' && expiries.length > 0 && (
          <div style={{
            padding: '10px 16px', borderBottom: '1px solid var(--border-color)',
            display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none'
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

        {/* Body: chain, flat list, or empty state */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }} ref={chainScrollRef}>
          {/* Option chain */}
          {!renderFlat && chainRows.length > 0 && (
            <OptionChain
              rows={chainRows}
              expiry={effectiveExpiry}
              atmStrike={atmStrike}
              atmRowRef={atmRowRef}
              query={query}
              getInstrumentWithLivePrice={getInstrumentWithLivePrice}
              onPick={(sym) => { onSelect?.(sym); onClose?.(); }}
            />
          )}

          {/* Flat list (equity / commodity / all-search) */}
          {renderFlat && (
            <FlatList
              rows={flatRows}
              getInstrumentWithLivePrice={getInstrumentWithLivePrice}
              onPick={(sym) => { onSelect?.(sym); onClose?.(); }}
            />
          )}

          {/* Empty state */}
          {!renderFlat && chainRows.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
                No contracts found
              </div>
              <div style={{ fontSize: 12 }}>
                {category === 'all'
                  ? 'Try typing a symbol in the search bar.'
                  : 'No option contracts loaded for this index yet. Pick another category or expiry.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Option chain table                                                    */
/* ────────────────────────────────────────────────────────────────────── */
function OptionChain({ rows, expiry, atmStrike, atmRowRef, query, getInstrumentWithLivePrice, onPick }) {
  const expiryLabel = formatExpiryDate(expiry);

  // Optional: filter rows by typed strike in search bar.
  const filteredRows = useMemo(() => {
    const q = query.trim();
    if (!q) return rows;
    if (/^\d+$/.test(q)) return rows.filter(r => String(r.strike).includes(q));
    const upper = q.toUpperCase();
    return rows.filter(r =>
      String(r.ce?.symbol || '').toUpperCase().includes(upper) ||
      String(r.pe?.symbol || '').toUpperCase().includes(upper)
    );
  }, [rows, query]);

  return (
    <div>
      {/* Column header */}
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
        const ceLtp = normaliseLtp(r.ce, getInstrumentWithLivePrice);
        const peLtp = normaliseLtp(r.pe, getInstrumentWithLivePrice);
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
            {/* ATM marker pill floating above the strike cell */}
            {isATM && (
              <div style={{
                position: 'absolute',
                top: -1, left: '50%', transform: 'translate(-50%, -100%)',
                background: '#f59e0b', color: '#fff',
                padding: '2px 10px', borderRadius: '6px 6px 0 0',
                fontSize: 10, fontWeight: 700, letterSpacing: 0.4,
                pointerEvents: 'none'
              }}>
                ATM
              </div>
            )}

            {/* CE cell */}
            <ChainCell
              inst={r.ce}
              ltp={ceLtp}
              expiryLabel={expiryLabel}
              align="left"
              onPick={onPick}
            />
            {/* Strike */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700,
              color: isATM ? '#f59e0b' : 'var(--text-primary)'
            }}>
              {r.strike.toLocaleString('en-IN')}
            </div>
            {/* PE cell */}
            <ChainCell
              inst={r.pe}
              ltp={peLtp}
              expiryLabel={expiryLabel}
              align="right"
              onPick={onPick}
            />
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
  return (
    <button
      type="button"
      onClick={() => onPick?.(inst.symbol)}
      style={{
        padding: '14px 18px', textAlign: align,
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: 'var(--text-primary)', width: '100%'
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.2 }}>
        {inst.name || inst.symbol}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
        {expiryLabel}{ltp > 0 ? ` · LTP ₹${ltp.toFixed(2)}` : ''}
      </div>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Flat list for Equity / Commodity / All-search                         */
/* ────────────────────────────────────────────────────────────────────── */
function FlatList({ rows, getInstrumentWithLivePrice, onPick }) {
  return (
    <div>
      {rows.map(inst => {
        const ltp = normaliseLtp(inst, getInstrumentWithLivePrice);
        const live = getInstrumentWithLivePrice ? getInstrumentWithLivePrice(inst) : inst;
        const change = Number(live?.change) || 0;
        return (
          <button
            key={inst.symbol}
            type="button"
            onClick={() => onPick?.(inst.symbol)}
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
                {inst.symbol}
              </div>
              {inst.name && inst.name !== inst.symbol && (
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
