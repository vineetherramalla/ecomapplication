import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ChevronRight, MessageSquare, Package } from 'lucide-react';
import ProductGallery from '../../components/product/ProductGallery';
import SpecificationsTable from '../../components/product/SpecificationsTable';
import { useProducts } from '@/features/catalog/hooks/useProducts';
import RequestPriceModal from '../../components/product/RequestPriceModal';
import placeholder from '../../assets/placeholder.jpg';
import { getApiErrorMessage, getBrandName, getCategoryName, resolveAssetUrl } from '../../api/apiUtils';
import authService from '@/features/auth/services/authService';
import productService from '@/features/catalog/services/productService';
import rfqIntentService from '@/features/rfq/services/rfqIntentService';
import { showToast, slugify, formatCurrency } from '../../utils/helpers';

const hasRenderableProductData = (candidate) =>
  Boolean(
    candidate &&
    (candidate.description ||
      (Array.isArray(candidate.images) && candidate.images.length > 0) ||
      (Array.isArray(candidate.specifications) && candidate.specifications.length > 0)),
  );

/**
 * ProductDetails component representing a premium Redington-style PDP.
 */
function ProductDetails({ productIdOverride = null }) {
  const params = useParams();
  const id = productIdOverride ?? params.id;
  const navigate = useNavigate();
  const location = useLocation();
  const { products = [], categories = [], subcategories = [], brands = [] } = useProducts() ?? {};

  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [product, setProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState('');

  const isAuthenticated = authService.isAuthenticated();
  const cachedProduct = useMemo(
    () => products.find((item) => String(item.id) === String(id)) || null,
    [products, id],
  );

  useEffect(() => {
    let isMounted = true;

    const loadProduct = async () => {
      if (cachedProduct && isMounted) {
        setProduct(cachedProduct);
        setProductError('');
      }

      if (hasRenderableProductData(cachedProduct)) {
        if (isMounted) {
          setProductLoading(false);
        }
        return;
      }

      setProductLoading(true);
      setProductError('');

      try {
        const productData = await productService.getProductById(id, {
          categories,
          subcategories,
          brands,
        });
        if (isMounted) {
          setProduct(productData);
        }
      } catch (error) {
        if (isMounted) {
          setProduct(null);
          setProductError(getApiErrorMessage(error, 'Failed to load product details'));
        }
      } finally {
        if (isMounted) {
          setProductLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id, categories, subcategories, brands, cachedProduct]);

  useEffect(() => {
    if (!product) return;

    const pendingIntent = rfqIntentService.get();
    const shouldResumeIntent =
      isAuthenticated &&
      pendingIntent &&
      String(pendingIntent.productId) === String(id);

    if (shouldResumeIntent || (location.state?.openRFQ && isAuthenticated)) {
      if (pendingIntent?.quantity) {
        setQuantity(Number(pendingIntent.quantity));
      }
      setIsModalOpen(true);
      rfqIntentService.clear();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [id, location.pathname, location.state, navigate, product, isAuthenticated]);

  const handleRequestPrice = () => {
    if (isAuthenticated) {
      setIsModalOpen(true);
    } else {
      rfqIntentService.save({
        productId: id,
        quantity,
        path: location.pathname,
      });
      showToast({ title: 'Authentication Required', message: 'Please sign in to request pricing.' });
      navigate('/login', { state: { from: location, openRFQ: true } });
    }
  };

  if (productLoading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-12">
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg" />
        </div>
        <p className="mt-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Loading Technical Datasheet</p>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="container-shell flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <div className="mb-8 rounded-full bg-slate-50 p-6 text-slate-300">
          <Package size={48} />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
          {productError ? 'System Connection Issue' : 'Product Not Found'}
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500">
          {productError || 'The requested technical datasheet is not available in our primary catalog. It may have been moved or archived.'}
        </p>
        <Link
          to="/products"
          className="mt-8 inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-[11px] font-black uppercase tracking-widest text-textMain transition-all hover:opacity-90 hover:shadow-xl hover:shadow-primary/20"
        >
          Return to Catalog <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const categoryName = getCategoryName(product.category, categories);
  const galleryImages = product.images || [];

  const relatedProducts = products
    .filter((item) => String(item.id) !== String(product.id))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50/30 pb-20">
      {/* Breadcrumb - Redington Minimalist Style */}
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="container-shell">
          <nav className="flex flex-wrap items-center gap-x-2 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight size={12} className="text-slate-300" />
            <Link to="/products" className="hover:text-primary transition-colors">Catalog</Link>
            {categoryName && (
              <>
                <ChevronRight size={12} className="text-slate-300" />
                <Link to={`/products/${slugify(categoryName)}`} className="hover:text-primary transition-colors">{categoryName}</Link>
              </>
            )}
            <ChevronRight size={12} className="text-slate-300" />
            <span className="truncate text-slate-900 font-black">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-shell mt-4 sm:mt-8 xl:mt-12">
        {/* 2-column layout: Gallery | Product Info */}
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          {/* Left: Gallery */}
          <div>
            <div className="rounded-[32px] border border-slate-200 bg-white p-4 sm:p-10 lg:p-12 shadow-xl shadow-slate-200/40">
              <ProductGallery images={galleryImages} alt={product.name} />
            </div>
          </div>

          {/* Right Pillar */}
          <div className="flex flex-col gap-8">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 sm:p-10 shadow-xl shadow-slate-200/30">
              {/* Product Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
                    {product.brandName || getBrandName(product.brand, brands)}
                  </span>
                </div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-textMain sm:text-3xl leading-[1.1]">
                  {product.name}
                </h1>
                <div className="pt-2">
                  <span className="inline-block bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 rounded-sm">
                    {categoryName}
                  </span>
                </div>
                <div className="flex flex-col space-y-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <div className="flex gap-2">
                    <span className="w-10">MPN:</span>
                    <span className="text-slate-900">{product.mpn || 'REFERENCE_N/A'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-10">SKU:</span>
                    <span className="text-slate-900">{product.sku || 'GLOBAL_SKU_PENDING'}</span>
                  </div>
                </div>
              </div>

              {/* Pricing CTA */}
              <div className="my-10">
                {product.price && (
                  <div className="w-full p-8 rounded-[24px] border-2 border-primary/10 bg-primary/5 flex flex-col items-center text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">B2B Commercial Rate</span>
                    <div className="text-4xl font-black text-textMain tracking-tighter sm:text-5xl">
                      {formatCurrency(product.price)}
                    </div>
                  </div>
                )}
              </div>

              {/* Divider and Highlights */}
              <div className="w-full border-t border-dashed border-slate-300 pt-8" />
              <div className="w-full space-y-4 pt-8">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-textMain">Product Highlights</h3>
                <ul className="space-y-3">
                  {product.highlights && product.highlights.length > 0 ? (
                    product.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-600">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                        <span className="text-xs font-medium leading-relaxed tracking-tight">{highlight.replace(/^(?:[•*-])\s*/, '').trim()}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-[10px] uppercase font-bold text-slate-400 tracking-widest italic">
                      No highlighting features recorded for this entry.
                    </li>
                  )}
                </ul>
              </div>

              {/* Quantity and Action - Mobile Optimized */}
              <div className="mt-10 border-t border-slate-100 pt-10">
                <div className="flex flex-col gap-6">
                  {/* Quantity Selector Group */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-textMain">
                      Quantity
                    </span>
                    <div className="flex h-14 w-full items-center justify-between rounded-2xl border-2 border-slate-100 bg-slate-50/30 px-4 transition-all focus-within:border-primary/40 sm:w-[160px]">
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-xl font-black text-slate-400 transition-colors hover:bg-slate-100 hover:text-textMain"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-12 bg-transparent text-center text-base font-black text-slate-900 focus:outline-none"
                      />
                      <button
                        onClick={() => setQuantity(q => q + 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-xl font-black text-slate-400 transition-colors hover:bg-slate-100 hover:text-textMain"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <button
                    onClick={handleRequestPrice}
                    className="flex min-h-[56px] w-full items-center justify-center gap-4 rounded-2xl bg-textMain px-8 py-4 text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-black hover:shadow-2xl hover:shadow-textMain/30 active:scale-[0.98] sm:flex-1"
                  >
                    <MessageSquare size={18} className="text-primary" />
                    <span>Request RFQ Quote</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width Product Overview — description only */}
        {product.description && (
          <div className="mt-16">
            <h2 className="mb-8 text-3xl font-black uppercase tracking-tighter text-textMain">Description</h2>
            <div className="rounded-[40px] border border-slate-200 bg-white p-8 sm:p-12 shadow-xl shadow-slate-200/50">
              <div className="mb-10 flex items-center justify-between border-b border-slate-100 pb-6">
                <h3 className="text-2xl font-black uppercase tracking-tighter text-textMain">Product Details</h3>
                <div className="h-1 w-12 rounded-full bg-primary/20" />
              </div>
              <ul className="space-y-5">
                {product.description.split('\n').filter(p => p.trim()).map((point, idx) => (
                  <li key={idx} className="flex items-start gap-4 text-slate-600">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    <span className="text-[15px] font-medium leading-relaxed tracking-tight">
                      {point.replace(/^(?:[•*-])\s*/, '').trim()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Area */}
      <div className="container-shell mt-16 lg:mt-24">
        <div className="mb-12 border-b border-slate-200">
          <div className="flex gap-10">
            <button className="pb-6 text-[11px] font-black uppercase tracking-[0.3em] text-textMain border-b-4 border-primary">
              Specifications
            </button>
          </div>
        </div>

        <div className="w-full">
          <SpecificationsTable specifications={product.specifications} />
        </div>
      </div>

      {/* Recommendations */}
      {relatedProducts.length > 0 && (
        <div className="container-shell mt-20 lg:mt-32">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2 block">Curation</span>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-textMain">Recommended Solutions</h2>
            </div>
            <Link to="/products" className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-textMain transition-colors">
              Full Portfolio <ArrowRight size={14} className="group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((item) => (
              <Link
                key={item.id}
                to={`/product/${item.id}`}
                className="group bg-white rounded-[24px] border border-slate-100 p-6 transition-all hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1"
              >
                <div className="aspect-square rounded-2xl bg-slate-50/50 p-4 mb-6 overflow-hidden">
                  <img
                    src={resolveAssetUrl(item.images?.[0] || item.image)}
                    alt={item.name}
                    className="h-full w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => { e.currentTarget.src = placeholder; }}
                  />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                  {item.brandName || getBrandName(item.brand, brands)}
                </span>
                <h3 className="text-xs font-black uppercase tracking-tight text-textMain line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                  {item.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* RFQ Modal */}
      <RequestPriceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        quantity={quantity}
      />
    </div>
  );
}

export default ProductDetails;
