import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';

export default function VideoSection() {
  const videoRef = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
  }, []);

  const handlePlay = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.play()
      .then(() => setStarted(true))
      .catch((err) => {
        console.warn('Autoplay blocked:', err);
        v.controls = true;
        setStarted(true);
      });
  };

  return (
    <section
      id="demo"
      className="relative py-20 md:py-28 px-4 sm:px-6 overflow-hidden bg-[#0A0A14]"
    >
      {/* ── Background decoration ─────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div
          className="absolute top-1/2 left-1/2 w-[700px] h-[400px] rounded-full opacity-30"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(59,91,255,0.15) 0%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(59,91,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,91,255,0.05) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">

        {/* ── Section header ────────────────────────────────────────── */}
        <div className="text-center mb-10 md:mb-14">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3B5BFF]/10 border border-[#3B5BFF]/20 mb-5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B5BFF] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3B5BFF]" />
            </span>
            <span className="text-xs font-semibold text-[#3B5BFF] tracking-wide font-manrope uppercase">
              Platform Demo
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-white font-manrope tracking-tight mb-4">
            See Bharath Funded Trader{' '}
            <span className="text-[#3B5BFF]">in Action</span>
          </h2>
          <p className="text-base md:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            Watch how our platform makes trading simple, fast, and powerful —
            from account setup to your first live trade.
          </p>
        </div>

        {/* ── Video card ────────────────────────────────────────────── */}
        <div
          className="relative rounded-2xl md:rounded-3xl p-[2px]"
          style={{
            background:
              'linear-gradient(135deg, rgba(59,91,255,0.40) 0%, rgba(59,91,255,0.10) 40%, rgba(59,91,255,0.30) 100%)',
            boxShadow:
              '0 32px 80px rgba(59,91,255,0.10), 0 8px 32px rgba(0,0,0,0.20)',
          }}
        >
          {/* Inner rounded wrapper */}
          <div className="relative rounded-[calc(1.5rem-2px)] md:rounded-[calc(1.75rem-2px)] overflow-hidden bg-black min-h-[220px] md:min-h-[420px]">

            <video
              ref={videoRef}
              className="w-full h-auto block"
              loop
              playsInline
              preload="metadata"
              controls={started}
              onEnded={() => setStarted(false)}
            >
              <source src="/landing/video/video1.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* ── Custom play overlay — shown before first play ─────── */}
            {!started && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(0,0,0,0.50) 0%, rgba(59,91,255,0.15) 100%)',
                }}
              >
                {/* Outer pulse ring */}
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-24 h-24 rounded-full bg-[#3B5BFF]/20 animate-ping" />
                  <span className="absolute w-20 h-20 rounded-full bg-[#3B5BFF]/10" />

                  {/* Play button */}
                  <button
                    aria-label="Play demo video"
                    onClick={handlePlay}
                    className="relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-xl shadow-[#3B5BFF]/40 hover:scale-110 active:scale-95 transition-transform focus:outline-none focus:ring-4 focus:ring-[#3B5BFF]/30"
                    style={{ background: 'linear-gradient(135deg, #3B5BFF, #7B5BFF)' }}
                  >
                    <Play
                      size={28}
                      className="text-white ml-1"
                      fill="white"
                      strokeWidth={0}
                    />
                  </button>
                </div>

                {/* Label below button */}
                <p className="absolute bottom-6 text-white/70 text-sm font-medium font-manrope tracking-wide">
                  Click to watch the demo
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Trust strip ───────────────────────────────────────────── */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {[
            'Simulated Trading',
            'Real-Time Data',
            'Instant Execution',
            'INR Payments',
          ].map((label, i, arr) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B5BFF] shrink-0" />
              <span className="text-sm font-medium text-white/60 font-manrope">
                {label}
              </span>
              {i < arr.length - 1 && (
                <span className="hidden sm:block w-px h-4 bg-white/[0.08] ml-2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
