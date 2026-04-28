import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useProducts } from '@/features/catalog/hooks/useProducts';
import enquiryService from '@/api/enquiryApi';
import { showToast } from '../../utils/helpers';
import { getApiErrorMessage } from '../../api/apiUtils';

const initialFormState = {
  name: '',
  company_name: '',
  company_address: '',
  product: '',
  quantity: 1,
  phone: '',
  email: '',
  description: '',
};

function FloatingEnquiry() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  const { products = [] } = useProducts() ?? {};
  const params = useParams();
  const location = useLocation();

  // Auto-fill product if on product page
  useEffect(() => {
    if (isOpen && products.length > 0) {
      const isProductPage = location.pathname.startsWith('/product/');
      if (isProductPage && params.id) {
        const foundProduct = products.find(p => String(p.id) === String(params.id));
        if (foundProduct) {
          setFormData(prev => ({ ...prev, product: foundProduct.name }));
        }
      }
    }
  }, [isOpen, location.pathname, params.id, products]);

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.company_name.trim()) errors.company_name = 'Company name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone Number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      errors.phone = 'Invalid phone number';
    }
    if (!formData.product) errors.product = 'Please select a product';
    if (formData.quantity < 1) errors.quantity = 'Quantity must be at least 1';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Find the product ID if name matches exactly
      const matchedProduct = products.find(
        (p) => (p.name || '').toLowerCase() === (formData.product || '').toLowerCase()
      );
      
      const submissionData = {
        ...formData,
        product: matchedProduct ? matchedProduct.id : null,
        product_name: !matchedProduct ? formData.product : null,
        quantity: parseInt(formData.quantity) || 1,
      };

      await enquiryService.submitEnquiry(submissionData);
      setIsSuccess(true);
      showToast({ title: 'Enquiry Sent', message: 'Our team will contact you shortly.' });
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to submit enquiry');
      setSubmitError(message);
      showToast({ title: 'Error', message, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsSuccess(false);
    setFormData(initialFormState);
    setFieldErrors({});
    setSubmitError(null);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-textMain text-primary shadow-2xl transition-all hover:scale-110 hover:shadow-primary/20 active:scale-95 sm:h-16 sm:w-16"
        aria-label="Enquiry Form"
      >
        <MessageCircle size={28} className="sm:size-[32px]" />
        <span className="absolute -top-1 -right-1 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-primary text-[10px] font-bold text-textMain shadow-sm">
          !
        </span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-[32px] bg-white shadow-2xl animate-in zoom-in-95 duration-300"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="bg-textMain p-6 text-white sm:p-8">
              <button
                onClick={handleClose}
                className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-black uppercase tracking-tight text-primary">Enquiry</h2>
              <p className="mt-2 text-sm text-slate-400">Request custom pricing and procurement support.</p>
            </div>

            {/* Form */}
            <div className="max-h-[70vh] overflow-y-auto p-6 transition-all sm:p-8">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-6 rounded-full bg-green-50 p-4 text-green-500">
                    <CheckCircle2 size={64} />
                  </div>
                  <h3 className="text-xl font-bold text-textMain">Submission Successful</h3>
                  <p className="mt-2 text-slate-500">Thank you for your interest. Our representative will contact you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {submitError && (
                    <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                        <X size={16} strokeWidth={3} />
                      </div>
                      <p className="text-[11px] font-bold text-rose-800 uppercase leading-snug">{submitError}</p>
                    </div>
                  )}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Full Name <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full rounded-xl border-2 bg-slate-50 px-4 py-3 text-sm font-semibold transition-all focus:bg-white focus:outline-none ${fieldErrors.name ? 'border-rose-200' : 'border-slate-100 focus:border-primary/40'}`}
                        placeholder="John Doe"
                      />
                      {fieldErrors.name && <p className="text-[10px] font-bold text-rose-500 uppercase">{fieldErrors.name}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Company Name <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        className={`w-full rounded-xl border-2 bg-slate-50 px-4 py-3 text-sm font-semibold transition-all focus:bg-white focus:outline-none ${fieldErrors.company_name ? 'border-rose-200' : 'border-slate-100 focus:border-primary/40'}`}
                        placeholder="ABC Industries"
                      />
                      {fieldErrors.company_name && <p className="text-[10px] font-bold text-rose-500 uppercase">{fieldErrors.company_name}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Company Address</label>
                    <input
                      type="text"
                      name="company_address"
                      value={formData.company_address}
                      onChange={handleChange}
                      className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold transition-all focus:bg-white focus:border-primary/40 focus:outline-none"
                      placeholder="City, State, Country"
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Interested Product <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        name="product"
                        value={formData.product}
                        onChange={handleChange}
                        className={`w-full rounded-xl border-2 bg-slate-50 px-4 py-3 text-sm font-semibold transition-all focus:bg-white focus:outline-none ${fieldErrors.product ? 'border-rose-200' : 'border-slate-100 focus:border-primary/40'}`}
                        placeholder="e.g. Dell Latitude 3440"
                      />
                      {fieldErrors.product && <p className="text-[10px] font-bold text-rose-500 uppercase">{fieldErrors.product}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Quantity <span className="text-rose-500">*</span></label>
                      <input
                        type="number"
                        name="quantity"
                        min="1"
                        value={formData.quantity}
                        onChange={handleChange}
                        className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold transition-all focus:bg-white focus:border-primary/40 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Phone Number <span className="text-rose-500">*</span></label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`w-full rounded-xl border-2 bg-slate-50 px-4 py-3 text-sm font-semibold transition-all focus:bg-white focus:outline-none ${fieldErrors.phone ? 'border-rose-200' : 'border-slate-100 focus:border-primary/40'}`}
                        placeholder="+91 98765 43210"
                      />
                      {fieldErrors.phone && <p className="text-[10px] font-bold text-rose-500 uppercase">{fieldErrors.phone}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Email Address <span className="text-rose-500">*</span></label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full rounded-xl border-2 bg-slate-50 px-4 py-3 text-sm font-semibold transition-all focus:bg-white focus:outline-none ${fieldErrors.email ? 'border-rose-200' : 'border-slate-100 focus:border-primary/40'}`}
                        placeholder="name@company.com"
                      />
                      {fieldErrors.email && <p className="text-[10px] font-bold text-rose-500 uppercase">{fieldErrors.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Requirements / Description</label>
                    <textarea
                      name="description"
                      rows="4"
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold transition-all focus:bg-white focus:border-primary/40 focus:outline-none resize-none"
                      placeholder="Quantities, delivery timeline, or technical specs needed."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full min-h-[56px] items-center justify-center gap-3 rounded-2xl bg-textMain text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-black hover:shadow-2xl hover:shadow-textMain/20 active:scale-[0.98] disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Sending Enquiry...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} className="text-primary" />
                        <span>Submit Enquiry</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FloatingEnquiry;
