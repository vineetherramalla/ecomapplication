function AdminModal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = 'lg',
}) {
  if (!open) {
    return null;
  }

  const sizeClasses = {
    md: 'max-w-xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm">
      <div
        className={`relative flex max-h-full w-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl ${sizeClasses[size] || sizeClasses.lg}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            aria-label="Close modal"
          >
            x
          </button>
          <p className="section-eyebrow">
            Admin Workspace
          </p>
          <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
          ) : null}
        </div>

        <div className="overflow-y-auto px-6 py-6 sm:px-8">{children}</div>

        {footer ? (
          <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:px-8">{footer}</div>
        ) : null}
      </div>
      <button type="button" className="absolute inset-0 -z-10 cursor-default" onClick={onClose} aria-hidden="true" />
    </div>
  );
}

export default AdminModal;
