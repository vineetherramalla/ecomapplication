import { Link } from 'react-router-dom';
import authService from '@/features/auth/services/authService';

function AdminUnauthorizedPage() {
  const user = authService.getCurrentUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eef2f7] px-4 py-10">
      <div className="w-full max-w-xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <div className="bg-textMain px-8 py-8 text-white">
          <p className="text-[11px] font-black uppercase tracking-[0.34em] text-yellowPrimary">Restricted</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Unauthorized</h1>
          <p className="mt-3 text-sm text-white/70">
            This admin workspace is available only to users with an admin role from the login API.
          </p>
        </div>

        <div className="space-y-6 px-8 py-8">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">{user?.name || 'Current account'}</p>
            <p className="mt-1 text-sm text-slate-500">{user?.email || 'No active user information'}</p>
            <p className="mt-3 text-sm text-slate-500">
              If you expected admin access, confirm that the backend is returning `role`, `is_staff`, or `is_superuser` for this account.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
            >
              Go to storefront
            </Link>
            {authService.isAuthenticated() ? (
              <button
                type="button"
                onClick={() => authService.logout('/admin')}
                className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-textMain transition-colors hover:opacity-90"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/admin"
                className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-textMain transition-colors hover:opacity-90"
              >
                Return to admin login
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUnauthorizedPage;
