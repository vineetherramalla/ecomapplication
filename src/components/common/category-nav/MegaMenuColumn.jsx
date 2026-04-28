import { NavLink } from 'react-router-dom';

function NestedMenuItems({ items, onNavigate, level = 0 }) {
  return (
    <ul className={level === 0 ? 'space-y-3.5' : 'space-y-2.5'}>
      {items.map((item) => (
        <li key={item.id ?? `${item.name}-${level}`} className="space-y-2">
          <NavLink
            to={item.path}
            end
            className={({ isActive }) => `block transition-colors ${
              level === 0
                ? `text-[14px] font-medium ${
                    isActive ? 'text-primary' : 'text-textMain hover:text-primary'
                  }`
                : `text-[12px] font-normal ${
                    isActive ? 'text-primary' : 'text-textMain hover:text-primary'
                  }`
            }`}
            onClick={onNavigate}
            style={level ? { paddingLeft: `${level * 12}px` } : undefined}
          >
            {item.name}
          </NavLink>

          {Array.isArray(item.children) && item.children.length ? (
            <NestedMenuItems items={item.children} onNavigate={onNavigate} level={level + 1} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function MegaMenuColumn({ section, onNavigate }) {
  const hasItems = Array.isArray(section.items) && section.items.length > 0;

  return (
    <div className="min-w-0">
      <div className="mb-6 flex items-center gap-3 border-b border-greyBorder pb-4">
        <NavLink
          to={section.path}
          end
          className={({ isActive }) => `text-[15px] font-semibold tracking-wide transition-colors ${
            isActive ? 'text-primary' : 'text-textMain hover:text-primary hover:opacity-90'
          }`}
          onClick={onNavigate}
        >
          {section.title}
        </NavLink>
      </div>

      {hasItems ? (
        <NestedMenuItems items={section.items} onNavigate={onNavigate} />
      ) : (
        <div className="space-y-3">
          <NavLink
            to={section.path}
            end
            className={({ isActive }) => `block text-[12px] font-medium transition-colors ${
              isActive ? 'text-primary' : 'text-textMain hover:text-primary'
            }`}
            onClick={onNavigate}
          >
            View all {section.title}
          </NavLink>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-greyMedium">
            No subcategories available
          </p>
        </div>
      )}
    </div>
  );
}

export default MegaMenuColumn;
