import { useState } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import authService from '@/features/auth/services/authService';
import { adminNavItems } from '../constants/navigation';


function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = authService.getCurrentUser();

  // Safety net: if a non-admin somehow reaches this layout, redirect them
  if (!authService.isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogout = () => {
    authService.logout('/admin');
  };


  return (
    <div className="min-h-screen bg-[#eef2f7] text-slate-900">
      <div className="flex min-h-screen">
        <div
          className={`fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm transition-opacity lg:hidden ${
            sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[286px] flex-col border-r border-white/10 bg-textMain text-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="border-b border-white/10 px-6 py-7">
            <p className="text-[11px] font-black uppercase tracking-[0.34em] text-yellowPrimary">Admin Console</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">Operations Hub</h1>
            <p className="mt-2 text-sm leading-6 text-white/60">Isolated control panel for catalog and request management.</p>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-[20px] px-4 py-3 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-primary text-textMain shadow-[0_12px_24px_rgba(251,198,29,0.2)]'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-white/10 px-6 py-5">
            <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-sm font-semibold text-white">{user?.name || 'Admin User'}</p>
              <p className="mt-1 break-all text-sm text-white/50">{user?.email || 'admin@portal.local'}</p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-x-clip">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen((current) => !current)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 lg:hidden"
                  aria-label="Toggle admin navigation"
                >
                  {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                </button>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Admin</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-900">Separate management experience</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-900 sm:text-sm">{user?.name || 'Admin User'}</p>
                <p className="text-[10px] text-slate-500 sm:text-sm capitalize">{user?.role ?? 'admin'}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="admin-btn-secondary !min-h-[44px] !border-slate-300 !bg-white !px-4 !py-2.5 !text-slate-700 hover:!bg-slate-50"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
