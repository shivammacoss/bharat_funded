import { useScrollAnimation } from '../hooks/useScrollAnimation';

// Add certificate images to /landing/img/ and reference them here.
// Leave `image` as null to render an empty placeholder slot.
const landscapeCertificate = { image: '/landing/img/certificate.png', alt: 'Payout certificate' };

export default function Testimonials() {
  const { ref: headerRef } = useScrollAnimation(0.1);

  return (
    <section className="bg-[#0C0C1D] py-14 md:py-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div ref={headerRef} className="scroll-reveal mb-10 md:mb-16 text-center max-w-3xl mx-auto">
          <h2
            className="font-extrabold text-white tracking-[-0.02em] font-manrope mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            Real Traders.{' '}
            <span className="text-[#2B4EFF]">Real Payouts.</span>
          </h2>
          <p className="text-base sm:text-lg text-[#9AA0B4] font-light">
            Verified payout certificates from funded traders on the Bharath Funded Trader platform.
          </p>
        </div>

        {/* Landscape certificate */}
        <div className="rounded-2xl bg-[#141428] border border-[rgba(255,255,255,0.08)] overflow-hidden aspect-[16/10] flex items-center justify-center">
          {landscapeCertificate.image ? (
            <img
              src={landscapeCertificate.image}
              alt={landscapeCertificate.alt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="text-center text-[#6B7080] px-6">
              <p className="text-sm font-semibold mb-1">Payout certificate (landscape)</p>
              <p className="text-xs">Add image at /landing/img/</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
