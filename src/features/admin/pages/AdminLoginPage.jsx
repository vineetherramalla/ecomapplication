import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '@/features/auth/services/authService';
import { getNormalizedApiError } from '../../../api/errorHandler';
import { showToast } from '../../../utils/helpers';
import { isAdminUser } from '@/features/auth/utils/access';

function AdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));

    if (error) {
      setError('');
    }

    if (errorType) {
      setErrorType('');
    }

    setFieldErrors((current) => ({
      ...current,
      [name]: '',
      ...(name === 'username' ? { email: '' } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setErrorType('');
    setFieldErrors({});

    try {
      const credentials = {
        username: form.username,
        email: form.username.includes('@') ? form.username : undefined,
        password: form.password,
      };

      const { user: loggedInUser } = await authService.login(credentials);
      let user = loggedInUser;

      if (!isAdminUser(user)) {
        user = await authService.verifyAdminAccess();
      }

      if (!isAdminUser(user)) {
        authService.clearSession();
        setError('Unauthorized: this account does not have admin access.');
        setErrorType('auth');
        showToast({
          title: 'Unauthorized',
          message: 'Only admin users can access the admin console.',
          type: 'error',
        });
        return;
      }

      showToast({
        title: 'Admin login successful',
        message: `Welcome back, ${user.name || 'Admin'}.`,
      });
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      const normalizedError = getNormalizedApiError(err, {
        fallbackMessage: 'Unable to sign in',
      });

      const nextFieldErrors = {};
      const usernameError = normalizedError.fieldErrors.username || normalizedError.fieldErrors.email;

      if (usernameError) {
        nextFieldErrors.username = usernameError;
      }

      if (normalizedError.fieldErrors.password) {
        nextFieldErrors.password = normalizedError.fieldErrors.password;
      }

      setFieldErrors(nextFieldErrors);
      setErrorType(normalizedError.type);
      setError(normalizedError.message);

      if (normalizedError.type === 'server') {
        showToast({ title: 'Login failed', message: normalizedError.message, type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const highlightCredentials = Boolean(error) && errorType === 'auth';

  return (
    <div className="min-h-screen bg-[#0f172a] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(251,198,29,0.28),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.01))] p-8 sm:p-12">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[linear-gradient(180deg,rgba(251,198,29,0.14),transparent)] lg:block" />
          <div className="relative max-w-2xl space-y-8">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.36em] text-primary">Separate Admin UI</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Operations dashboard for catalog and RFQ control.
              </h1>
              <p className="mt-4 max-w-xl text-base text-white/70">
                This isolated `/admin` experience uses the same backend APIs and auth client while keeping customer flows untouched.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Products</p>
                <p className="mt-3 text-sm text-white/70">Create, edit, delete, and upload visuals through the live catalog APIs.</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Taxonomy</p>
                <p className="mt-3 text-sm text-white/70">Manage categories and subcategories without touching storefront routing.</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">RFQs</p>
                <p className="mt-3 text-sm text-white/70">Review inquiries, send quotes, and reject requests from one workspace.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-[36px] border border-white/10 bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.45)] sm:p-10">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.34em] text-slate-400">Admin Access</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Sign in</h2>
              <p className="mt-3 text-sm text-slate-500">
                Access is granted when the login response identifies the account as admin, staff, or superuser.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Email or username</span>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  autoComplete="username"
                  aria-invalid={highlightCredentials || Boolean(fieldErrors.username)}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-700 outline-none transition-colors ${
                    highlightCredentials || fieldErrors.username
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-200 focus:border-yellowPrimary'
                  }`}
                  required
                />
                {fieldErrors.username ? <p className="text-sm text-rose-600">{fieldErrors.username}</p> : null}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Password</span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={highlightCredentials || Boolean(fieldErrors.password)}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-700 outline-none transition-colors ${
                    highlightCredentials || fieldErrors.password
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-200 focus:border-yellowPrimary'
                  }`}
                  required
                />
                {fieldErrors.password ? <p className="text-sm text-rose-600">{fieldErrors.password}</p> : null}
              </label>

              {error ? (
                <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-textMain transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Signing in...' : 'Enter admin console'}
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <Link to="/login" className="font-semibold text-slate-700 transition-colors hover:text-slate-950">
                Customer login
              </Link>
              <Link to="/" className="font-semibold text-slate-700 transition-colors hover:text-slate-950">
                Back to storefront
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminLoginPage;
