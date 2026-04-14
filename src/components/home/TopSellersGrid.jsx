import { memo } from 'react';
import { Link } from 'react-router-dom';
import HomeProductCard from './HomeProductCard';

function TopSellersGrid({ products = [], loading = false, error = '' }) {
  if (loading) {
    return (
      <section className="bg-white py-12 sm:py-14 md:py-20">
        <div className="container-shell space-y-8">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              Popular Choice
            </p>
            <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">
              Top Sellers
            </h2>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-24 text-center text-sm font-bold uppercase tracking-widest text-slate-400">
            Refreshing Top Sellers...
          </div>
        </div>
      </section>
    );
  }

  if (error || !products.length) {
    return (
      <section className="bg-white py-12 sm:py-14 md:py-20">
        <div className="container-shell space-y-8">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              Popular Choice
            </p>
            <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">
              Top Sellers
            </h2>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-24 text-center text-sm font-bold uppercase tracking-widest text-slate-400">
            {error || 'No trending products available'}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-12 sm:py-14 md:py-20">
      <div className="container-shell space-y-8 sm:space-y-10">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:pb-8">
          <div className="max-w-xl">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              High-Velocity Hardware
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
              Top Selling Products
            </h2>
          </div>
          <Link
            to="/products"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border-2 border-slate-900 px-5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-900 transition-all hover:bg-slate-900 hover:text-white sm:min-h-[48px] sm:rounded-full sm:px-8 sm:text-[11px]"
          >
            View Full Catalog
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
          {products.map((product) => (
            <HomeProductCard key={product.id || product.sku} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(TopSellersGrid);
