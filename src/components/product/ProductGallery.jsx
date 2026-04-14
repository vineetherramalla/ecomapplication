import { useMemo, useState } from 'react';
import { resolveAssetUrl } from '../../api/apiUtils';
import placeholder from '../../assets/placeholder.jpg';

function ProductGallery({ images = [], alt = 'Product image' }) {
  const [selectedImage, setSelectedImage] = useState('');

  const galleryImages = useMemo(
    () =>
      [
        ...new Set(
          (Array.isArray(images) ? images : [])
            .map((img) => (typeof img === 'string' ? img : img?.image))
            .filter(Boolean),
        ),
      ],
    [images],
  );

  const activeImage =
    galleryImages.find((image) => image === selectedImage) || galleryImages[0] || '';

  if (!galleryImages.length) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-slate-50 border border-slate-100">
        <img src={placeholder} alt="No preview" className="w-1/3 opacity-20" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="group relative aspect-square overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 sm:rounded-[32px] sm:p-8 lg:rounded-[32px] lg:p-10 transition-all duration-500">
        <img
          src={resolveAssetUrl(activeImage)}
          alt={alt}
          className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-105"
          loading="eager"
          fetchpriority="high"
          decoding="async"
          onError={(e) => { e.currentTarget.src = placeholder; }}
        />
      </div>

      {galleryImages.length > 1 && (
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {galleryImages.map((image, idx) => (
            <button
              key={`${image}-${idx}`}
              type="button"
              onMouseEnter={() => setSelectedImage(image)}
              onClick={() => setSelectedImage(image)}
              className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition-all duration-300 sm:h-20 sm:w-20 ${
                activeImage === image
                  ? 'border-primary ring-4 ring-primary/10'
                  : 'border-slate-100 bg-white hover:border-slate-300'
              }`}
            >
              <img
                src={resolveAssetUrl(image)}
                alt={`${alt} thumbnail ${idx + 1}`}
                className="h-full w-full object-contain p-2"
                loading="lazy"
                decoding="async"
                onError={(e) => { e.currentTarget.src = placeholder; } }
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductGallery;
