import MegaMenuColumn from './MegaMenuColumn';

function CategoryDropdown({
  groupLabel,
  sections,
  onNavigate,
  left = 0,
  width = 420,
  pointerLeft = 120,
  columnCount = 1,
}) {
  const hasSections = Array.isArray(sections) && sections.length > 0;

  return (
    <div
      className="absolute top-full left-0 z-[120] w-full lg:left-auto lg:w-auto"
      style={{ left: typeof window !== 'undefined' && window.innerWidth >= 1024 ? left : 0, width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? width : '100vw' }}
    >
      <span
        className="absolute -top-2.5 h-5 w-5 -translate-x-1/2 rotate-45 border-l border-t border-greyBorder bg-white hidden lg:block"
        style={{ left: pointerLeft }}
      />

      <div className="rounded-b-sm border border-greyBorder bg-white shadow-[0_28px_54px_rgba(57,52,40,0.16)]">
        <div className="max-h-[min(70vh,620px)] overflow-y-auto px-6 py-7">
          {hasSections ? (
            <div
              className="grid content-start gap-x-10 gap-y-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-none"
              style={{ gridTemplateColumns: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `repeat(${columnCount}, minmax(0, 1fr))` : undefined }}
            >
              {sections.map((section) => (
                <MegaMenuColumn key={section.id} section={section} onNavigate={onNavigate} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[220px] items-center justify-center border border-dashed border-greyBorder bg-greyLight/60 px-8 text-center">
              <div className="max-w-lg space-y-3">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">
                  {groupLabel}
                </p>
                <h5 className="text-xl font-black uppercase tracking-[0.08em] text-textMain">
                  Categories will appear here
                </h5>
                <p className="text-sm text-textSecondary">
                  Add categories and nested subcategories in admin to populate this mega menu section.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CategoryDropdown;
