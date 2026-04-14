function AdminPageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? (
          <p className="section-eyebrow">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {title}
        </h1>
        {description ? <p className="section-description text-pretty">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0 max-sm:w-full">{action}</div> : null}
    </div>
  );
}

export default AdminPageHeader;
