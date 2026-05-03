import { Link } from 'react-router-dom';

const parseRupees = (s) => parseInt(String(s).replace(/[^\d]/g, ''), 10) || 0;
const formatINR = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// Pull pricing + per-row rules straight off the live `tier` object PricingPage
// builds from the admin `/api/prop/challenges` response. `plan` is only used for
// the heading suffix ("INSTANT" / "1-STEP" / "2-STEP").
function computeMetrics(tier) {
  const fee = parseRupees(tier.price);
  return {
    originalPrice: tier.price || formatINR(fee),
    discountedPrice: tier.discountedPrice || formatINR(fee * 0.9),
    rules: Array.isArray(tier.rules) ? tier.rules : []
  };
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[#6B7080]">{label}</span>
      <span className="text-[#0D0F1A] font-semibold tabular-nums">{value}</span>
    </div>
  );
}

export default function PricingTierCard({ tier, plan }) {
  const m = computeMetrics(tier);
  const registerHref = `/register?plan=${encodeURIComponent(plan)}&tier=${encodeURIComponent(tier.capital)}`;

  return (
    <div
      className={`relative rounded-2xl bg-white p-6 sm:p-7 flex flex-col transition-all ${
        tier.popular
          ? 'border-2 border-[#2B4EFF] shadow-[0_8px_40px_rgba(43,78,255,0.12)]'
          : 'border border-[#E8EAF0] shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:border-[#2B4EFF] hover:shadow-[0_8px_32px_rgba(43,78,255,0.08)]'
      }`}
    >
      {tier.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2B4EFF] text-white text-[11px] font-bold px-4 py-1 rounded-full whitespace-nowrap shadow-[0_4px_12px_rgba(43,78,255,0.3)]">
          Most chosen
        </span>
      )}

      <h3 className="text-center text-xl sm:text-2xl font-extrabold text-[#0D0F1A] font-manrope tracking-tight mb-3">
        {tier.capital}{' '}
        <span className="text-[#6B7080] font-bold uppercase text-base sm:text-lg tracking-wide">
          {plan}
        </span>
      </h3>

      <div className="text-center">
        <span className="text-base text-[#9AA0B4] line-through mr-2 tabular-nums">
          {m.originalPrice}
        </span>
        <span className="text-3xl font-extrabold text-[#2B4EFF] tracking-tight tabular-nums">
          {m.discountedPrice}
        </span>
        <span className="text-xs text-[#6B7080] ml-1">/ One Time</span>
      </div>
      <p className="text-center text-[10px] font-bold text-[#2B4EFF] uppercase tracking-widest mt-1 mb-5">
        With code WELCOME10
      </p>

      <div className="border-t border-[#E8EAF0] pt-4 space-y-2.5 text-sm mb-6">
        {m.rules.map((r) => (
          <Row key={r.key} label={r.key} value={r.value} />
        ))}
      </div>

      <div className="mt-auto space-y-2">
        <Link
          to="/challenges"
          className="w-full block text-center py-2.5 rounded-full border border-[#E8EAF0] text-[#0D0F1A] font-semibold text-sm hover:border-[#2B4EFF] hover:text-[#2B4EFF] transition-all"
        >
          Funded Rules
        </Link>
        <Link
          to={registerHref}
          className="w-full block text-center py-2.5 rounded-full bg-[#2B4EFF] text-white font-semibold text-sm hover:bg-[#4B6AFF] transition-all shadow-[0_4px_12px_rgba(43,78,255,0.25)]"
        >
          Select Challenge
        </Link>
      </div>
    </div>
  );
}
