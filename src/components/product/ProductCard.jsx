import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import placeholder from '../../assets/placeholder.jpg';
import { formatCurrency } from '../../utils/helpers';
import { resolveAssetUrl } from '../../api/apiUtils';

function ProductCard({ product, viewMode = 'grid' }) {
  const isListView = viewMode === 'list';
  const detailPath = `/products/${product.id}`;
  const mainImage = resolveAssetUrl(product.images?.[0] || product.image || placeholder);

  const handleImageError = (event) => {
    event.currentTarget.src = placeholder;
  };

  const priceDisplay = product.price ? (
    <div className="flex flex-col">
      <span className="mb-0.5 text-[10px] font-black uppercase tracking-widest text-primary">B2B Rate</span>
      <span className="text-lg font-black tracking-tighter text-textMain sm:text-xl">
        {formatCurrency(product.price)}
      </span>
    </div>
  ) : null;

  if (isListView) {
    return (
      <Link 
        to={detailPath}
        className="group block overflow-hidden rounded-2xl border border-greyBorder bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-hover sm:rounded-3xl"
      >
        <div className="flex flex-col sm:flex-row">
          <div
            className="relative flex h-40 w-full shrink-0 items-center justify-center border-b border-greyBorder bg-white p-3 transition-colors group-hover:bg-greyLight/35 sm:h-auto sm:w-56 sm:border-b-0 sm:border-r sm:p-5 lg:w-64 lg:p-6"
          >
            <img
              src={mainImage}
              alt={product.name}
              onError={handleImageError}
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute left-2.5 top-2.5 flex flex-col gap-1">
              {product.featured && (
                <span className="rounded-sm bg-primary px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-textMain shadow-sm sm:px-2.5 sm:py-1 sm:text-[9px]">
                  Featured
                </span>
              )}
              {product.topSelling && (
                <span className="rounded-sm bg-slate-900 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-white shadow-sm sm:px-2.5 sm:py-1 sm:text-[9px]">
                  Top Selling
                </span>
              )}
              {product.isNew && (
                <span className="rounded-sm bg-emerald-600 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-white shadow-sm sm:px-2.5 sm:py-1 sm:text-[9px]">
                  New Arrival
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col p-3.5 sm:p-5 lg:p-6">
            <div className="mb-4">
              <h3 className="line-clamp-2 text-base font-black leading-tight tracking-tight text-textMain transition-colors group-hover:text-primary group-hover:opacity-90 sm:text-lg lg:text-xl">
                {product.name}
              </h3>

              <div className="mt-3 flex flex-wrap gap-4 border-l-2 border-primary pl-3 sm:mt-4 sm:gap-6 sm:pl-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-textSecondary sm:text-[11px]">
                  MPN: <span className="text-textMain">{product.mpn || 'N/A'}</span>
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-greyMedium sm:text-[11px]">
                  SKU: <span className="text-textSecondary">{product.sku || 'N/A'}</span>
                </p>
              </div>

              {priceDisplay ? <div className="mt-3 sm:mt-4">{priceDisplay}</div> : null}
            </div>

            <div className="mt-auto flex justify-start">
              <div
                className="inline-flex min-h-[40px] items-center justify-between gap-3 rounded-xl border border-textMain bg-textMain px-3.5 text-[10px] font-black uppercase tracking-[0.14em] text-white transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-textMain sm:min-h-[46px] sm:px-5 sm:text-[11px]"
              >
                <span>View Details</span>
                <ChevronRight size={15} />
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      to={detailPath}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-greyBorder bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-hover sm:rounded-3xl"
    >
      <div
        className="relative flex aspect-square items-center justify-center border-b border-greyBorder bg-white p-3 transition-colors group-hover:bg-greyLight/35 sm:aspect-[4/3] sm:p-4 lg:p-6"
      >
        <img
          src={mainImage}
          alt={product.name}
          onError={handleImageError}
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1 sm:left-3 sm:top-3">
          {product.featured && (
            <span className="rounded-sm bg-primary px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-textMain shadow-sm sm:px-2 sm:text-[9px]">
              Featured
            </span>
          )}
          {product.topSelling && (
            <span className="rounded-sm bg-slate-900 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-white shadow-sm sm:px-2 sm:text-[9px]">
              Top Selling
            </span>
          )}
          {product.isNew && (
            <span className="rounded-sm bg-emerald-600 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-white shadow-sm sm:px-2 sm:text-[9px]">
              New Arrival
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4 lg:p-5">
        <h3 className="line-clamp-3 text-[12px] font-bold leading-[1.3] tracking-tight text-textMain transition-colors group-hover:text-primary sm:text-[15px] lg:text-[18px]">
          {product.name}
        </h3>

        <div className="mt-3 flex flex-col gap-1.5 rounded-xl bg-slate-50 p-2.5 sm:mt-4 sm:p-3.5">
          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-400 sm:text-[10px]">
            <span>MPN</span>
            <span className="truncate text-textMain">{product.mpn || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-greyMedium sm:text-[10px]">
            <span>SKU</span>
            <span className="truncate text-textSecondary">{product.sku || 'N/A'}</span>
          </div>
        </div>

        {priceDisplay ? <div className="mt-3 sm:mt-4">{priceDisplay}</div> : null}

        <div className="mt-auto pt-4">
          <div
            className="inline-flex min-h-[38px] w-full items-center justify-between rounded-lg border border-textMain bg-textMain px-3.5 text-[9px] font-black uppercase tracking-[0.15em] text-white transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-textMain sm:min-h-[46px] sm:rounded-xl sm:px-5 sm:text-[10px] lg:px-6 lg:text-[11px]"
          >
            <span>{isListView ? 'View Details' : 'View Specs'}</span>
            <ChevronRight size={14} className="shrink-0" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default memo(ProductCard);
