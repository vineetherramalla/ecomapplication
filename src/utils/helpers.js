// ...existing code...

export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const formatNumber = (value) =>
  new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const slugify = (value) =>
  value
    ?.toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || '';

export const getRatingLabel = (rating) => {
  if (rating >= 4.8) return 'Excellent';
  if (rating >= 4.4) return 'Top rated';
  if (rating >= 4) return 'Trusted';
  return 'Good';
};

export const showToast = ({ title, message, type = 'success' }) => {
  window.dispatchEvent(
    new CustomEvent('app-toast', {
      detail: {
        id: Date.now(),
        title,
        message,
        type,
      },
    }),
  );
};
