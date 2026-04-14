import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Error 404</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Page not found</h1>
        <p className="mx-auto max-w-md text-slate-600">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Check the URL or return to our catalog.
        </p>
        <div className="pt-6">
          <Link
            to="/products"
            className="inline-flex rounded-full bg-slate-950 px-8 py-4 text-sm font-semibold text-white transition hover:bg-primary hover:text-textMain hover:opacity-90"
          >
            Back to Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
