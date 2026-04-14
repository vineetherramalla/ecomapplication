import { ChevronDown } from 'lucide-react';

function MenuItem({ label, active, onOpen, buttonRef }) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className={`flex h-full items-center gap-1.5 px-3 md:px-6 text-[10px] md:text-[12px] font-black uppercase tracking-[0.12em] transition-all ${
        active
          ? 'bg-black/10 text-textMain'
          : 'text-textMain hover:bg-black/10'
      }`}
      onMouseEnter={onOpen}
      onFocus={onOpen}
      onClick={onOpen}
      aria-expanded={active}
      aria-haspopup="true"
    >
      <span className="whitespace-nowrap">{label}</span>
      <ChevronDown
        size={12}
        className={`transition-transform duration-200 ${active ? 'rotate-180' : ''}`}
      />
    </button>
  );
}

export default MenuItem;
