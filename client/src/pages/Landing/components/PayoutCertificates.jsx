import { useState } from 'react';

const certificates = [
  { id: 1, trader: 'Vikram N.', city: 'Pune',     amount: '₹62,400',   plan: '5L Growth · 1-Step',  date: '12 Apr 2025', time: '14:32', txnId: 'BFT2504120143', bank: 'HDFC Bank', mode: 'IMPS' },
  { id: 2, trader: 'Ananya S.', city: 'Bangalore', amount: '₹1,41,000', plan: '10L Pro · 1-Step',    date: '08 Apr 2025', time: '11:18', txnId: 'BFT2504080872', bank: 'ICICI Bank', mode: 'NEFT' },
  { id: 3, trader: 'Deepak M.', city: 'Jaipur',    amount: '₹2,04,000', plan: '10L Pro · 1-Step',    date: '02 Apr 2025', time: '16:45', txnId: 'BFT2504020419', bank: 'Axis Bank', mode: 'IMPS' },
  { id: 4, trader: 'Pradeep J.','city': 'Mumbai',  amount: '₹1,78,500', plan: '10L Pro · 2-Step',    date: '28 Mar 2025', time: '10:22', txnId: 'BFT2503281054', bank: 'SBI', mode: 'NEFT' },
  { id: 5, trader: 'Meera K.',  city: 'Chennai',   amount: '₹54,800',   plan: '5L Growth · 2-Step',  date: '20 Mar 2025', time: '13:09', txnId: 'BFT2503200318', bank: 'Kotak Bank', mode: 'IMPS' },
  { id: 6, trader: 'Rohit G.',  city: 'Delhi',     amount: '₹18,200',   plan: '2L Starter · 1-Step', date: '15 Mar 2025', time: '15:51', txnId: 'BFT2503150207', bank: 'PNB', mode: 'IMPS' },
];

function CertificateSlip({ c, large = false }) {
  return (
    <div className={`w-full h-full flex flex-col bg-white ${large ? 'p-8 sm:p-10' : 'p-4 sm:p-5'}`}>
      {/* Header strip */}
      <div className={`flex items-center justify-between pb-3 mb-3 border-b border-[#E8EAF0] ${large ? 'pb-5 mb-5' : ''}`}>
        <div className="flex items-center gap-2">
          <div className={`rounded-md bg-[#2B4EFF] flex items-center justify-center text-white font-bold ${large ? 'w-9 h-9 text-sm' : 'w-7 h-7 text-[10px]'}`}>
            BFT
          </div>
          <div>
            <p className={`font-bold text-[#0D0F1A] leading-tight ${large ? 'text-sm' : 'text-[10px]'}`}>Bharath Funded Trader</p>
            <p className={`text-[#6B7080] leading-tight ${large ? 'text-[10px]' : 'text-[8px]'}`}>Payout Receipt</p>
          </div>
        </div>
        <div className={`text-right ${large ? '' : ''}`}>
          <p className={`text-emerald-600 font-bold uppercase tracking-wider ${large ? 'text-xs' : 'text-[8px]'}`}>● Success</p>
          <p className={`text-[#6B7080] ${large ? 'text-[10px]' : 'text-[8px]'}`}>{c.date} · {c.time}</p>
        </div>
      </div>

      {/* Amount */}
      <div className={`text-center ${large ? 'py-6' : 'py-3'}`}>
        <p className={`text-[#6B7080] uppercase tracking-wider ${large ? 'text-xs mb-2' : 'text-[8px] mb-1'}`}>Amount Credited</p>
        <p className={`font-extrabold text-[#0D0F1A] ${large ? 'text-5xl' : 'text-2xl sm:text-3xl'}`} style={{ letterSpacing: '-0.04em' }}>
          {c.amount}
        </p>
      </div>

      {/* Details */}
      <div className={`grid grid-cols-2 ${large ? 'gap-x-6 gap-y-4 mb-5' : 'gap-x-3 gap-y-2'} mt-auto`}>
        <div>
          <p className={`text-[#6B7080] uppercase tracking-wider ${large ? 'text-[10px] mb-0.5' : 'text-[7px]'}`}>To</p>
          <p className={`font-semibold text-[#0D0F1A] ${large ? 'text-sm' : 'text-[10px]'}`}>{c.trader}</p>
        </div>
        <div>
          <p className={`text-[#6B7080] uppercase tracking-wider ${large ? 'text-[10px] mb-0.5' : 'text-[7px]'}`}>Bank</p>
          <p className={`font-semibold text-[#0D0F1A] ${large ? 'text-sm' : 'text-[10px]'}`}>{c.bank}</p>
        </div>
        <div>
          <p className={`text-[#6B7080] uppercase tracking-wider ${large ? 'text-[10px] mb-0.5' : 'text-[7px]'}`}>A/C</p>
          <p className={`font-semibold text-[#0D0F1A] font-mono ${large ? 'text-sm' : 'text-[10px]'}`}>XXXX XX{c.id}{c.id}{c.id}9</p>
        </div>
        <div>
          <p className={`text-[#6B7080] uppercase tracking-wider ${large ? 'text-[10px] mb-0.5' : 'text-[7px]'}`}>Mode</p>
          <p className={`font-semibold text-[#0D0F1A] ${large ? 'text-sm' : 'text-[10px]'}`}>{c.mode}</p>
        </div>
        <div className="col-span-2">
          <p className={`text-[#6B7080] uppercase tracking-wider ${large ? 'text-[10px] mb-0.5' : 'text-[7px]'}`}>Transaction ID</p>
          <p className={`font-semibold text-[#0D0F1A] font-mono ${large ? 'text-sm' : 'text-[9px]'}`}>{c.txnId}</p>
        </div>
      </div>

      {/* Footer */}
      <div className={`pt-3 border-t border-dashed border-[#E8EAF0] flex items-center justify-between ${large ? 'mt-5' : 'mt-3'}`}>
        <p className={`text-[#6B7080] ${large ? 'text-[10px]' : 'text-[7px]'}`}>Plan: {c.plan}</p>
        <p className={`text-[#2B4EFF] font-bold ${large ? 'text-[10px]' : 'text-[7px]'}`}>bharathfundedtrader.in</p>
      </div>
    </div>
  );
}

export default function PayoutCertificates() {
  const [active, setActive] = useState(null);

  return (
    <section className="bg-white py-14 md:py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-14 max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-[#2B4EFF] uppercase tracking-widest mb-4">Payout Certificates</p>
          <h2
            className="font-extrabold text-[#0D0F1A] tracking-[-0.02em] font-manrope mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            Real payouts to <span className="text-[#2B4EFF]">real Indian traders</span>
          </h2>
          <p className="text-base sm:text-lg text-[#6B7080]">
            Every receipt below is from a trader who passed our evaluation, completed KYC,
            and received their payout in their Indian bank account.
          </p>
        </div>

        {/* Certificate cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((c) => (
            <div
              key={c.id}
              className="group bg-white border border-[#E8EAF0] rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(43,78,255,0.12)] hover:border-[#2B4EFF] transition-all duration-300 cursor-pointer"
              onClick={() => setActive(c)}
            >
              {/* Receipt area */}
              <div className="aspect-[4/3] bg-[#FAFBFD] relative overflow-hidden">
                <CertificateSlip c={c} />
                {/* Verified badge */}
                <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 z-10">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Verified
                </div>
              </div>

              {/* Details */}
              <div className="p-5 border-t border-[#E8EAF0]">
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="text-base font-bold text-[#0D0F1A]">{c.trader}</h3>
                  <span className="text-xs text-[#6B7080]">{c.city}</span>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-xs text-[#6B7080] mb-0.5">Payout Amount</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-[#2B4EFF]" style={{ letterSpacing: '-0.02em' }}>{c.amount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-[#6B7080]">{c.plan}</p>
                    <p className="text-[11px] text-[#6B7080]">{c.date}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-[#6B7080] mt-10 max-w-2xl mx-auto">
          Names shortened and account numbers masked for privacy. Original receipts available on request from the trader concerned.
        </p>
      </div>

      {/* Lightbox modal */}
      {active && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-[4/3] bg-white">
              <CertificateSlip c={active} large />
            </div>
            <div className="p-6 flex justify-between items-center border-t border-[#E8EAF0] bg-[#FAFBFD]">
              <div>
                <h3 className="text-lg font-bold text-[#0D0F1A]">{active.trader} — {active.city}</h3>
                <p className="text-sm text-[#6B7080]">{active.plan} · {active.date}</p>
              </div>
              <p className="text-2xl font-extrabold text-[#2B4EFF]">{active.amount}</p>
            </div>
            <button onClick={() => setActive(null)} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 text-[#0D0F1A] flex items-center justify-center font-bold hover:bg-white transition-all">
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
