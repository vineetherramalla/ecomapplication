import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../../../api/apiUtils';
import rfqService from '@/api/rfqApi';
import { showToast } from '../../../utils/helpers';
import AdminDataTable from '../components/AdminDataTable';
import AdminPageHeader from '../components/AdminPageHeader';
import {
  formatAdminDate,
  formatRequestStatus,
  getRequestStatusClasses,
  normalizeRequestStatus,
} from '../utils/adminUtils';

function AdminRFQPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [localEdits, setLocalEdits] = useState({});
  const [productMap, setProductMap] = useState({});

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const requestList = await rfqService.getRequests();
      const needsProductLookup = requestList.some((request) => {
        const resolvedName =
          request.product?.name ||
          request.productName ||
          request.product_name ||
          request.product_details?.name ||
          '';

        return !resolvedName || resolvedName === 'Requested Product' || resolvedName === 'Custom Request';
      });

      const mapping = {};

      if (needsProductLookup && rfqService.getProducts) {
        const productList = await rfqService.getProducts();
        productList.forEach(p => {
          mapping[String(p.id)] = p.name || p.title;
        });
      }

      setProductMap(mapping);
      setRequests(requestList);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const visibleRequests =
    statusFilter === 'all'
      ? requests
      : requests.filter((request) => {
          const normalized = normalizeRequestStatus(request.status);
          return normalized === statusFilter;
        });

  const handleApply = async (request) => {
    const edit = localEdits[request.id] || {};
    const targetStatus = edit.status || request.status;

    setSaving(true);
    try {
      await rfqService.updateRequest(request.id, { status: targetStatus });
      
      showToast({ title: 'Request updated', message: `Status changed to ${formatRequestStatus(targetStatus)}.` });
      setLocalEdits(prev => {
        const next = { ...prev };
        delete next[request.id];
        return next;
      });
      await loadRequests();
    } catch (err) {
      showToast({
        title: 'Update failed',
        message: getApiErrorMessage(err, 'Request update failed'),
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLocalChange = (id, field, value) => {
    setLocalEdits((prev) => {
      const current = prev[id] || { 
        status: requests.find(r => r.id === id)?.status
      };
      return {
        ...prev,
        [id]: { ...current, [field]: value },
      };
    });
  };

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-slate-500">Loading data...</div>;
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <p className="text-lg font-semibold text-rose-900">Unable to load price requests</p>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="RFQ management"
        title="Price requests"
        description="Review inbound buyer requests and update their processing status directly in the table."
      />

      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'quote_sent', 'closed'].map((status) => {
          const count =
            status === 'all'
              ? requests.length
              : requests.filter((request) => normalizeRequestStatus(request.status) === status).length;
          const isActive = statusFilter === status;
          
          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`inline-flex min-h-[42px] items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                isActive ? 'bg-textMain text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status === 'all' ? 'All' : formatRequestStatus(status)} ({count})
            </button>
          );
        })}
      </div>

      <AdminDataTable
        tableFixed
        columns={[
          {
            key: 'product',
            label: 'Product',
            width: '35%',
            cellClassName: 'min-w-[320px]',
            render: (request) => {
              const productId = request.product?.id || (typeof request.product === 'number' || typeof request.product === 'string' ? request.product : null);
              const mappedName = productId ? productMap[String(productId)] : null;
              const productName = mappedName || 
                (request.product?.name && request.product.name !== 'Requested Product' ? request.product.name : null) || 
                request.productName || 
                request.product_name || 
                'Custom Request';
              
              return (
                <div className="min-w-0 pr-4">
                  <p className="font-semibold text-slate-950 leading-relaxed">{productName}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{formatAdminDate(request.createdAt)}</p>
                </div>
              );
            },
          },
          {
            key: 'customer',
            label: 'Customer',
            width: '20%',
            cellClassName: 'min-w-[180px]',
            render: (request) => (
              <div className="flex flex-col gap-0.5">
                <p className="truncate font-semibold text-slate-950">{request.name}</p>
                <p className="truncate text-xs text-slate-500">{request.email || 'No email'}</p>
                <p className="truncate text-[10px] font-medium text-slate-400">{request.contactNumber || 'No phone'}</p>
              </div>
            ),
          },
          {
            key: 'quantity',
            label: 'QTY',
            width: '10%',
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            render: (request) => (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-[13px] font-black text-slate-900 border border-slate-100">
                {request.quantity}
              </span>
            ),
          },
          {
            key: 'message',
            label: 'Request Notes',
            width: '15%',
            cellClassName: 'min-w-[180px]',
            render: (request) => (
              <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                {request.message || 'No additional requirements'}
              </p>
            ),
          },
          {
            key: 'status',
            label: 'Action',
            width: '20%',
            cellClassName: 'min-w-[200px]',
            render: (request) => {
              const edit = localEdits[request.id] || {};
              const currentStatus = normalizeRequestStatus(edit.status || request.status);
              
              return (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={currentStatus}
                      onChange={(e) => handleLocalChange(request.id, 'status', e.target.value)}
                      className="admin-control min-h-[36px] flex-1 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold focus:border-primary"
                    >
                      <option value="pending">Pending</option>
                      <option value="quote_sent">Quote Sent</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleApply(request)}
                      disabled={saving}
                      className="admin-btn-primary !min-h-[36px] !rounded-xl !px-3 !py-1.5 text-[10px] !font-black !uppercase !tracking-wider"
                    >
                      Update
                    </button>
                  </div>
                  
                  <span className={`inline-flex self-start rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${getRequestStatusClasses(request.status)}`}>
                    Status: {formatRequestStatus(request.status)}
                  </span>
                </div>
              );
            },
          },
        ]}
        rows={visibleRequests}
        emptyText="No price requests match the current filter."
        minWidthClassName="min-w-[1100px]"
      />
    </div>
  );
}

export default AdminRFQPage;
