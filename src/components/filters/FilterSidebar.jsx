import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Filter, RotateCcw } from 'lucide-react';

function FilterSection({ title, isOpen, onToggle, activeCount = 0, children }) {
  return (
    <div className="border-b border-greyBorder last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-center justify-between py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-textMain transition-colors group-hover:text-primary group-hover:opacity-90">
            {title}
          </span>
          {activeCount ? (
            <span className="rounded-full bg-primary/12 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-primary">
              {activeCount}
            </span>
          ) : null}
        </div>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-greyLight text-greyMedium transition-colors group-hover:bg-primary group-hover:opacity-90 group-hover:text-textMain">
          {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </span>
      </button>
      {isOpen ? <div className="pb-5">{children}</div> : null}
    </div>
  );
}

function FilterOption({ option, isChecked, onToggle, sectionKey }) {
  const isSubcategory = sectionKey === 'subcategories';
  
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-4 rounded-xl px-2 py-2 transition-colors hover:bg-greyLight/50">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-5 w-5 items-center justify-center border text-[10px] font-black transition-colors ${
            isChecked
              ? 'border-primary bg-primary text-textMain'
              : 'border-greyMedium bg-white text-transparent'
          }`}
        >
          ✓
        </span>
        <input
          type="checkbox"
          checked={isChecked}
          onChange={onToggle}
          className="sr-only"
        />
        <span className={`text-sm ${
          isSubcategory 
            ? `text-black ${isChecked ? 'font-bold' : 'font-medium'}` 
            : `${isChecked ? 'font-bold text-textMain' : 'font-medium text-textSecondary'}`
        }`}>
          {option.label}
        </span>
      </div>
      <span className="text-xs font-bold text-greyMedium">({option.count})</span>
    </label>
  );
}

function FilterSidebar({ sections = [], filters, totalResults = 0, onToggleOption, onReset }) {
  const defaultOpenSections = useMemo(
    () =>
      Object.fromEntries(
        sections.map((section, index) => [section.key, index < 2]),
      ),
    [sections],
  );

  const [openSections, setOpenSections] = useState(defaultOpenSections);

  useEffect(() => {
    setOpenSections((current) => {
      const next = { ...defaultOpenSections };
      Object.keys(current).forEach((key) => {
        if (key in next) {
          next[key] = current[key];
        }
      });
      return next;
    });
  }, [defaultOpenSections]);

  const toggleSection = (sectionKey) => {
    setOpenSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  };

  return (
    <aside className="rounded-2xl border border-greyBorder bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-6 lg:rounded-3xl lg:p-7">
      <div className="mb-5 border-b border-greyBorder pb-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Filter size={16} className="text-primary" />
            <div>
              <h3 className="text-[13px] font-black uppercase tracking-widest text-textMain">Filters</h3>
              <p className="mt-1 text-xs font-semibold text-textSecondary">{totalResults} Total Item(s)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-textSecondary transition-colors hover:text-primary hover:opacity-90"
          >
            <RotateCcw size={13} />
            Clear Filters
          </button>
        </div>
      </div>

      <div className="space-y-0">
        {sections.map((section) => {
          const activeCount = Array.isArray(filters?.[section.key]) ? filters[section.key].length : 0;

          return (
            <FilterSection
              key={section.key}
              title={section.label}
              isOpen={Boolean(openSections[section.key])}
              onToggle={() => toggleSection(section.key)}
              activeCount={activeCount}
            >
              {section.options?.length ? (
                <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
                  {section.options.map((option) => {
                    const selectedValues = filters?.[section.key] || [];
                    const isChecked = selectedValues.includes(option.value);

                    return (
                      <FilterOption
                        key={`${section.key}-${option.value}`}
                        option={option}
                        isChecked={isChecked}
                        onToggle={() => onToggleOption(section.key, option.value)}
                        sectionKey={section.key}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-textSecondary">{section.emptyLabel || 'No options available.'}</p>
              )}
            </FilterSection>
          );
        })}
      </div>
    </aside>
  );
}

export default FilterSidebar;
