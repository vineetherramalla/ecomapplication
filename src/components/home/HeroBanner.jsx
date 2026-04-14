import { memo, useEffect, useMemo, useState } from 'react';

function HeroBanner({ slides = [] }) {
  const safeSlides = useMemo(() => (Array.isArray(slides) && slides.length ? slides : []), [slides]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!safeSlides.length) return undefined;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % safeSlides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [safeSlides.length]);

  useEffect(() => {
    if (safeSlides.length < 2) {
      return undefined;
    }

    const nextSlide = safeSlides[(activeIndex + 1) % safeSlides.length];
    if (!nextSlide?.image) {
      return undefined;
    }

    const image = new Image();
    image.src = nextSlide.image;
    return undefined;
  }, [activeIndex, safeSlides]);

  if (!safeSlides.length) return null;

  const activeSlide = safeSlides[activeIndex];

  return (
    <section className="relative w-full bg-black font-sans overflow-hidden">
      {/* Carousel Area using proper aspect ratios to avoid aggressive image cropping */}
      <div className="relative w-full aspect-[1.1/1.2] sm:aspect-[16/9] lg:aspect-[2.4/1] min-h-[400px] lg:min-h-[450px] max-h-[700px]">
        <div
          key={activeSlide.id || activeIndex}
          className="absolute inset-0 z-10"
        >
          {/* Background Image Container */}
          <div className="absolute inset-0 bg-black">
            <img
              src={activeSlide.image}
              alt={activeSlide.headline}
              className="w-full h-full object-cover object-center"
              loading="eager"
              fetchpriority="high"
              decoding="async"
            />

            {/* STRICT Heavy Dark Gradient to ensure text over bright images is 100% readable */}
            <div
              className={`absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent w-full md:w-[80%] lg:w-2/3`}
            />
            {/* Subtle bottom fade to anchor the dots nicely without being obtrusive */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </div>

          {/* Text Content - Perfectly vertically centered */}
          <div className="relative z-20 flex flex-col justify-center h-full max-w-[1400px] mx-auto px-5 md:px-12 lg:px-20 w-full">
            <div className="max-w-[480px] text-left transition-all duration-700 transform translate-y-0 opacity-100">
              {activeSlide.eyebrow && (
                <p className="text-[#f56900] text-[12px] md:text-sm font-semibold tracking-wide mb-2 md:mb-3">
                  {activeSlide.eyebrow}
                </p>
              )}

              <h1 className="text-[2rem] sm:text-[3.5rem] md:text-[4rem] lg:text-[4.75rem] font-bold text-white mb-3 md:mb-4 leading-[1.05] tracking-tight">
                {activeSlide.headline}
              </h1>

              <div
                className="text-[15px] md:text-[19px] lg:text-[21px] text-[#a1a1a6] mb-6 md:mb-8 font-medium leading-[1.4] max-w-[420px]"
                style={{ whiteSpace: 'pre-line' }}
              >
                {activeSlide.subheadline}
              </div>

              <div className="flex items-center mt-2">
                <a
                  href={activeSlide.href || '#quote'}
                  className="inline-flex items-center justify-center bg-[#0071e3] hover:bg-[#0077ED] text-white px-5 py-2 md:px-6 md:py-2.5 rounded-full font-medium transition-colors text-[14px] md:text-[15px]"
                >
                  {activeSlide.ctaLabel || 'Shop Now'}
                  <svg className="w-3.5 h-3.5 ml-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Minimalist Carousel Dots (Overlapping the slider) */}
        <div className="absolute bottom-4 left-0 right-0 z-40 flex justify-center gap-2">
          {safeSlides.map((slide, idx) => (
            <button
              key={slide.id || idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`h-[4px] rounded-full transition-all duration-300 ${idx === activeIndex ? 'w-8 bg-white' : 'w-2 bg-[#424245] hover:bg-white/60'
                }`}
              aria-label={`View slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

    </section>
  );
}

export default memo(HeroBanner);
