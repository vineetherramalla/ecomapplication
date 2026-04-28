import { useEffect, useState } from 'react';
import { getProducts } from '@/api/productApi';
import { getApiErrorMessage, getBrandName, getCategoryName } from '../../../api/apiUtils';
import { getCatalogData } from '@/features/catalog/services/catalogService';
import inventoryService from '@/features/inventory/services/inventoryService';
import { showToast } from '../../../utils/helpers';
import AdminDataTable from '../components/AdminDataTable';
import AdminPageHeader from '../components/AdminPageHeader';
import AdminModal from '../components/AdminModal';

function AdminInventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [brands, setBrands] = useState([]);

  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [updatedStock, setUpdatedStock] = useState(0);
  const [updating, setUpdating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [inventoryList, catalogData] = await Promise.all([
        inventoryService.getInventory(),
        getCatalogData().catch(() => ({ categories: [], brands: [] })),
      ]);

      const productList = await getProducts(catalogData).catch(() => []);

      const productMap = new Map((productList || []).map((product) => [String(product.id), product]));
      
      const enrichedInventory = (inventoryList || []).map((item) => {
        const productId = item.product?.id || item.product;
        return {
          ...item,
          product: productMap.get(String(productId)) || item.product,
        };
      });

      setInventory(enrichedInventory);
      setCategories(catalogData.categories);
      setBrands(catalogData.brands || []);

    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load inventory data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const visibleItems = inventory.filter((item) => {
    const product = item.product || {};
    const matchesQuery = [product.name, getBrandName(product.brand, brands), product.sku]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query.toLowerCase()));
    return matchesQuery;
  });

  const handleEditClick = (item) => {
    setActiveItem(item);
    setUpdatedStock(item.stock);
    setEditModalOpen(true);
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!activeItem) return;

    setUpdating(true);
    try {
      await inventoryService.updateStock(activeItem.id, activeItem.product?.id, updatedStock);
      showToast({ title: 'Inventory updated', message: `Stock for ${activeItem.product?.name} updated to ${updatedStock}.` });
      setEditModalOpen(false);
      await loadData();
    } catch (err) {
      showToast({
        title: 'Update failed',
        message: getApiErrorMessage(err, 'Unable to update stock'),
        type: 'error',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-slate-500">Loading inventory...</div>;
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <p className="text-lg font-semibold text-rose-900">Unable to load inventory</p>
        <p className="mt-2 text-sm">{error}</p>
        <button
          onClick={loadData}
          className="admin-btn-secondary mt-4 !min-h-[40px] !border-rose-200 !bg-rose-100 !px-4 !py-2 !text-xs !font-bold !uppercase !tracking-[0.18em] !text-rose-800 hover:!bg-rose-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Stock management"
        title="Inventory Control"
        description="Monitor and update product availability across the catalog. Use SKU or name to find specific stock records."
      />

      <div className="surface-panel p-5 sm:p-6">
        <label className="field-stack">
          <span className="text-sm font-semibold text-slate-700">Search products in inventory</span>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by product name, SKU, or brand"
            className="admin-control"
          />
        </label>
      </div>

      <AdminDataTable
        tableFixed
        columns={[
          {
            key: 'product',
            label: 'Product',
            width: '35%',
            cellClassName: 'min-w-[320px]',
            render: (item) => (
              <div className="min-w-0 pr-4">
                <p className="font-semibold text-slate-950 leading-relaxed">{item.product?.name || 'Unknown Product'}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span>{item.product?.brandName || getBrandName(item.product?.brand) || 'No Brand'}</span>
                  <span className="h-0.5 w-1 rounded-full bg-slate-200" />
                  <span className="text-secondary">{item.product?.mpn || 'No MPN'}</span>
                </div>
              </div>
            ),
          },
          {
            key: 'sku',
            label: 'SKU',
            width: '15%',
            cellClassName: 'min-w-[140px]',
            render: (item) => (
              <div className="inline-flex rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5">
                <code className="text-[11px] font-black uppercase tracking-widest text-slate-600">{item.product?.sku || 'N/A'}</code>
              </div>
            ),
          },
          {
            key: 'category',
            label: 'Category',
            width: '20%',
            cellClassName: 'min-w-[180px]',
            render: (item) => (
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {getCategoryName(item.product?.category, categories)}
              </p>
            ),
          },
          {
            key: 'stock',
            label: 'Current Stock',
            width: '15%',
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            render: (item) => (
              <div className="flex flex-col items-center gap-1">
                <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest ${
                  item.stock > 10 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/5' 
                  : 'bg-rose-50 text-rose-600 border border-rose-100'
                }`}>
                  {item.stock} UNITS
                </span>
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Availability</span>
              </div>
            ),
          },
          {
            key: 'actions',
            label: 'Actions',
            width: '15%',
            cellClassName: 'text-right min-w-[140px]',
            render: (item) => (
              <button
                onClick={() => handleEditClick(item)}
                className="admin-btn-secondary !min-h-[38px] !rounded-xl !px-4 !py-1.5 !text-[11px] !font-black !uppercase !tracking-wider"
              >
                Edit Stock
              </button>
            ),
          },
        ]}
        rows={visibleItems}
        emptyText="No inventory records found matching your search."
        minWidthClassName="min-w-[1100px]"
      />

      <AdminModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Adjust Inventory"
        description={`Set a new stock level for ${activeItem?.product?.name}. This update will be immediately reflected in the storefront.`}
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
             <button
              onClick={() => setEditModalOpen(false)}
              className="admin-btn-secondary"
            >
              Cancel
            </button>
            <button
              form="stock-update-form"
              disabled={updating}
              className="admin-btn-primary"
            >
              {updating ? 'Updating...' : 'Save Stock Level'}
            </button>
          </div>
        }
      >
        <form id="stock-update-form" onSubmit={handleUpdateStock} className="space-y-4">
          <label className="field-stack">
            <span className="text-sm font-semibold text-slate-700">Stock Quantity</span>
            <input
              type="number"
              min="0"
              required
              value={updatedStock}
              onChange={(e) => setUpdatedStock(parseInt(e.target.value) || 0)}
              className="admin-control"
            />
          </label>
        </form>
      </AdminModal>
    </div>
  );
}

export default AdminInventoryPage;
