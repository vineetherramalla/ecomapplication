function PageLoader({ message = 'Loading page...', minHeight = '50vh', compact = false }) {
  return (
    <div
      className={`container-shell flex items-center justify-center text-center text-slate-500 ${
        compact ? 'py-10' : 'py-16'
      }`}
      style={{ minHeight }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
          {message}
        </p>
      </div>
    </div>
  );
}

export default PageLoader;
