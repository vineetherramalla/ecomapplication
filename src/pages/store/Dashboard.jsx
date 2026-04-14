import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Package,
  RefreshCcw,
  XCircle,
} from 'lucide-react';
import authService from '@/features/auth/services/authService';
import rfqService from '@/features/rfq/services/rfqService';
import { getApiErrorMessage } from '../../api/apiUtils';
import { formatCurrency } from '../../utils/helpers';

const formatRequestDate = (value) => {
  if (!value) {
    return 'Recently';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Recently';
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate);
};

const normalizeRequestStatus = (status) => {
  const normalizedStatus = String(status || 'pending')
    .trim()
    .toLowerCase();

  if (normalizedStatus === 'quote_sent') {
    return 'quoted';
  }

  if (normalizedStatus === 'closed') {
    return 'closed';
  }

  return normalizedStatus;
};

const formatRequestStatus = (status) => {
  const normalizedStatus = normalizeRequestStatus(status);

  if (normalizedStatus === 'quoted') {
    return 'Quoted';
  }

  if (normalizedStatus === 'closed') {
    return 'Closed';
  }

  return 'Pending';
};

function CustomerDashboard() {
  const user = authService.getCurrentUser();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userKey = user?.id ?? user?.sub ?? user?.username ?? user?.email ?? authService.getToken() ?? '';

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await rfqService.getRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load your RFQ requests right now.'));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userKey) {
      setLoading(false);
      return;
    }

    loadRequests();
  }, [loadRequests, userKey]);

  const sortedRequests = useMemo(
    () =>
      [...requests].sort((first, second) => {
        const firstDate = new Date(first.createdAt || 0).getTime();
        const secondDate = new Date(second.createdAt || 0).getTime();
        return secondDate - firstDate;
      }),
    [requests],
  );

  const stats = useMemo(() => {
    const pending = sortedRequests.filter((request) => normalizeRequestStatus(request.status) === 'pending').length;
    const quoted = sortedRequests.filter((request) => normalizeRequestStatus(request.status) === 'quoted').length;
    const closed = sortedRequests.filter((request) => normalizeRequestStatus(request.status) === 'closed').length;
    const latestQuoted = sortedRequests.find((request) => normalizeRequestStatus(request.status) === 'quoted');

    return {
      pending,
      quoted,
      closed,
      latestQuoted,
    };
  }, [sortedRequests]);

  const getStatusColor = (status) => {
    switch (normalizeRequestStatus(status)) {
      case 'quoted':
        return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      case 'closed':
        return 'text-rose-700 bg-rose-50 border-rose-100';
      case 'pending':
        return 'text-amber-700 bg-amber-50 border-amber-100';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (normalizeRequestStatus(status)) {
      case 'quoted':
        return <CheckCircle size={14} />;
      case 'closed':
        return <XCircle size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const statCards = [
    {
      label: 'Total RFQs',
      value: sortedRequests.length,
      helper: 'All procurement requests submitted from your account.',
      valueClassName: 'text-slate-950',
    },
    {
      label: 'Pending',
      value: stats.pending,
      helper: 'Requests waiting for your account manager to respond.',
      valueClassName: 'text-amber-600',
    },
    {
      label: 'Quoted',
      value: stats.quoted,
      helper: 'Pricing becomes visible here only after a quote is issued.',
      valueClassName: 'text-emerald-600',
    },
    {
      label: 'Closed',
      value: stats.closed,
      helper: 'Requests that were closed after review by the account team.',
      valueClassName: 'text-rose-600',
    },
  ];

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-7xl space-y-8 sm:space-y-10">
        <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="section-eyebrow">Customer dashboard</p>
            <h1 className="mt-2 text-balance text-3xl font-black uppercase tracking-tighter text-slate-900 sm:text-4xl">
              Procurement RFQs
            </h1>
            <p className="section-description text-pretty font-medium">
              Track quote requests, review statuses, and view pricing once an RFQ has been quoted.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap xl:w-auto xl:justify-end">
            <Link
              to="/products"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-textMain px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-black"
            >
              Browse Catalog
              <ArrowRight size={14} className="text-primary" />
            </Link>
            <button
              type="button"
              onClick={loadRequests}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 transition-colors hover:border-primary hover:bg-primary/10"
            >
              <RefreshCcw size={14} />
              Refresh
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <article key={card.label} className="metric-card">
              <p className="metric-card-label">{card.label}</p>
              <p className={`metric-card-value ${card.valueClassName}`}>{card.value}</p>
              <p className="metric-card-helper">{card.helper}</p>
            </article>
          ))}
        </section>

        {error ? (
          <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 text-rose-700 sm:p-6">
            <p className="font-semibold text-rose-900">Unable to load requests</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : null}

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)] xl:gap-8">
          <section className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="section-eyebrow">Activity</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">RFQ timeline</h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                {sortedRequests.length} Request{sortedRequests.length === 1 ? '' : 's'}
              </span>
            </div>

            {loading ? (
              <div className="section-panel py-16 text-center sm:py-20">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fetching inquiries...</p>
              </div>
            ) : sortedRequests.length ? (
              <div className="space-y-4">
                {sortedRequests.map((rfq) => (
                  <article key={rfq.id} className="section-panel transition-colors hover:border-primary/40">
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                            <Package size={24} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                              <h3 className="break-words text-base font-semibold tracking-tight text-slate-900">
                                {rfq.product?.name || 'Custom sourcing requested'}
                              </h3>
                              {rfq.product?.id ? (
                                <Link
                                  to={`/product/${rfq.product.id}`}
                                  className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:underline hover:opacity-90"
                                >
                                  View product
                                </Link>
                              ) : null}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                              <span>Qty: {rfq.quantity}</span>
                              <span className="hidden sm:inline w-1 h-1 bg-slate-200 rounded-full" />
                              <span>Ref: #{String(rfq.id).padStart(5, '0')}</span>
                              <span className="hidden sm:inline w-1 h-1 bg-slate-200 rounded-full" />
                              <span>{formatRequestDate(rfq.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] ${getStatusColor(rfq.status)}`}>
                          {getStatusIcon(rfq.status)}
                          <span>{formatRequestStatus(rfq.status)}</span>
                        </div>
                      </div>

                      {rfq.message ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Message</p>
                          <p className="break-words text-sm leading-relaxed text-slate-600">{rfq.message}</p>
                        </div>
                      ) : null}

                      {normalizeRequestStatus(rfq.status) === 'quoted' && rfq.quotedPrice ? (
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">Quoted price</p>
                          <p className="text-2xl font-black text-emerald-700">{formatCurrency(rfq.quotedPrice)}</p>
                          <p className="mt-2 text-sm text-emerald-800/80">Pricing is visible only because this RFQ has been quoted.</p>
                        </div>
                      ) : null}

                      {normalizeRequestStatus(rfq.status) === 'closed' ? (
                        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                          <p className="text-sm text-rose-700">This request was closed. Please contact support or submit a new RFQ with updated requirements.</p>
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="section-panel py-14 text-center sm:py-16">
                <Package size={40} className="mx-auto text-slate-200 mb-4" />
                <h3 className="font-bold text-slate-500 uppercase tracking-widest text-sm mb-2">No RFQs submitted yet</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Browse the catalog, open a product, and use Request Price to begin your procurement workflow.
                </p>
                <Link
                  to="/products"
                  className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-textMain transition-colors hover:opacity-90"
                >
                  Explore products
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </section>

          <aside className="space-y-6 xl:sticky xl:top-32">
            <div className="surface-panel-dark relative overflow-hidden p-6 sm:p-7">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary rotate-45 translate-x-16 -translate-y-16 opacity-20" />
              <div className="relative z-10">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Account summary</p>
                <div className="mt-5 space-y-0 divide-y divide-white/10">
                  <div className="flex items-start justify-between gap-4 py-3 first:pt-0">
                  <span className="text-[11px] font-medium text-white/60 uppercase">Partner</span>
                    <span className="max-w-[60%] break-words text-right text-sm font-bold text-white">{user?.name || 'Customer'}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 py-3">
                  <span className="text-[11px] font-medium text-white/60 uppercase">Email</span>
                    <span className="max-w-[60%] break-all text-right text-sm font-bold text-white">{user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 py-3">
                  <span className="text-[11px] font-medium text-white/60 uppercase">Contact</span>
                    <span className="max-w-[60%] break-words text-right text-sm font-bold text-white">{user?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 py-3 last:pb-0">
                  <span className="text-[11px] font-medium text-white/60 uppercase">Access</span>
                    <span className="text-right text-xs font-black uppercase tracking-[0.2em] text-primary">Verified partner</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="section-panel-muted">
              <p className="section-eyebrow">Latest quote</p>
              <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">Most recent pricing update</h3>
              {stats.latestQuoted ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-semibold text-slate-900">{stats.latestQuoted.product?.name || 'Quoted RFQ'}</p>
                  <p className="text-2xl font-black text-emerald-600">{formatCurrency(stats.latestQuoted.quotedPrice)}</p>
                  <p className="text-sm text-slate-500">Quoted on {formatRequestDate(stats.latestQuoted.createdAt)}.</p>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-slate-500">No quoted RFQs yet. Pricing will appear here once one of your requests is quoted.</p>
              )}
            </div>

            <div className="section-panel">
              <p className="section-eyebrow">Procurement flow</p>
              <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">How the B2B process works</h3>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-500">
                <p>1. Browse products and specifications without public pricing.</p>
                <p>2. Submit an RFQ with quantity and deployment requirements.</p>
                <p>3. Track status here until the request is quoted or closed.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;
