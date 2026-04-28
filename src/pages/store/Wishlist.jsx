import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Loader2 } from 'lucide-react';
import ProductGrid from '@/components/product/ProductGrid';
import { useProducts } from '@/features/catalog/hooks/useProducts';
import { useWishlist } from '@/features/wishlist/hooks/useWishlist';
import authService from '@/features/auth/services/authService';

function Wishlist() {
  const { products = [], loading: productsLoading = false, error: productsError = '' } = useProducts() ?? {};
  const wishlist = useWishlist();
  const productIds = wishlist?.productIds || [];
  const wishlistProducts = products.filter((product) => productIds.includes(String(product.id)));
  const missingCount = Math.max(productIds.length - wishlistProducts.length, 0);
  const loading = productsLoading || wishlist?.loading;
  const isAuthenticated = authService.isAuthenticated();

  return (
    <div className="container-shell pb-16 pt-8 sm:pt-12 lg:pb-24">
      <div className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">Saved catalog</p>
          <h1 className="mt-3 text-3xl font-black uppercase tracking-tighter text-textMain sm:text-4xl">
            Wishlist
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">
            {isAuthenticated
              ? 'Your saved products are synced to your account.'
              : 'Your wishlist is saved on this device. Sign in to sync it across sessions.'}
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-2xl bg-textMain px-6 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-black"
        >
          Browse products <ArrowRight size={15} className="text-primary" />
        </Link>
      </div>

      {wishlist?.error ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">
          {wishlist.error}
        </div>
      ) : null}

      {productsError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-10 text-center">
          <p className="text-lg font-black uppercase tracking-tight text-rose-700">Unable to load wishlist products</p>
          <p className="mx-auto mt-3 max-w-xl text-sm text-rose-600">{productsError}</p>
        </div>
      ) : loading ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 text-slate-400">
          <Loader2 size={34} className="animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Loading wishlist</p>
        </div>
      ) : wishlistProducts.length ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-sm font-bold text-slate-600">
              {wishlistProducts.length} saved product{wishlistProducts.length === 1 ? '' : 's'}
            </p>
            {missingCount ? (
              <p className="text-xs font-semibold text-slate-400">
                {missingCount} saved item{missingCount === 1 ? '' : 's'} no longer appear in the catalog.
              </p>
            ) : null}
          </div>
          <ProductGrid products={wishlistProducts} />
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-20 text-center shadow-xl shadow-slate-200/30">
          <Heart size={44} className="mx-auto text-slate-300" />
          <h2 className="mt-5 text-2xl font-black uppercase tracking-tight text-textMain">No saved products yet</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm font-medium leading-6 text-slate-500">
            Tap the heart on any product card to build a shortlist for later.
          </p>
          <Link
            to="/products"
            className="mt-8 inline-flex min-h-[48px] items-center justify-center gap-3 rounded-2xl bg-primary px-6 text-[10px] font-black uppercase tracking-widest text-textMain transition-opacity hover:opacity-90"
          >
            Explore catalog <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}

export default Wishlist;
