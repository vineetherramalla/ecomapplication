import { Link } from 'react-router-dom';
import HomeProductCard from './HomeProductCard';

function CategorySection({ section, index = 0 }) {
  if (!section || !section.products?.length) return null;

  const surfaceClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';

  return (
    <section className={`${surfaceClass} py-12 sm:py-14 md:py-20`}>
      <div className="container-shell space-y-8 sm:space-y-10">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:pb-8">
          <div className="max-w-xl">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              Explore Our Catalog
            </p>
            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
              {section.title}
            </h3>
          </div>
          
          <Link
            to={section.viewAllPath || '/products'}
            className="group inline-flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 transition-colors hover:text-primary"
          >
            <span>View All</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white transition-all group-hover:bg-primary group-hover:text-slate-900 group-hover:translate-x-1 sm:h-8 sm:w-8">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
          {section.products?.map((product) => (
            <HomeProductCard key={product.id || product.sku} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default CategorySection;
