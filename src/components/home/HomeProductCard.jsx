import { memo } from 'react';
import { Link } from 'react-router-dom';
import placeholder from '../../assets/placeholder.jpg';

function HomeProductCard({ product }) {
  if (!product) return null;

  return (
    <Link 
      to={`/products/${product.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-square overflow-hidden bg-white p-3 sm:aspect-[4/3] sm:p-5 md:p-6">
        <img
          src={product.image || placeholder}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.src = placeholder;
          }}
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        
        {product.isNew && (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-900 shadow-md sm:left-4 sm:top-4 sm:px-3 sm:py-1 sm:text-[10px]">
            New Arrival
          </span>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4 lg:p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-[10px]">
            {product.productType || product.category}
          </p>
          {product.brand && (
            <span className="text-[8px] font-bold uppercase text-slate-600 opacity-70 sm:text-[10px]">
              {product.brand}
            </span>
          )}
        </div>

        <h4 className="mb-2.5 line-clamp-3 text-[12px] font-bold leading-[1.3] tracking-tight text-slate-900 transition-colors group-hover:text-primary sm:mb-3 sm:text-[16px]">
          {product.name}
        </h4>

        <div className="mb-3 mt-auto flex flex-col gap-1.5 rounded-xl bg-slate-50 p-2.5 sm:mb-4 sm:p-3.5">
          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest sm:text-[10px]">
            <span className="text-slate-400">MPN</span>
            <span className="truncate text-slate-700">{product.mpn || '—'}</span>
          </div>
          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest sm:text-[10px]">
            <span className="text-slate-400">SKU</span>
            <span className="truncate text-slate-700">{product.sku || '—'}</span>
          </div>
        </div>

        <div
          className="inline-flex min-h-[38px] w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-white transition-all group-hover:bg-primary group-hover:text-slate-900 sm:min-h-[46px] sm:rounded-xl sm:text-[11px]"
        >
          View Specs
        </div>
      </div>
    </Link>
  );
}

export default memo(HomeProductCard);
