import { useEffect, useRef, useState } from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const stats = [
  {
    value: 50000,
    display: '50K+',
    label: 'Evaluations Completed',
  },
  {
    value: 10000,
    display: '10K+',
    label: 'Active Traders',
  },
  {
    value: 5,
    display: '₹5Cr+',
    label: 'Rewards Paid Out',
    prefix: '₹',
  },
  {
    value: 3,
    display: '3',
    label: 'Index Instruments',
  },
];

function CountUp({ target, prefix = '', isVisible }) {
  const [count, setCount] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isVisible || hasRun.current) return;
    hasRun.current = true;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isVisible, target]);

  const formatted = () => {
    if (target >= 1000000) return `${prefix}${(count / 1000000).toFixed(1)}M+`;
    if (target >= 1000)    return `${prefix}${(count / 1000).toFixed(0)}K+`;
    return `${prefix}${count}M+`;
  };

  return <span>{isVisible ? formatted() : `${prefix}0`}</span>;
}

export default function Statistics() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="stats" ref={sectionRef} className="bg-[#0C0C1D] py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className="font-manrope text-white mb-4"
            style={{
              fontSize: 'clamp(2rem, 4.5vw, 3.5rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            Trusted by Thousands of Traders
          </h2>
          <p className="text-base sm:text-lg text-[rgba(154,160,180,0.8)] font-light max-w-2xl mx-auto">
            Real numbers that reflect the trust our clients place in us every day.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="bg-[#141428] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 sm:p-8 text-center"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div
                className="text-4xl sm:text-5xl font-extrabold text-white font-manrope mb-2"
                style={{ letterSpacing: '-0.04em' }}
              >
                <CountUp target={stat.value} prefix={stat.prefix || ''} isVisible={isVisible} />
              </div>
              <div className="text-sm text-[#9AA0B4] mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
