import { useMemo } from 'react';
import { getBrandName, getCategoryName } from '../../api/apiUtils';
import { useProducts } from '@/features/catalog/hooks/useProducts';
import HeroBanner from '../../components/home/HeroBanner';
import TopSellersGrid from '../../components/home/TopSellersGrid';

import CategoryBrandStrip from '../../components/home/CategoryBrandStrip';
import CategorySection from '../../components/home/CategorySection';

import {
  categoryBrandStrip as showcaseCategoryBrandStrip,
  heroSlides,
} from '../../data/homepageShowcase';

const normalizeText = (value) => String(value || '').trim();

const BRAND_SERIES_ALIASES = {
  Dell: ['precision', 'ultrasharp', 'latitude', 'optiplex', 'vostro', 'inspiron', 'alienware'],
  HP: ['hp z', 'zbook', 'elitedisplay', 'elitebook', 'probook', 'omen'],
  Lenovo: ['thinkpad', 'thinkcentre', 'thinkvision', 'legion', 'yoga'],
  Epson: ['ecotank', 'powerlite', 'workforce'],
  Acer: ['travelmate', 'predator', 'nitro', 'aspire', 'veriton'],
  MSI: ['stealth', 'raider', 'prestige', 'creator', 'vector', 'katana'],
};

const resolveBrandWithLogo = (brandName, logoByBrand) => {
  const normalizedBrandName = normalizeText(brandName).toLowerCase();

  if (!normalizedBrandName) {
    return null;
  }

  const directMatch = logoByBrand.get(normalizedBrandName);
  if (directMatch) {
    return directMatch;
  }

  for (const [logoName, logoEntry] of logoByBrand.entries()) {
    if (normalizedBrandName.includes(logoName)) {
      return logoEntry;
    }
  }

  for (const [brandKey, aliases] of Object.entries(BRAND_SERIES_ALIASES)) {
    if (aliases.some((alias) => normalizedBrandName.includes(alias))) {
      return logoByBrand.get(brandKey.toLowerCase()) || null;
    }
  }

  return null;
};

const buildProductCard = (product, categories = []) => {
  const categoryName = getCategoryName(product.category, categories);

  return {
    id: product.id,
    name: normalizeText(product.name),
    brand: normalizeText(product.brandName || getBrandName(product.brand)),
    category: categoryName,
    productType: normalizeText(product.subcategory) || categoryName || 'Product',
    mpn: product.mpn || product.model_number || product.model || '--',
    sku: product.sku || product.sku_code || product.item_code || '--',
    image: product.images?.[0] || product.image || product.thumbnail || '',
    isNew: Boolean(product.isNew || product.featured),
  };
};

function Home() {
  const { products = [], topSellingProducts = [], categories = [], brands = [], loading = false, error = null } = useProducts() ?? {};

  const topSellers = useMemo(() => {
    const sourceProducts =
      Array.isArray(topSellingProducts) && topSellingProducts.length
        ? topSellingProducts
        : Array.isArray(products)
          ? products
          : [];

    return sourceProducts.slice(0, 4).map((product) => buildProductCard(product, categories));
  }, [topSellingProducts, products, categories]);

  const categorySections = useMemo(() => {
    if (!Array.isArray(products) || !products.length) {
      return [];
    }

    // Grouping by category ID first, then resolving names for sections
    const grouped = products.reduce((acc, product) => {
      const catId = product.categoryId || product.category?.id || (typeof product.category === 'string' ? product.category : null);
      if (!catId) return acc;

      if (!acc[catId]) {
        acc[catId] = {
          id: catId,
          title: getCategoryName(catId, categories) || 'Product Suite',
          products: [],
          viewAllPath: `/products?category=${catId}`,
        };
      }

      if (acc[catId].products.length < 8) {
        acc[catId].products.push(buildProductCard(product, categories));
      }
      return acc;
    }, {});

    // Prioritize key categories if they exist (Laptops, Desktops, Monitors, etc)
    const priorityNames = ['laptops', 'desktops', 'monitors', 'accessories', 'storage'];
    
    return Object.values(grouped)
      .sort((a, b) => {
        const aIndex = priorityNames.indexOf(a.title.toLowerCase());
        const bIndex = priorityNames.indexOf(b.title.toLowerCase());
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return 0;
      })
      .filter((section) => section.products.length > 0);
  }, [products, categories]);

  const categoryBrandStrip = useMemo(() => {
    const logoByBrand = new Map(
      showcaseCategoryBrandStrip.brands.map((brand) => [normalizeText(brand.name).toLowerCase(), brand]),
    );

    const liveBrands = (
      Array.isArray(brands) && brands.length
        ? brands.map((brand) => brand?.name)
        : products.map((product) => product.brandName || getBrandName(product.brand, brands))
    )
      .map((brand) => normalizeText(brand))
      .filter(Boolean);

    const uniqueLiveBrands = Array.from(new Set(liveBrands));
    const normalizedLiveBrands = uniqueLiveBrands.map((brandName) => {
      const showcaseBrand = resolveBrandWithLogo(brandName, logoByBrand);
      return showcaseBrand ? { ...showcaseBrand, name: brandName } : { name: brandName };
    });

    const fallbackShowcaseBrands = showcaseCategoryBrandStrip.brands.filter(
      (brand) => !uniqueLiveBrands.some((liveBrand) => liveBrand.toLowerCase() === normalizeText(brand.name).toLowerCase()),
    );

    const finalBrands = [...normalizedLiveBrands, ...fallbackShowcaseBrands];

    return {
      ...showcaseCategoryBrandStrip,
      brands: finalBrands,
    };
  }, [brands, products]);


  return (
    <main className="bg-greyLight">
      <HeroBanner slides={heroSlides} />
      <TopSellersGrid products={topSellers} loading={loading} error={error} />

      <CategoryBrandStrip data={categoryBrandStrip} />
      {categorySections.map((section, idx) => (
        <CategorySection key={section.title} section={section} index={idx} />
      ))}
      {!loading && !error && !categorySections.length ? (
        <section className="bg-white py-14">
          <div className="container-shell rounded-3xl border border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            No products available
          </div>
        </section>
      ) : null}

    </main>
  );
}

export default Home;


