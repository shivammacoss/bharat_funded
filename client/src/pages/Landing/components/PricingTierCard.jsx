import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, Smartphone, X, Check } from 'lucide-react';

const parseRupees = (s) => parseInt(String(s).replace(/[^\d]/g, ''), 10) || 0;
const formatINR = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const ruleSet = {
  Instant:  { profitTarget: '8%',         dailyDrawdown: '3%', maxDrawdown: '6%' },
  '1-Step': { profitTarget: '10%',        dailyDrawdown: '4%', maxDrawdown: '8%' },
  '2-Step': { profitTarget: '8% / 5%',    dailyDrawdown: '4%', maxDrawdown: '8%' },
};

function computeMetrics(tier, plan) {
  const fee = parseRupees(tier.price);
  const rules = ruleSet[plan] || ruleSet.Instant;
  return {
    originalPrice: formatINR(fee),
    discountedPrice: formatINR(fee * 0.9),
    ...rules,
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

const platforms = [
  {
    id: 'web',
    icon: Globe,
    name: 'Web Platform',
    desc: 'Browser-based dashboard. Full features, real-time charts.',
  },
  {
    id: 'mobile',
    icon: Smartphone,
    name: 'Mobile App',
    desc: 'Trade on the go. Same account, same rules.',
  },
];

function SelectPlatformModal({ open, onClose, tier, plan, metrics }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('web');

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleContinue = () => {
    navigate(`/register?plan=${encodeURIComponent(plan)}&tier=${encodeURIComponent(tier.capital)}&platform=${selected}`);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-[rgba(12,12,29,0.6)] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#6B7080] hover:bg-[#F0F2F8] transition-colors"
        >
          <X size={18} />
        </button>

        <h3 className="text-lg sm:text-xl font-extrabold text-[#0D0F1A] font-manrope tracking-tight">
          Choose your platform
        </h3>
        <p className="text-sm text-[#6B7080] mt-1 mb-5">
          {tier.capital} · <span className="uppercase font-semibold">{plan}</span> · {metrics.discountedPrice}
        </p>

        <div className="space-y-3 mb-6">
          {platforms.map((p) => {
            const Icon = p.icon;
            const active = selected === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                  active
                    ? 'border-[#2B4EFF] bg-[rgba(43,78,255,0.05)] shadow-[0_4px_16px_rgba(43,78,255,0.1)]'
                    : 'border-[#E8EAF0] hover:border-[#2B4EFF]'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  active ? 'bg-[#2B4EFF] text-white' : 'bg-[#F0F2F8] text-[#2B4EFF]'
                }`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#0D0F1A]">{p.name}</div>
                  <div className="text-xs text-[#6B7080] mt-0.5">{p.desc}</div>
                </div>
                {active && <Check size={18} className="text-[#2B4EFF] shrink-0" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleContinue}
          className="w-full py-3 rounded-full bg-[#2B4EFF] text-white font-semibold text-sm hover:bg-[#4B6AFF] transition-all shadow-[0_6px_20px_rgba(43,78,255,0.3)]"
        >
          Continue to checkout
        </button>
        <p className="text-center text-[11px] text-[#6B7080] mt-3">
          Use code <span className="font-bold text-[#2B4EFF]">WELCOME10</span> at checkout for 10% off.
        </p>
      </div>
    </div>
  );
}

export default function PricingTierCard({ tier, plan }) {
  const m = computeMetrics(tier, plan);
  const [open, setOpen] = useState(false);

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
        <Row label="Profit Target" value={m.profitTarget} />
        <Row label="Daily Drawdown" value={m.dailyDrawdown} />
        <Row label="Max Drawdown" value={m.maxDrawdown} />
        <Row label="Min Trading Days" value="5 days" />
      </div>

      <div className="mt-auto space-y-2">
        <Link
          to="/challenges"
          className="w-full block text-center py-2.5 rounded-full border border-[#E8EAF0] text-[#0D0F1A] font-semibold text-sm hover:border-[#2B4EFF] hover:text-[#2B4EFF] transition-all"
        >
          Funded Rules
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full py-2.5 rounded-full bg-[#2B4EFF] text-white font-semibold text-sm hover:bg-[#4B6AFF] transition-all shadow-[0_4px_12px_rgba(43,78,255,0.25)]"
        >
          Select Platform
        </button>
      </div>

      <SelectPlatformModal
        open={open}
        onClose={() => setOpen(false)}
        tier={tier}
        plan={plan}
        metrics={m}
      />
    </div>
  );
}
