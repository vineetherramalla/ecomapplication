import { useEffect, useState } from 'react';
import AdminModal from './AdminModal';

function QuoteRequestModal({ open, request, submitting, onClose, onSubmit }) {
  const [quoteAmount, setQuoteAmount] = useState('');

  useEffect(() => {
    if (open) {
      setQuoteAmount(request?.quotedPrice || request?.quoted_price || '');
    }
  }, [open, request]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!quoteAmount) {
      return;
    }

    onSubmit(Number(quoteAmount));
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Send quote"
      description="Set the quote amount for this request. The update is sent through the existing request API."
      size="md"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="admin-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="admin-quote-form"
            disabled={submitting || !quoteAmount}
            className="admin-btn-primary"
          >
            {submitting ? 'Saving...' : 'Send quote'}
          </button>
        </div>
      }
    >
      <form id="admin-quote-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="section-panel-muted !rounded-[24px] !p-4">
          <p className="text-sm font-semibold text-slate-950">{request?.product?.name || 'Custom request'}</p>
          <p className="mt-2 text-sm text-slate-500">
            {request?.name} · Qty {request?.quantity || 1}
          </p>
          <p className="mt-1 text-sm text-slate-500">{request?.contactNumber || request?.email || 'No contact details'}</p>
        </div>

        <div className="field-stack">
          <label className="text-sm font-semibold text-slate-700" htmlFor="admin-quote-value">
            Quote amount
          </label>
          <input
            id="admin-quote-value"
            type="number"
            min="0"
            step="1"
            value={quoteAmount}
            onChange={(event) => setQuoteAmount(event.target.value)}
            placeholder="Enter quotation amount"
            className="admin-control"
            required
          />
        </div>
      </form>
    </AdminModal>
  );
}

export default QuoteRequestModal;
