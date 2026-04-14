import { memo, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Clean, minimal BrandCard for B2B showcase
 * Style: subtle border, rounded corners, brand focus
 */
function BrandCard({ brand }) {
  const [hasImageError, setHasImageError] = useState(false);
  const imageSrc = brand?.logo || brand?.image;

  if (!imageSrc || hasImageError) return null;

  return (
    <div className="mx-3 flex h-24 w-[160px] shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white px-5 shadow-lg transition-all duration-300 hover:scale-105 group">
      <img
        src={imageSrc}
        alt={brand?.name || 'Brand'}
        className="max-h-12 w-full object-contain transition-all duration-300"
        loading="lazy"
        decoding="async"
        onError={() => setHasImageError(true)}
      />
    </div>
  );
}

function CategoryBrandStrip({ data }) {
  const { row1, row2 } = useMemo(() => {
    const brands = Array.isArray(data?.brands)
      ? data.brands.filter(brand => brand && (brand.logo || brand.image))
      : [];

    if (!brands.length) {
      return { row1: [], row2: [] };
    }

    // Split brands into two distinct rows
    const half = Math.ceil(brands.length / 2);
    const firstRow = brands.slice(0, half);
    const secondRow = brands.slice(half);

    // Function to ensure enough items for seamless scrolling
    const fillRow = (rowItems) => {
      const minimumItems = 8;
      const sequence = [...rowItems];
      while (sequence.length < minimumItems) {
        sequence.push(...rowItems);
      }
      return [...sequence, ...sequence]; // Double for infinite effect
    };

    return {
      row1: fillRow(firstRow),
      row2: fillRow(secondRow.length ? secondRow : firstRow),
    };
  }, [data]);

  if (!data || !row1.length) return null;

  // Row animation speeds (slightly varied for depth)
  const duration1 = Math.max(25, row1.length * 2.5);
  const duration2 = Math.max(25, row2.length * 2.5);

  return (
    <section className="relative overflow-hidden bg-textMain py-16 border-y border-white/5">
      <div className="container-shell relative z-20 mb-12">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">
            {data.label || 'Trusted OEM Network'}
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            {data.title || 'Powering Enterprise Success'}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400">
            {data.description || 'We collaborate with the world\'s leading technology innovators to deliver verified, high-performance hardware solutions.'}
          </p>
        </div>
      </div>

      <div className="marquee-shell relative space-y-6">
        {/* Row 1: Right to Left */}
        <div className="overflow-hidden flex">
          <div
            className="animate-marquee-rtl flex w-max items-center"
            style={{ '--marquee-duration': `${duration1}s` }}
          >
            {row1.map((brand, index) => (
              <BrandCard key={`r1-${brand?.name}-${index}`} brand={brand} />
            ))}
          </div>
        </div>

        {/* Row 2: Left to Right */}
        <div className="overflow-hidden flex">
          <div
            className="animate-marquee-ltr flex w-max items-center"
            style={{ '--marquee-duration': `${duration2}s` }}
          >
            {row2.map((brand, index) => (
              <BrandCard key={`r2-${brand?.name}-${index}`} brand={brand} />
            ))}
          </div>
        </div>

        {/* Edge Fade Overlays - Matching Dark Background */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#1E1E1E] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#1E1E1E] to-transparent z-10" />
      </div>

      {data.ctaHref && (
        <div className="mt-14 flex justify-center relative z-20">
          <Link
            to={data.ctaHref}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-primary px-8 py-3 text-xs font-bold uppercase tracking-widest text-textMain transition-all hover:bg-primary hover:border-primary hover:scale-105 active:scale-95"
          >
            {data.ctaLabel || 'View Full Network'}
            <span className="font-bold">&rarr;</span>
          </Link>
        </div>
      )}
    </section>
  );
}

export default memo(CategoryBrandStrip);
