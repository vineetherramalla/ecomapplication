import { useEffect, useState } from 'react';
import { getCategoryName, getApiErrorMessage, getBrandName, resolveAssetUrl } from '../../../api/apiUtils';
import { getCatalogData } from '@/features/catalog/services/catalogService';
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from '@/features/catalog/services/productService';
import { showToast } from '../../../utils/helpers';
import AdminDataTable from '../components/AdminDataTable';
import AdminPageHeader from '../components/AdminPageHeader';
import ProductEditorModal from '../components/ProductEditorModal';
import { getTopLevelCategories } from '../utils/adminUtils';

const mergeProductIntoList = (currentProducts, nextProduct) => {
  const nextId = String(nextProduct?.id || '');
  const currentIndex = currentProducts.findIndex((product) => String(product.id) === nextId);

  if (currentIndex === -1) {
    return [...currentProducts, nextProduct];
  }

  return currentProducts.map((product, index) => (index === currentIndex ? nextProduct : product));
};

function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subcategoriesByCategory, setSubcategoriesByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [brands, setBrands] = useState([]);
  const [productFlags, setProductFlags] = useState([]);

  const loadCatalog = async () => {
    setLoading(true);
    setError('');
    try {
      let catalogData = { 
        categories: [], 
        subcategories: [], 
        subcategoriesByCategory: {}, 
        brands: [],
        productFlags: []
      };
      try {
        catalogData = await getCatalogData();
      } catch {
        // Keep the product table available even if catalog metadata is temporarily unavailable.
      }
      
      const productList = await getProducts({
        categories: catalogData.categories,
        subcategories: catalogData.subcategories,
        brands: catalogData.brands,
      });

      setCategories(catalogData.categories);
      setSubcategories(catalogData.subcategories);
      setSubcategoriesByCategory(catalogData.subcategoriesByCategory);
      setProducts(productList);
      setBrands(Array.isArray(catalogData.brands) ? catalogData.brands : []);
      setProductFlags(catalogData.productFlags || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load products'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const topLevelCategories = getTopLevelCategories(categories);
  const visibleProducts = products.filter((product) => {
    const matchesQuery = [product.name, product.brandName || getBrandName(product.brand, brands), product.subcategory]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query.toLowerCase()));
    const matchesCategory =
      categoryFilter === 'all' ||
      String(product.category?.id || product.category) === String(categoryFilter);
    return matchesQuery && matchesCategory;
  });

  const openAdd = () => {
    setActiveProduct(null);
    setEditorOpen(true);
  };

  const openEdit = (product) => {
    setActiveProduct(product);
    setEditorOpen(true);
  };

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (activeProduct) {
        const updatedProduct = await updateProduct(activeProduct.id, payload, { categories, subcategories, brands });
        setProducts((current) => mergeProductIntoList(current, updatedProduct));
        showToast({ title: 'Product updated', message: `${updatedProduct.name} was updated.` });
      } else {
        const createdProduct = await createProduct(payload, { categories, subcategories, brands });
        setProducts((current) => mergeProductIntoList(current, createdProduct));
        showToast({ title: 'Product created', message: `${createdProduct.name} was added to the catalog.` });
      }
      setEditorOpen(false);
      setActiveProduct(null);
    } catch (err) {
      showToast({
        title: 'Unable to save product',
        message: getApiErrorMessage(err, 'Product save failed'),
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(`Delete product "${product.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteProduct(product.id);
      setProducts((current) => current.filter((entry) => String(entry.id) !== String(product.id)));
      showToast({ title: 'Product deleted', message: `${product.name} was removed.` });
    } catch (err) {
      showToast({
        title: 'Unable to delete product',
        message: getApiErrorMessage(err, 'Product deletion failed'),
        type: 'error',
      });
    }
  };

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-slate-500">Loading products...</div>;
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <p className="text-lg font-semibold text-rose-900">Unable to load products</p>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Catalog management"
        title="Products"
        description="Create, edit, delete, and enrich products with visuals, technical specs, inventory, and merchandising flags."
        action={
          <button
            type="button"
            onClick={openAdd}
            className="admin-btn-primary max-sm:w-full"
          >
            Add product
          </button>
        }
      />

      <div className="surface-panel grid gap-4 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <label className="field-stack">
          <span className="text-sm font-semibold text-slate-700">Search products</span>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by product name, brand, or subcategory"
            className="admin-control"
          />
        </label>
        <label className="field-stack">
          <span className="text-sm font-semibold text-slate-700">Category filter</span>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="admin-control"
          >
            <option value="all">All categories</option>
            {topLevelCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <AdminDataTable
        tableFixed
        columns={[
          {
            key: 'product',
            label: 'Product',
            width: '32%',
            cellClassName: 'min-w-[300px]',
            render: (product) => (
              <div className="flex min-w-0 items-start gap-4 pr-4">
                {product.images?.[0] ? (
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[18px] border border-slate-100 bg-white p-1">
                    <img
                      src={resolveAssetUrl(product.images[0])}
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-300 border border-slate-100">
                    N/A
                  </div>
                )}
                <div className="min-w-0 pt-1">
                  <p className="font-semibold text-slate-950 leading-relaxed">{product.name}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {product.brandName || getBrandName(product.brand, brands)}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: 'category',
            label: 'Taxonomy',
            width: '20%',
            cellClassName: 'min-w-[180px]',
            render: (product) => (
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-950 uppercase tracking-wider">{getCategoryName(product.category, categories)}</p>
                <p className="mt-1 truncate text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                  {product.subcategory || product.subcategoryData?.name || 'Standard'}
                </p>
              </div>
            ),
          },
          {
            key: 'inventory',
            label: 'Stock',
            width: '13%',
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            render: (product) => (
              <span className="inline-flex rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-slate-600">
                {product.stock} units
              </span>
            ),
          },
          {
            key: 'flags',
            label: 'Attributes',
            width: '18%',
            cellClassName: 'min-w-[160px]',
            render: (product) => (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {product.featured && (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary">
                    Featured
                  </span>
                )}
                {product.topSelling && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-600">
                    Top
                  </span>
                )}
                {product.isNew && (
                  <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-600">
                    New
                  </span>
                )}
                {!product.featured && !product.topSelling && !product.isNew && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                    Standard
                  </span>
                )}
              </div>
            ),
          },
          {
            key: 'actions',
            label: 'Actions',
            width: '17%',
            cellClassName: 'min-w-[150px] text-right',
            render: (product) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(product)}
                  className="admin-btn-secondary !min-h-[36px] !rounded-xl !px-4 !py-1.5 !text-[10px] !font-black !uppercase !tracking-wider"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(product)}
                  className="admin-btn-danger !min-h-[36px] !rounded-xl !px-3 !py-1.5 !text-[10px] !font-black !uppercase"
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
        rows={visibleProducts}
        emptyText="No products match the current filters."
        minWidthClassName="min-w-[1100px]"
      />

      <ProductEditorModal
        open={editorOpen}
        product={activeProduct}
        products={products}
        categories={categories}
        subcategoriesByCategory={subcategoriesByCategory}
        brands={brands}
        setBrands={setBrands}
        productFlags={productFlags}
        submitting={saving}
        onClose={() => {
          setEditorOpen(false);
          setActiveProduct(null);
        }}
        onSubmit={handleSave}
      />
    </div>
  );
}

export default AdminProductsPage;
