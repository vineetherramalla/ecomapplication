import { memo } from 'react';
import ProductCard from './ProductCard';

function ProductGrid({ products, viewMode = 'grid' }) {
  if (!products.length) {
    return (
      <div className="bg-white border border-greyBorder p-12 text-center card-b2b">
        <h3 className="text-xl font-bold text-textMain uppercase tracking-tight">No Results Found</h3>
        <p className="mt-3 max-w-xs mx-auto text-sm text-textSecondary">
          We couldn&apos;t find any products matching your current filters. Try refining your search or clearing filters.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        viewMode === 'list'
          ? 'flex flex-col gap-6'
          : 'grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4'
      }
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} viewMode={viewMode} />
      ))}
    </div>
  );
}

export default memo(ProductGrid);
