import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Search, LogOut, User } from 'lucide-react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { useProducts } from '@/features/catalog/hooks/useProducts';
import { isAdminUser } from '@/features/auth/utils/access';
import { getBrandName, resolveAssetUrl } from '../../api/apiUtils';
import searchApi from '@/api/searchApi';
import { useWishlist } from '@/features/wishlist/hooks/useWishlist';

function TopHeader({ profile, handleLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [remoteSuggestions, setRemoteSuggestions] = useState([]);
  const searchContainerRef = useRef(null);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  
  const { products = [], brands = [] } = useProducts() || {};
  const wishlist = useWishlist();
  const wishlistCount = wishlist?.count || 0;
  const urlSearchTerm = useMemo(
    () => new URLSearchParams(location.search).get('search') || '',
    [location.search],
  );

  useEffect(() => {
    setSearchTerm(urlSearchTerm);
  }, [urlSearchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmedQuery = deferredSearchTerm.trim().toLowerCase();

  useEffect(() => {
    let isMounted = true;

    if (trimmedQuery.length < 2) {
      setRemoteSuggestions([]);
      return () => {
        isMounted = false;
      };
    }

    const timer = window.setTimeout(async () => {
      try {
        const suggestions = await searchApi.autocompleteSearch(trimmedQuery);
        if (isMounted) {
          setRemoteSuggestions(suggestions);
        }
      } catch {
        if (isMounted) {
          setRemoteSuggestions([]);
        }
      }
    }, 180);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [trimmedQuery]);

  const searchResults = useMemo(() => {
    if (!trimmedQuery) return { products: [], suggestions: [] };
    if (!products?.length) return { products: [], suggestions: remoteSuggestions.slice(0, 6) };
    const matchedProducts = products.filter((product) => {
      const brandName = getBrandName(product.brand, brands);

      return (
        String(product.name).toLowerCase().includes(trimmedQuery) ||
        String(product.sku).toLowerCase().includes(trimmedQuery) ||
        brandName.toLowerCase().includes(trimmedQuery)
      );
    });

    const suggestSet = new Set();
    matchedProducts.forEach((product) => {
       const brandName = product.brandName || getBrandName(product.brand);
       if (brandName.toLowerCase().includes(trimmedQuery)) suggestSet.add(brandName);
       if (product.subcategory && String(product.subcategory).toLowerCase().includes(trimmedQuery)) suggestSet.add(product.subcategory);
       if (product.categoryName && String(product.categoryName).toLowerCase().includes(trimmedQuery)) suggestSet.add(product.categoryName);
    });

    return {
       products: matchedProducts.slice(0, 4),
       suggestions: Array.from(new Set([...remoteSuggestions, ...suggestSet])).slice(0, 6)
    };
  }, [trimmedQuery, products, brands, remoteSuggestions]);

  const handleSearchSubmit = (event) => {
    if (event) event.preventDefault();
    const finalQuery = searchTerm.trim();
    setIsDropdownOpen(false);

    if (!finalQuery) {
      navigate('/products');
      return;
    }

    navigate(`/products?search=${encodeURIComponent(finalQuery)}`);
  };

  return (
    <div className="relative z-[70] border-b border-black/5 bg-white">
      <div className="container-shell py-2 lg:py-4">
        <div className="flex flex-col gap-2 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-6 xl:gap-8">
          
          {/* Top Row for Mobile: Logo + Auth actions */}
          <div className="flex items-center justify-between w-full lg:w-auto">
            <NavLink to="/" className="group flex shrink-0 items-center">
              <img
                src={logo}
                alt="Nx Sys Distribution"
                className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105 lg:h-16"
                width="240"
                height="64"
              />
            </NavLink>

            {/* Mobile Auth Actions - Display as small icons or text on mobile */}
            <div className="flex items-center gap-2 lg:hidden">
              <Link
                to="/wishlist"
                className="relative p-1 text-textMain transition-colors hover:text-primary"
                title="Wishlist"
                aria-label="Wishlist"
              >
                <Heart size={18} />
                {wishlistCount ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black text-textMain">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                ) : null}
              </Link>
              {!profile ? (
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/login"
                    className="text-[10px] font-black uppercase tracking-widest text-textMain px-2 py-1.5 hover:text-primary transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-textMain text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-black transition-colors"
                  >
                    Register
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to={isAdminUser(profile) ? '/admin' : '/'}
                    className="p-1 text-textMain hover:text-primary transition-colors"
                    title={profile.name}
                  >
                    <User size={18} />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-1 text-textMain hover:text-rose-500 transition-colors"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar Row - Second on mobile, middle on desktop */}
          <div ref={searchContainerRef} className="min-w-0 w-full relative lg:order-2">
            <form
              onSubmit={handleSearchSubmit}
              className="group relative flex min-h-[40px] lg:min-h-[48px] w-full overflow-hidden rounded-xl lg:rounded-2xl border border-black/5 bg-white shadow-inner transition-all duration-300 focus-within:border-primary focus-within:bg-white"
            >
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 lg:pl-4">
                <Search size={14} className="text-textMain group-focus-within:text-primary lg:size-[16px]" />
              </div>
              <input
                value={searchTerm}
                onChange={(event) => {
                  startTransition(() => {
                    setSearchTerm(event.target.value);
                  });
                  if (!isDropdownOpen) setIsDropdownOpen(true);
                }}
                onFocus={() => {
                  if (searchTerm.trim().length > 0) setIsDropdownOpen(true);
                }}
                type="text"
                placeholder="Search products..."
                className="min-w-0 flex-1 bg-transparent py-2 pl-9 lg:pl-11 pr-3 text-[12px] font-semibold text-textMain placeholder:text-textMain/40 focus:outline-none lg:py-3 lg:text-sm"
              />
              <button
                type="submit"
                className="shrink-0 self-stretch rounded-none bg-textMain px-3 lg:px-6 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-black z-10 relative"
              >
                Search
              </button>
            </form>

            {/* Flyout Search Dropdown */}
            {isDropdownOpen && trimmedQuery.length > 0 && (
              <div className="absolute top-[105%] left-0 right-0 z-[100] mt-1 w-full flex flex-col md:flex-row overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl divide-y md:divide-y-0 md:divide-x divide-slate-100 max-h-[70vh] md:max-h-[500px]">
                {/* Left side: suggestions (Hidden on very small mobile if too cluttered, but kept for now) */}
                <div className="w-full md:w-[35%] bg-slate-50/50 p-4 md:p-5 hidden sm:block">
                  <h3 className="mb-3 md:mb-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Search suggestions</h3>
                  {searchResults.suggestions.length > 0 ? (
                    <ul className="space-y-2 md:space-y-3">
                      {searchResults.suggestions.map((suggestion, idx) => (
                        <li key={idx}>
                          <button
                            type="button"
                            className="block w-full truncate text-left text-[12px] md:text-[13px] font-medium text-slate-700 transition-colors hover:text-primary"
                            onClick={() => {
                              setSearchTerm(suggestion);
                              setIsDropdownOpen(false);
                              navigate(`/products?search=${encodeURIComponent(suggestion)}`);
                            }}
                          >
                            {suggestion}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium">No results.</p>
                  )}
                </div>

                {/* Right side: products */}
                <div className="flex w-full flex-col md:w-[65%] p-4 md:p-5 bg-white">
                  <h3 className="mb-3 md:mb-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Products</h3>
                  <div className="flex-1 overflow-y-auto pr-2">
                    {searchResults.products.length > 0 ? (
                      <div className="space-y-3 md:space-y-4">
                        {searchResults.products.map((p) => (
                          <Link
                            key={p.id}
                            to={`/product/${p.id}`}
                            onClick={() => setIsDropdownOpen(false)}
                            className="group flex items-start gap-3 md:gap-4"
                          >
                            <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50 p-1">
                              {p.images?.[0] || p.image ? (
                                <img
                                  src={resolveAssetUrl(p.images?.[0] || p.image)}
                                  alt={p.name}
                                  className="max-h-full max-w-full object-contain"
                                  loading="lazy"
                                />
                              ) : (
                                <span className="text-[8px] font-black uppercase text-slate-300">N/A</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1 pt-0.5">
                              <p className="truncate text-xs md:text-[13px] font-semibold text-slate-900 transition-colors group-hover:text-primary">
                                {p.name}
                              </p>
                              <p className="mt-0.5 truncate text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                {p.brandName || getBrandName(p.brand, brands)} {p.sku ? `• ${p.sku}` : ''}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-medium text-slate-400 mt-1">
                        No matches found.
                      </p>
                    )}
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-4 md:mt-6 md:pt-5">
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="inline-flex w-full md:w-auto items-center justify-center rounded border border-primary px-4 py-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-white"
                    >
                      See All Products
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Auth Actions - Hidden on mobile, third on desktop grid */}
          <div className="hidden lg:flex lg:items-center lg:gap-3 lg:order-3">
            <Link
              to="/wishlist"
              className="relative inline-flex min-h-[46px] w-[46px] items-center justify-center rounded-xl border border-black/5 bg-white text-textMain shadow-sm transition-all hover:bg-slate-50"
              title="Wishlist"
              aria-label="Wishlist"
            >
              <Heart size={17} />
              {wishlistCount ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-black text-textMain">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              ) : null}
            </Link>
            {!profile ? (
              <>
                <NavLink
                  to="/register"
                  className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-textMain px-5 py-3 text-center text-[11px] font-black uppercase tracking-widest text-white shadow-md transition-all hover:bg-black min-w-[120px]"
                >
                  Register
                </NavLink>

                <NavLink
                  to="/login"
                  className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-black/5 bg-white px-5 py-3 text-center text-[11px] font-black uppercase tracking-widest text-textMain shadow-sm transition-all hover:bg-slate-50 min-w-[120px]"
                >
                  Login
                </NavLink>
              </>
            ) : (
              <>
                <Link
                  to={isAdminUser(profile) ? '/admin' : '/'}
                  className="flex items-center gap-1.5 rounded-xl border border-black/5 bg-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-textMain transition-colors hover:bg-black/5 max-w-[220px]"
                >
                  <User size={16} className="shrink-0" />
                  <span className="truncate">{profile.name || 'Account'}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl bg-textMain px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-md transition-all hover:bg-black"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TopHeader;
