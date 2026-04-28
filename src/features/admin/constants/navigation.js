import {
  Boxes,
  BarChart3,
  FolderTree,
  LayoutDashboard,
  Network,
  Package,
  ReceiptText,
} from 'lucide-react';

export const adminNavItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Products', path: '/admin/products', icon: Boxes },
  { label: 'Inventory', path: '/admin/inventory', icon: Package },
  { label: 'Categories', path: '/admin/categories', icon: FolderTree },
  { label: 'Subcategories', path: '/admin/subcategories', icon: Network },
  { label: 'Price Requests', path: '/admin/rfq', icon: ReceiptText },
];
