import { useEffect, useState } from 'react';
import { getDashboardData } from '@/features/dashboard/services/dashboardService';
import { getApiErrorMessage } from '../../../api/apiUtils';
import AdminDataTable from '../components/AdminDataTable';
import AdminPageHeader from '../components/AdminPageHeader';
import AdminStatCard from '../components/AdminStatCard';
import { formatAdminDate, formatRequestStatus, getRequestStatusClasses } from '../utils/adminUtils';

function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const dashboardData = await getDashboardData();
      setData(dashboardData);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load admin dashboard'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
          <p className="text-sm font-medium">Crunching operational data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <p className="text-lg font-semibold text-rose-900">Unable to load admin dashboard</p>
        <p className="mt-2 text-sm">{error}</p>
        <button 
          onClick={loadDashboard}
          className="admin-btn-secondary mt-4 !min-h-[40px] !border-rose-200 !bg-rose-100 !px-4 !py-2 !text-xs !font-bold !uppercase !tracking-[0.18em] !text-rose-800 hover:!bg-rose-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { summary, low_stock_products, top_selling_products, recent_requests } = data;



  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Admin workspace"
        title="Command Center"
        description="Monitor system health, inventory levels, and customer interactions from a unified operational dashboard."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Total Categories"
          value={<span className="text-primary">{summary.total_categories ?? summary.totalCategories ?? 0}</span>}
          helper="Active taxonomy groups"
        />
        <AdminStatCard
          label="Total Products"
          value={<span className="text-primary">{summary.total_products ?? summary.totalProducts ?? 0}</span>}
          helper="Live catalog entries"
        />
        <AdminStatCard
          label="Inventory Items"
          value={<span className="text-primary">{summary.total_inventory ?? summary.totalInventory ?? 0}</span>}
          helper="Tracked SKU records"
        />
        <AdminStatCard
          label="Total RFQs"
          value={<span className="text-primary">{summary.total_requests ?? summary.totalRequests ?? 0}</span>}
          helper="Lifetime quote requests"
        />
        <AdminStatCard
          label="Pending"
          value={<span className="text-amber-500">{summary.requests_pending ?? summary.pending_requests ?? summary.pendingRequests ?? summary.pending ?? 0}</span>}
          helper="Awaiting review"
        />
        <AdminStatCard
          label="Quote Sent"
          value={<span className="text-blue-500">{summary.requests_quote_sent ?? summary.quote_sent_requests ?? summary.requests_quoted ?? summary.quoted_requests ?? summary.quotedRequests ?? summary.quote_sent ?? 0}</span>}
          helper="Processing quote"
        />
        <AdminStatCard
          label="Closed"
          value={<span className="text-emerald-500">{summary.requests_closed ?? summary.closed_requests ?? summary.closedRequests ?? summary.closed ?? 0}</span>}
          helper="Fulfilled or archived"
        />
        <AdminStatCard
          label="Low Stock Alerts"
          value={<span className="text-rose-500">{Array.isArray(low_stock_products) ? low_stock_products.length : 0}</span>}
          helper="SKUs that need replenishment soon"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2 xl:gap-8">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="section-eyebrow">Watchlist</p>
              <h2 className="section-title">Low Stock Alerts</h2>
            </div>
            <span className="inline-flex self-start rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-rose-500">
              Action Required
            </span>
          </div>

          <AdminDataTable
            tableFixed={true}
            columns={[
              {
                key: 'name',
                label: 'Product',
                width: '75%',
                cellClassName: 'min-w-[220px]',
                render: (row) => (
                  <div className="min-w-0 max-w-[320px] py-1">
                    <p className="truncate font-semibold text-slate-900" title={row.name}>{row.name}</p>
                    <p className="truncate text-[11px] uppercase tracking-[0.16em] text-slate-500">{row.brand}</p>
                  </div>
                ),
              },
              {
                key: 'stock',
                label: 'Stock',
                width: '25%',
                headerClassName: 'text-right',
                cellClassName: 'text-right',
                render: (row) => {
                  const stock = Number(row.stock ?? row.inventory_count ?? row.inventory?.stock ?? row.quantity ?? 0);
                  return (
                    <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black border ${
                      stock <= 5
                        ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-[0_2px_10px_rgba(225,29,72,0.1)]'
                        : 'bg-amber-50 text-amber-600 border-amber-200'
                    }`}>
                      {stock} UNITS
                    </span>
                  );
                },
              },
            ]}
            rows={low_stock_products}
            emptyText="No inventory alerts at this time."
            minWidthClassName="min-w-[520px]"
          />
        </div>

        <div className="space-y-4">
          <div className="min-w-0">
            <p className="section-eyebrow">Performance</p>
            <h2 className="section-title">Top Moving Items</h2>
          </div>

          <div className="surface-panel overflow-hidden p-0">
            {top_selling_products.length ? (
              <div className="divide-y divide-slate-50">
                {top_selling_products.slice(0, 5).map((product, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center gap-5 p-5 transition-colors hover:bg-slate-50/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-[11px] font-black text-slate-400 transition-colors group-hover:bg-primary group-hover:text-textMain">
                      {idx + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span>{product.brand}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                        <span className="text-primary">{product.category}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div 
                          className="h-full rounded-full bg-primary transition-all duration-1000" 
                          style={{ width: `${100 - idx * 15}%` }} 
                        />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Performance</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-sm text-slate-400">
                No performance data yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="min-w-0">
          <p className="section-eyebrow">Engagement</p>
          <h2 className="section-title">Recent Pricing Requests</h2>
        </div>

        <AdminDataTable
          tableFixed={true}
          columns={[
            {
              key: 'customer',
              label: 'Customer Info',
              width: '28%',
              cellClassName: 'min-w-[220px]',
              render: (row) => (
                <div className="min-w-0 max-w-[220px]">
                  <p className="truncate font-semibold text-slate-900">{row.name}</p>
                  <p className="truncate text-xs text-slate-500">{row.email}</p>
                </div>
              ),
            },
            {
              key: 'product',
              label: 'Requested Item',
              width: '30%',
              cellClassName: 'min-w-[220px]',
              render: (row) => (
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">{row.product_name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Qty: {row.quantity}</p>
                </div>
              ),
            },
            {
              key: 'status',
              label: 'Status',
              width: '18%',
              headerClassName: 'text-center',
              cellClassName: 'text-center',
              render: (row) => (
                <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] whitespace-nowrap font-black uppercase tracking-[0.2em] shadow-sm ${getRequestStatusClasses(row.status)}`}>
                  {formatRequestStatus(row.status)}
                </span>
              ),
            },
            {
              key: 'date',
              label: 'Submitted On',
              width: '24%',
              headerClassName: 'text-right',
              cellClassName: 'text-right whitespace-nowrap',
              render: (row) => (
                <span className="text-xs font-medium text-slate-500">
                  {formatAdminDate(row.created_at)}
                </span>
              ),
            },
          ]}
          rows={recent_requests}
          emptyText="No recent requests to display."
          minWidthClassName="min-w-[860px]"
        />
      </section>
    </div>
  );
}

export default AdminDashboardPage;
