const joinPath = (...parts) =>
  `/${parts
    .filter((part) => part !== null && part !== undefined && part !== '')
    .map((part) => String(part).replace(/^\/+|\/+$/g, ''))
    .join('/')}/`;

export const API_MODULE_ROOTS = [
  '/accounts/',
  '/products/',
  '/inventory/',
  '/orders/',
  '/reviews/',
  '/wishlist/',
  '/analytics/',
  '/search/',
  '/media/',
];

export const API_PROXY_ROOTS = ['/api/', '/media/'];

export const API_ENDPOINTS = {
  auth: {
    register: '/accounts/register/',
    verifyOtp: '/accounts/verify-otp/',
    resendOtp: '/accounts/resend-otp/',
    login: '/accounts/login/',
    logout: '/accounts/logout/',
    resetPassword: '/accounts/reset-password/',
    confirmPassword: '/accounts/confirm-password/',
    token: '/accounts/token/',
    refresh: '/accounts/token/refresh/',
  },
  products: {
    categories: '/products/categories/',
    category: (id) => joinPath('products', 'categories', id),
    subcategories: (categoryId) => joinPath('products', 'categories', categoryId, 'subcategories'),
    brands: '/products/brands/',
    brand: (id) => joinPath('products', 'brands', id),
    products: '/products/products/',
    product: (id) => joinPath('products', 'products', id),
    search: '/products/products/search/',
    similar: (productId) => joinPath('products', 'products', productId, 'similar'),
    images: '/products/images/',
    image: (id) => joinPath('products', 'images', id),
    specifications: '/products/specifications/',
    specification: (id) => joinPath('products', 'specifications', id),
  },
  inventory: {
    items: '/inventory/inventory/',
    item: (id) => joinPath('inventory', 'inventory', id),
  },
  orders: {
    requests: '/orders/requests/',
    request: (id) => joinPath('orders', 'requests', id),
    enquiries: '/orders/enquiries/',
  },
  reviews: {
    reviews: '/reviews/reviews/',
    productReviews: (productId) => joinPath('reviews', 'reviews', productId),
    detail: (reviewId) => joinPath('reviews', 'reviews', 'detail', reviewId),
  },
  wishlist: {
    wishlist: '/wishlist/wishlist/',
  },
  analytics: {
    dashboard: '/analytics/dashboard/',
    sales: '/analytics/analytics/sales/',
    customers: '/analytics/analytics/customers/',
    reviews: '/analytics/analytics/reviews/',
    wishlists: '/analytics/analytics/wishlists/',
    inventory: '/analytics/analytics/inventory/',
    comprehensive: '/analytics/analytics/comprehensive/',
  },
  search: {
    search: '/search/search/',
    autocomplete: '/search/search/autocomplete/',
    facets: '/search/search/facets/',
  },
};

export default API_ENDPOINTS;
