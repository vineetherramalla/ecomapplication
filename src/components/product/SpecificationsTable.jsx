function SpecificationsTable({ specifications = [] }) {
  if (!specifications || specifications.length === 0) {
    return (
      <div className="rounded-[40px] border border-slate-100 bg-slate-50/50 p-12 text-center">
        <p className="text-sm font-semibold text-slate-400">
          Technical specifications are being updated for this catalog entry.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16">
      {specifications.map((section, idx) => (
        <div key={section.category || idx} className="group">
          {/* Section Header */}
          <div className="mb-6 flex items-center gap-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">
              {section.category}
            </h3>
            <div className="h-px flex-1 bg-slate-100" />
          </div>
          
          {/* Specs Grid */}
          <div className="grid gap-x-20 overflow-hidden md:grid-cols-2">
            {section.items.map((item, i) => (
              <div 
                key={`${item.key}-${i}`} 
                className="flex items-baseline justify-between border-b border-slate-50 py-3.5 transition-colors hover:bg-slate-50/50"
              >
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-widest text-textMain">
                  {item.key}
                </span>
                <span className="pl-4 text-right text-[12px] font-black uppercase tracking-tight text-slate-500">
                  {item.value || '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default SpecificationsTable;
