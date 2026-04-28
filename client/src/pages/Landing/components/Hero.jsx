import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BlurFade } from './BlurFade';
import InfiniteGrid from './InfiniteGrid';

/* ── Initial ticker data ──────────────────────────────────────────────────── */
const initialTickers = [
  { symbol: 'NIFTY 50',    base: 22456.80 },
  { symbol: 'BANKNIFTY',   base: 48320.50 },
  { symbol: 'SENSEX',      base: 73852.40 },
  { symbol: 'NIFTY CE',    base: 245.60,   prefix: '₹' },
  { symbol: 'NIFTY PE',    base: 182.30,   prefix: '₹' },
  { symbol: 'BANKNIFTY CE',base: 312.80,   prefix: '₹' },
  { symbol: 'BANKNIFTY PE',base: 198.40,   prefix: '₹' },
  { symbol: 'SENSEX FUT',  base: 73910.00 },
];

function generateTick(ticker) {
  const volatility = ticker.base > 1000 ? 0.002 : 0.008;
  const move = (Math.random() - 0.48) * volatility * ticker.base;
  const price = ticker.base + move;
  const change = ((move / ticker.base) * 100);
  return {
    symbol: ticker.symbol,
    price: (ticker.prefix || '') + price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    change: (change >= 0 ? '+' : '') + change.toFixed(2) + '%',
    up: change >= 0,
  };
}

export default function Hero() {
  const tickerRef = useRef(null);
  const duplicated = useRef(false);
  const [tickers, setTickers] = useState(() => initialTickers.map(generateTick));

  // Simulate live price updates every 2 seconds
  const updatePrices = useCallback(() => {
    setTickers(initialTickers.map((t) => {
      // Gradually shift the base to simulate drift
      t.base += (Math.random() - 0.48) * t.base * 0.0003;
      return generateTick(t);
    }));
  }, []);

  useEffect(() => {
    // Slower update to reduce render churn
    const interval = setInterval(updatePrices, 4000);
    return () => clearInterval(interval);
  }, [updatePrices]);

  // Duplicate ticker content for seamless loop
  useEffect(() => {
    const el = tickerRef.current;
    if (!el || duplicated.current) return;
    duplicated.current = true;
    const clone = el.innerHTML;
    el.innerHTML = clone + clone;
  }, []);

  return (
    <section id="home" className="relative overflow-hidden bg-white">

      {/* ── Infinite Grid Background ──────────────────────────────────────── */}
      <InfiniteGrid />

      {/* ── Main Hero Content — Centered ──────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 pt-28 pb-14 md:pt-44 md:pb-28 text-center">

        <BlurFade delay={0.1} inView>
          <p className="text-sm font-semibold text-[#2B4EFF] uppercase tracking-widest mb-6">
            India's #1 Prop Evaluation Platform
          </p>
        </BlurFade>

        <BlurFade delay={0.3} inView yOffset={12} blur="8px" duration={0.6}>
          <h1
            className="text-[#0D0F1A] mb-6"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em' }}
          >
            India Ka Apna{' '}
            <span className="text-[#2B4EFF]">Funded Trader</span>
            <br />
            Platform
          </h1>
        </BlurFade>

        <BlurFade delay={0.55} inView>
          <p className="text-base sm:text-lg text-[#6B7080] max-w-2xl mx-auto mb-10 leading-relaxed">
            Trade NIFTY, BANKNIFTY & SENSEX in a structured simulated evaluation.
            Pass the challenge, follow risk rules, and earn real performance rewards.
          </p>
        </BlurFade>

        <BlurFade delay={0.75} inView>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#2B4EFF] text-white font-semibold text-sm shadow-[0_6px_20px_rgba(43,78,255,0.3)] hover:bg-[#4B6AFF] transition-all"
            >
              Explore Plans
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-[#E8EAF0] text-[#0D0F1A] font-semibold text-sm hover:border-[#2B4EFF] hover:text-[#2B4EFF] transition-all"
            >
              Free Trial
            </Link>
          </div>
        </BlurFade>

      </div>

      {/* ── Live Ticker Strip ─────────────────────────────────────────────── */}
      <div className="border-y border-[#E8EAF0] bg-[#FAFBFD] overflow-hidden py-3">
        <div
          ref={tickerRef}
          className="flex gap-8 whitespace-nowrap w-max"
          style={{
            animation: 'marquee-smooth 60s linear infinite',
          }}
        >
          {tickers.map((t, i) => (
            <div key={i} className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs font-bold text-[#0D0F1A]">{t.symbol}</span>
              <span className="text-xs text-[#6B7080] tabular-nums transition-all duration-500">{t.price}</span>
              <span className={`flex items-center gap-0.5 text-xs font-semibold tabular-nums transition-colors duration-500 ${t.up ? 'text-emerald-500' : 'text-red-500'}`}>
                {t.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {t.change}
              </span>
              <span className="text-[#E8EAF0] ml-2">|</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee-smooth {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
