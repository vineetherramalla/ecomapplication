import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Heart,
  Package,
  RefreshCw,
  ShoppingCart,
  Star,
  Users,
} from 'lucide-react';
import analyticsApi from '@/api/analyticsApi';
import { getApiErrorMessage } from '@/api/apiUtils';
import AdminPageHeader from '../components/AdminPageHeader';
import AdminStatCard from '../components/AdminStatCard';

const DATASETS = [
  { key: 'combined', label: 'Combined', icon: Activity, load: analyticsApi.getComprehensiveAnalytics },
  { key: 'sales', label: 'Sales', icon: ShoppingCart, load: analyticsApi.getSalesAnalytics },
  { key: 'customers', label: 'Customers', icon: Users, load: analyticsApi.getCustomerAnalytics },
  { key: 'reviews', label: 'Reviews', icon: Star, load: analyticsApi.getReviewAnalytics },
  { key: 'wishlists', label: 'Wishlist', icon: Heart, load: analyticsApi.getWishlistAnalytics },
  { key: 'inventory', label: 'Inventory', icon: Package, load: analyticsApi.getInventoryAnalytics },
];

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const titleize = (value) =>
  String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatMetric = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return value || '0';
  }

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: number % 1 ? 1 : 0,
  }).format(number);
};

const getMetricCards = (payload) => {
  const source = payload?.summary || payload?.metrics || payload?.totals || payload;
  if (!isPlainObject(source)) {
    return [];
  }

  return Object.entries(source)
    .filter(([, value]) => typeof value === 'number' || (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))))
    .slice(0, 8)
    .map(([key, value]) => ({
      label: titleize(key),
      value,
    }));
};

const getSeriesRows = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isPlainObject(payload)) {
    return [];
  }

  const candidates = [
    payload.series,
    payload.chart,
    payload.data,
    payload.results,
    payload.items,
    payload.by_day,
    payload.by_month,
    payload.trends,
  ];

  const arrayCandidate = candidates.find(Array.isArray);
  if (arrayCandidate) {
    return arrayCandidate;
  }

  const objectCandidate = candidates.find(isPlainObject);
  if (objectCandidate) {
    return Object.entries(objectCandidate).map(([label, value]) => ({
      label,
      value: typeof value === 'object' ? value.count ?? value.total ?? value.value ?? 0 : value,
    }));
  }

  return Object.entries(payload)
    .filter(([, value]) => typeof value === 'number')
    .map(([label, value]) => ({ label, value }));
};

const getRowLabel = (row, index) => {
  const rawLabel =
    row.label ||
    row.name ||
    row.date ||
    row.month ||
    row.category ||
    row.product ||
    row.status;

  if (rawLabel) {
    return titleize(rawLabel);
  }

  return `Item ${index + 1}`;
};

const getRowValue = (row) => {
  if (typeof row === 'number') {
    return row;
  }

  if (!isPlainObject(row)) {
    return Number(row) || 0;
  }

  return Number(
    row.value ??
      row.count ??
      row.total ??
      row.amount ??
      row.revenue ??
      row.sales ??
      row.quantity ??
      row.stock ??
      0,
  );
};

function AnalyticsBars({ rows }) {
  const normalizedRows = rows
    .map((row, index) => ({
      label: getRowLabel(row, index),
      value: getRowValue(row),
    }))
    .filter((row) => Number.isFinite(row.value))
    .slice(0, 8);

  const max = Math.max(...normalizedRows.map((row) => row.value), 1);

  if (!normalizedRows.length) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-400">
        No chartable analytics returned yet.
      </div>
    );
  }

  return (
    <div className="surface-panel space-y-4 p-5">
      {normalizedRows.map((row) => (
        <div key={row.label} className="grid grid-cols-[minmax(120px,220px)_1fr_70px] items-center gap-4">
          <p className="truncate text-xs font-black uppercase tracking-widest text-slate-500" title={row.label}>
            {row.label}
          </p>
          <div className="h-4 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.max((row.value / max) * 100, 4)}%` }}
            />
          </div>
          <p className="text-right text-xs font-black text-slate-700">{formatMetric(row.value)}</p>
        </div>
      ))}
    </div>
  );
}

function SummaryTable({ data }) {
  const source = data?.summary || data?.metrics || data?.totals || data;
  
  if (!isPlainObject(source)) {
    return (
      <p className="text-xs font-medium text-slate-400 italic">No summary data available for this view.</p>
    );
  }

  const entries = Object.entries(source).filter(([, value]) => 
    typeof value === 'number' || (typeof value === 'string' && value.length < 50)
  );

  if (!entries.length) {
    return (
      <p className="text-xs font-medium text-slate-400 italic">No valid metrics found in the current snapshot.</p>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
              {titleize(key)}
            </span>
          </div>
          <span className="text-sm font-black text-textMain">
            {formatMetric(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function AnalyticsDetail({ label, payload }) {
  const metrics = getMetricCards(payload);
  const rows = getSeriesRows(payload);

  return (
    <div className="space-y-6">
      {metrics.length ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <AdminStatCard
              key={metric.label}
              label={metric.label}
              value={<span className="text-primary">{formatMetric(metric.value)}</span>}
              helper={label}
            />
          ))}
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <BarChart3 size={18} className="text-primary" />
            <div>
              <p className="section-eyebrow">{label}</p>
              <h2 className="section-title">Trend Overview</h2>
            </div>
          </div>
          <AnalyticsBars rows={rows} />
        </div>

        <div>
          <div className="mb-4 min-w-0">
            <p className="section-eyebrow">Data Summary</p>
            <h2 className="section-title">Latest Snapshot</h2>
          </div>
          <div className="surface-panel max-h-[420px] overflow-auto p-6">
            <SummaryTable data={payload} />
          </div>
        </div>
      </section>
    </div>
  );
}

function AdminAnalyticsPage() {
  const [activeKey, setActiveKey] = useState('combined');
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);
    const settled = await Promise.allSettled(DATASETS.map((dataset) => dataset.load()));
    const nextData = {};
    const nextErrors = {};

    settled.forEach((result, index) => {
      const dataset = DATASETS[index];
      if (result.status === 'fulfilled') {
        nextData[dataset.key] = result.value || {};
      } else {
        nextErrors[dataset.key] = getApiErrorMessage(result.reason, `Failed to load ${dataset.label.toLowerCase()} analytics`);
      }
    });

    setData(nextData);
    setErrors(nextErrors);
    setLoading(false);
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const activeDataset = useMemo(
    () => DATASETS.find((dataset) => dataset.key === activeKey) || DATASETS[0],
    [activeKey],
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
          <p className="text-sm font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Decision intelligence"
        title="Analytics Dashboard"
        description="Sales, customer, review, wishlist, and inventory analytics from the backend reporting APIs."
        action={
          <button
            type="button"
            onClick={loadAnalytics}
            className="admin-btn-secondary !min-h-[44px] !px-4 !py-2.5"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        }
      />

      <div className="flex gap-2 overflow-x-auto rounded-[24px] border border-slate-200 bg-white p-2">
        {DATASETS.map((dataset) => {
          const Icon = dataset.icon;
          const isActive = dataset.key === activeKey;
          return (
            <button
              key={dataset.key}
              type="button"
              onClick={() => setActiveKey(dataset.key)}
              className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-[18px] px-4 text-xs font-black uppercase tracking-widest transition-colors ${
                isActive
                  ? 'bg-primary text-textMain'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={15} />
              {dataset.label}
            </button>
          );
        })}
      </div>

      {errors[activeDataset.key] ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700">
          <p className="text-lg font-semibold text-rose-900">Unable to load {activeDataset.label.toLowerCase()} analytics</p>
          <p className="mt-2 text-sm">{errors[activeDataset.key]}</p>
        </div>
      ) : (
        <AnalyticsDetail label={activeDataset.label} payload={data[activeDataset.key]} />
      )}
    </div>
  );
}

export default AdminAnalyticsPage;
