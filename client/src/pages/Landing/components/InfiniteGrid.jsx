import { useRef, useEffect } from 'react';

/**
 * Lightweight grid background — pure CSS, no framer-motion, no per-frame updates.
 * Mouse spotlight handled via CSS variables (rAF-throttled) instead of React state.
 */
export default function InfiniteGrid() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let pendingX = 0;
    let pendingY = 0;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) return; // disable mouse-tracking on mobile to save CPU

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      pendingX = e.clientX - rect.left;
      pendingY = e.clientY - rect.top;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          el.style.setProperty('--mx', `${pendingX}px`);
          el.style.setProperty('--my', `${pendingY}px`);
          raf = 0;
        });
      }
    };

    el.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      el.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
      style={{ '--mx': '50%', '--my': '50%' }}
    >
      {/* Base grid — pure CSS, GPU-friendly */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(43,78,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(43,78,255,0.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          animation: 'grid-drift 30s linear infinite',
        }}
      />

      {/* Mouse spotlight — brighter grid revealed where cursor is */}
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(43,78,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(43,78,255,0.35) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          WebkitMaskImage:
            'radial-gradient(380px circle at var(--mx) var(--my), black 0%, transparent 70%)',
          maskImage:
            'radial-gradient(380px circle at var(--mx) var(--my), black 0%, transparent 70%)',
        }}
      />

      {/* Static gradient orbs — pre-blurred via radial-gradient (no GPU blur filter) */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute"
          style={{
            right: '-15%',
            top: '-20%',
            width: '70%',
            height: '70%',
            background: 'radial-gradient(circle, rgba(255,140,50,0.10) 0%, transparent 65%)',
            transform: 'translateZ(0)',
          }}
        />
        <div
          className="absolute"
          style={{
            left: '-10%',
            bottom: '-15%',
            width: '65%',
            height: '65%',
            background: 'radial-gradient(circle, rgba(43,78,255,0.10) 0%, transparent 65%)',
            transform: 'translateZ(0)',
          }}
        />
      </div>

      <style>{`
        @keyframes grid-drift {
          from { background-position: 0 0, 0 0; }
          to { background-position: 40px 40px, 40px 40px; }
        }
      `}</style>
    </div>
  );
}
