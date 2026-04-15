import { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import rfqService from '@/features/rfq/services/rfqService';
import authService from '@/features/auth/services/authService';
import rfqIntentService from '@/features/rfq/services/rfqIntentService';
import { getApiErrorMessage, getBrandName, resolveAssetUrl } from '../../api/apiUtils';
import { showToast } from '../../utils/helpers';
import { ProductContext } from '@/store/contexts/productContext';

function RequestPriceModal({ isOpen, onClose, product, quantity }) {
  const navigate = useNavigate();
  const location = useLocation();
  // Use a null-safe context read so the modal works both inside and outside ProductProvider
  const catalogCtx = useContext(ProductContext);
  const brands = catalogCtx?.brands ?? [];
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    email: '',
    quantity: quantity || 1,
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const currentUser = authService.getCurrentUser();
    setFormData({
      name: currentUser?.company_name || currentUser?.name || '',
      contactNumber: currentUser?.phone || '',
      email: currentUser?.email || '',
      quantity: quantity || 1,
      message: '',
    });
  }, [isOpen, quantity]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({
      ...current,
      [name]: name === 'quantity' ? Math.max(1, Number(value || 1)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!authService.isAuthenticated()) {
      rfqIntentService.save({
        productId: product?.id,
        quantity: formData.quantity,
        path: location.pathname,
      });
      onClose();
      showToast({
        title: 'Authentication Required',
        message: 'Please sign in to request pricing.',
        type: 'info',
      });
      navigate('/login', { state: { from: location, openRFQ: true } });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        product,
        quantity: Number(formData.quantity || 1),
      };

      try {
        await rfqService.createRequest(payload);
        
        showToast({
          title: 'Request submitted',
          message: `Inquiry for ${product.name} received. Track it in your dashboard.`,
        });

        handleSuccess();
      } catch (error) {
        const isServerCrash = error?.response?.status === 500;
        
        if (isServerCrash) {
          // PROACTIVE VERIFICATION: Since we know the server sometimes saves but then crashes,
          // we verify if the record was actually created before showing an error.
          try {
            // Wait briefly for DB consistency
            await new Promise(resolve => setTimeout(resolve, 1500));
            const recentRequests = await rfqService.getRequests();
            
            // Check if our request is already there (match by product ID and recent timestamp)
            const matched = recentRequests.slice(0, 3).find(r => 
              String(r.product?.id || r.product) === String(product.id) &&
              (new Date() - new Date(r.createdAt)) < 120000 // Within last 2 mins
            );

            if (matched) {
              showToast({
                title: 'Request received',
                message: 'Your inquiry was successfully recorded despite a server notification delay.',
              });
              handleSuccess();
              return;
            }
          } catch (verifyError) {
            console.error('Verification failed', verifyError);
          }

          throw error; // If not found, fall through to main error handler
        } else {
          throw error;
        }
      }
    } catch (error) {
      showToast({
        title: 'Inquiry failed',
        message: getApiErrorMessage(error, 'Unable to submit request. Please try your dashboard or contact support.'),
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccess = () => {
    setFormData({
      name: '',
      contactNumber: '',
      email: '',
      quantity: quantity || 1,
      message: '',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Request RFQ Quote"
      onClose={onClose}
    >
      <div className="mb-8 rounded-2xl border border-greyBorder bg-slate-50/50 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {product?.images?.[0] && (
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-greyBorder bg-white p-2">
              <img
                src={resolveAssetUrl(product.images[0])}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            </div>
          )}
          <div className="flex-1 space-y-1.5">
            <p className="text-sm font-black uppercase leading-[1.3] tracking-tight text-textMain">
              {product?.name}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-primary" />
                Brand: <span className="text-textMain">{product?.brandName || getBrandName(product?.brand, brands) || 'N/A'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-primary" />
                Availability: <span className="text-textMain">{Number(product?.stock ?? 0) > 0 ? `${product.stock} Units` : 'On Request'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400" htmlFor="name">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-greyBorder bg-white px-4 py-3.5 text-sm font-semibold text-textMain outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
              placeholder="Enter your name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400" htmlFor="contactNumber">
              Contact Number *
            </label>
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              required
              value={formData.contactNumber}
              onChange={handleChange}
              className="w-full rounded-xl border border-greyBorder bg-white px-4 py-3.5 text-sm font-semibold text-textMain outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
              placeholder="Enter phone number"
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400" htmlFor="email">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-greyBorder bg-white px-4 py-3.5 text-sm font-semibold text-textMain outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
              placeholder="name@company.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400" htmlFor="quantity">
              Order Quantity *
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              min="1"
              required
              value={formData.quantity}
              onChange={handleChange}
              className="w-full rounded-xl border border-greyBorder bg-white px-4 py-3.5 text-sm font-semibold text-textMain outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400" htmlFor="message">
            Special Requirements
          </label>
          <textarea
            id="message"
            name="message"
            rows="4"
            value={formData.message}
            onChange={handleChange}
            className="w-full rounded-xl border border-greyBorder bg-white px-4 py-3.5 text-sm font-semibold text-textMain outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 resize-none"
            placeholder="Share any specific delivery, deployment, or technical needs..."
          />
        </div>

        <div className="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-lumio-outline min-h-[52px] w-full px-8 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-lumio min-h-[52px] w-full px-12 sm:w-auto disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : 'Submit RFQ'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default RequestPriceModal;
