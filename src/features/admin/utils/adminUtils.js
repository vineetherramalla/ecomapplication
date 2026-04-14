export const getParentCategoryId = (category) =>
  category?.parent?.id ?? category?.parent_id ?? category?.parent ?? null;

export const isTopLevelCategory = (category) => !getParentCategoryId(category);

export const getTopLevelCategories = (categories = []) =>
  categories.filter((category) => isTopLevelCategory(category));

export const getSubcategories = (categories = [], parentId) =>
  categories.filter((category) => String(getParentCategoryId(category)) === String(parentId));

export const normalizeRequestStatus = (status) =>
  String(status || 'pending')
    .trim()
    .toLowerCase();

export const formatRequestStatus = (status) => {
  const norm = normalizeRequestStatus(status);
  switch (norm) {
    case 'quote_sent':
      return 'Quote Sent';
    case 'pending':
    case 'closed':
      return norm.charAt(0).toUpperCase() + norm.slice(1);
    default:
      return norm;
  }
};

export const getRequestStatusClasses = (status) => {
  const norm = normalizeRequestStatus(status);
  switch (norm) {
    case 'quote_sent':
      return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'closed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    default:
      return 'bg-amber-50 text-amber-700 border-amber-100';
  }
};

export const formatAdminDate = (value) => {
  if (!value) {
    return 'Recently';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};
