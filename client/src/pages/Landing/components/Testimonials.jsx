import { useScrollAnimation } from '../hooks/useScrollAnimation';

// Drop certificate images into /landing/img/ and reference them here.
// Leave `image` as null to render an empty placeholder slot.
const certificates = [
  { id: 1, image: '/landing/img/cer1.png', alt: 'Profit share certificate 1' },
  { id: 2, image: '/landing/img/cer2.png', alt: 'Profit share certificate 2' },
  { id: 3, image: '/landing/img/cer3.png', alt: 'Profit share certificate 3' },
  { id: 4, image: '/landing/img/cer4.png', alt: 'Profit share certificate 4' },
  { id: 5, image: '/landing/img/cer5.png', alt: 'Profit share certificate 5' },
  { id: 6, image: '/landing/img/cer6.png', alt: 'Profit share certificate 6' },
];

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
            Trader Performance{' '}
            <span className="text-[#2B4EFF]">Rewards</span>
          </h2>
          <p className="text-base sm:text-lg text-[#9AA0B4] font-light">
            Real results from real traders on our platform.
          </p>
        </div>

        {/* Certificate grid — 3 cols × 2 rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="rounded-2xl bg-[#141428] border border-[rgba(255,255,255,0.08)] overflow-hidden aspect-[4/3] flex items-center justify-center hover:border-[rgba(43,78,255,0.4)] transition-colors"
            >
              {cert.image ? (
                <img
                  src={cert.image}
                  alt={cert.alt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="text-center text-[#6B7080] px-6">
                  <p className="text-sm font-semibold mb-1">Certificate</p>
                  <p className="text-xs">Add image at /landing/img/</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
