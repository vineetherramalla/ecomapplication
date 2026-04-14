import { NavLink } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ChevronRight,
  Menu,
  Monitor,
  Server,
  Smartphone,
  Tag,
  Trophy,
  X,
  Laptop,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { useCatalog } from '@/features/catalog/hooks/useCatalog';
import { NAVBAR_GROUPS } from '../../utils/constants';
import { slugify } from '../../utils/helpers';
import CategoryDropdown from './category-nav/CategoryDropdown';
import MenuItem from './category-nav/MenuItem';

const DESKTOP_COLUMN_WIDTH = 210;
const DESKTOP_COLUMN_GAP = 40;
const DESKTOP_MENU_SIDE_PADDING = 48;
const DESKTOP_MENU_MIN_WIDTH = 340;
const DESKTOP_MENU_MAX_WIDTH = 1080;

function Box({ size, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  );
}

const getCategoryIcon = (categoryName = '', navbarGroup = '') => {
  const value = `${categoryName} ${navbarGroup}`.toLowerCase();

  if (value.includes('laptop')) {
    return <Laptop size={16} />;
  }

  if (value.includes('mobile') || value.includes('phone')) {
    return <Smartphone size={16} />;
  }

  if (value.includes('monitor')) {
    return <Monitor size={16} />;
  }

  if (value.includes('enterprise') || value.includes('server')) {
    return <Server size={16} />;
  }

  if (value.includes('brand')) {
    return <Tag size={16} />;
  }

  if (value.includes('top')) {
    return <Trophy size={16} />;
  }

  return <Box size={16} />;
};

const extractNestedItems = (item) => item?.children ?? item?.items ?? item?.subcategories ?? [];

const normalizeNestedItems = (category, items = []) =>
  items.map((item) => {
    const nestedItems = extractNestedItems(item);
    const itemName = item.name || item.title || item.label || 'Unnamed item';
    const typoMap = {
      'buisiness': 'Business',
      'buisiness laptops': 'Business Laptops',
    };
    const cleanName = typoMap[itemName.toLowerCase()] || itemName;

    return {
      id: item.id ?? item.pk ?? item.slug ?? itemName,
      name: cleanName,
      path: `/products/${slugify(category.name)}/${slugify(cleanName)}`,
      children: Array.isArray(nestedItems) && nestedItems.length
        ? normalizeNestedItems(category, nestedItems)
        : [],
    };
  });

function CategoryNav() {
  const { categories = [], subcategoriesByCategory = {}, brands = [] } = useCatalog() ?? {};
  const [activeMenu, setActiveMenu] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedMobileGroup, setExpandedMobileGroup] = useState(null);
  const [expandedMobileSections, setExpandedMobileSections] = useState({});
  const [desktopDropdownStyle, setDesktopDropdownStyle] = useState({
    left: 0,
    width: DESKTOP_MENU_MIN_WIDTH,
    pointerLeft: DESKTOP_MENU_MIN_WIDTH / 2,
    columnCount: 1,
  });
  const closeTimerRef = useRef(null);
  const navRootRef = useRef(null);
  const navShellRef = useRef(null);
  const menuTriggerRefs = useRef({});

  const megaMenuContent = useMemo(() => {
    const initialGroups = Object.fromEntries(NAVBAR_GROUPS.map((group) => [group, []]));

    if (Array.isArray(categories)) {
      categories
        .filter((category) => category?.navbar_group && NAVBAR_GROUPS.includes(category.navbar_group))
        .forEach((category) => {
          const subcategories = subcategoriesByCategory[String(category.id)] || [];

          initialGroups[category.navbar_group].push({
            id: category.id,
            title: category.name,
            icon: getCategoryIcon(category.name, category.navbar_group),
            path: `/products/${slugify(category.name)}`,
            items: normalizeNestedItems(category, subcategories),
          });
        });
    }

    // Populate Top Brands if present in NAVBAR_GROUPS
    const safeBrands = Array.isArray(brands) ? brands : [];
    if (initialGroups['Top Brands'] && safeBrands.length > 0) {
      initialGroups['Top Brands'].push({
        id: 'top-brands-col',
        title: 'Global Brands',
        icon: getCategoryIcon('brand', 'Top Brands'),
        path: '/products',
        items: safeBrands.map((brand) => ({
          id: brand.id || brand.name,
          name: brand.name,
          path: `/products?brand=${encodeURIComponent(brand.name || brand.id)}`,
          children: [],
        })),
      });
    }

    return initialGroups;
  }, [categories, subcategoriesByCategory, brands]);

  const menuItems = useMemo(
    () =>
      NAVBAR_GROUPS.map((group) => ({
        name: group,
        hasDropdown: true,
        sections: megaMenuContent[group] || [],
      })),
    [megaMenuContent],
  );

  const activeSections = activeMenu ? megaMenuContent[activeMenu] || [] : [];

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const measureDesktopDropdown = useCallback((menuName) => {
    const rootRect = navRootRef.current?.getBoundingClientRect();
    const shellRect = navShellRef.current?.getBoundingClientRect();
    const triggerRect = menuTriggerRefs.current[menuName]?.getBoundingClientRect();
    const sections = megaMenuContent[menuName] || [];

    if (!rootRect || !shellRect || !triggerRect) {
      return;
    }

    const columnCount = Math.min(Math.max(sections.length || 1, 1), 4);
    const dropdownWidth = Math.min(
      Math.max(
        DESKTOP_MENU_MIN_WIDTH,
        columnCount * DESKTOP_COLUMN_WIDTH +
        Math.max(columnCount - 1, 0) * DESKTOP_COLUMN_GAP +
        DESKTOP_MENU_SIDE_PADDING,
      ),
      DESKTOP_MENU_MAX_WIDTH,
    );

    const shellOffsetLeft = shellRect.left - rootRect.left;
    const shellOffsetRight = shellRect.right - rootRect.left;
    const triggerCenter = triggerRect.left - rootRect.left + triggerRect.width / 2;
    const minLeft = shellOffsetLeft + 118;
    const maxLeft = Math.max(minLeft, shellOffsetRight - dropdownWidth);
    const left = Math.min(Math.max(triggerCenter - dropdownWidth / 2, minLeft), maxLeft);
    const pointerLeft = Math.min(Math.max(triggerCenter - left, 28), dropdownWidth - 28);

    setDesktopDropdownStyle({
      left,
      width: dropdownWidth,
      pointerLeft,
      columnCount,
    });
  }, [megaMenuContent]);

  const openDesktopMenu = (menuName) => {
    clearCloseTimer();
    if (window.innerWidth < 1024 && activeMenu === menuName) {
      setActiveMenu(null);
      return;
    }
    measureDesktopDropdown(menuName);
    setActiveMenu(menuName);
  };

  const scheduleDesktopClose = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setActiveMenu(null);
    }, 110);
  };

  useEffect(
    () => () => {
      clearCloseTimer();
    },
    [],
  );

  useEffect(() => {
    if (!activeMenu) {
      return undefined;
    }

    const handleResize = () => {
      measureDesktopDropdown(activeMenu);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeMenu, measureDesktopDropdown]);

  useEffect(() => {
    if (!isSidebarOpen) {
      document.body.style.overflow = '';
      return undefined;
    }

    const currentOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = currentOverflow;
    };
  }, [isSidebarOpen]);

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setExpandedMobileGroup(null);
    setExpandedMobileSections({});
  };

  const toggleMobileGroup = (groupName) => {
    setExpandedMobileGroup((current) => (current === groupName ? null : groupName));
    setExpandedMobileSections({});
  };

  const toggleMobileSection = (sectionKey) => {
    setExpandedMobileSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  };

  const renderMobileItems = (items, level = 0) => (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id ?? `${item.name}-${level}`} className="space-y-2">
          <NavLink
            to={item.path}
            className={({ isActive }) => `block rounded-sm px-3 py-2 transition-colors ${level === 0
              ? `text-[12px] font-medium ${isActive
                ? 'bg-primary/10 text-primary'
                : 'text-textSecondary hover:bg-greyLight hover:text-textMain'
              }`
              : `text-[11px] font-normal ${isActive
                ? 'bg-primary/10 text-primary'
                : 'text-greyMedium hover:bg-greyLight hover:text-textMain'
              }`
              }`}
            style={level ? { marginLeft: `${level * 12}px` } : undefined}
            onClick={closeSidebar}
          >
            {item.name}
          </NavLink>

          {Array.isArray(item.children) && item.children.length ? renderMobileItems(item.children, level + 1) : null}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div
        ref={navRootRef}
        className="relative z-[60] border-t border-black/5 bg-primary select-none shadow-md"
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleDesktopClose}
      >
        <div ref={navShellRef} className="container-shell flex min-h-[44px] lg:min-h-[52px] items-stretch">
          <div className="flex min-h-[44px] lg:min-h-[52px] w-full items-stretch text-[11px] font-black uppercase tracking-wider text-textMain sm:text-[12px]">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`flex h-[44px] lg:h-[52px] items-center justify-between gap-3 px-4 transition-all outline-none sm:w-[132px] sm:justify-start sm:border-r sm:border-black/5 sm:px-6 ${
                isSidebarOpen ? 'bg-black/10' : 'hover:bg-black/10'
              }`}
            >
              <Menu size={18} />
              <span>Menu</span>
            </button>

            <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto overflow-y-hidden px-2">
              {menuItems.map((item) => (
                <MenuItem
                  key={item.name}
                  label={item.name}
                  active={activeMenu === item.name}
                  buttonRef={(node) => {
                    menuTriggerRefs.current[item.name] = node;
                  }}
                  onOpen={() => openDesktopMenu(item.name)}
                />
              ))}
            </div>
          </div>
        </div>

        {activeMenu ? (
          <CategoryDropdown
            groupLabel={activeMenu}
            sections={activeSections}
            onNavigate={() => setActiveMenu(null)}
            left={desktopDropdownStyle.left}
            width={desktopDropdownStyle.width}
            pointerLeft={desktopDropdownStyle.pointerLeft}
            columnCount={desktopDropdownStyle.columnCount}
          />
        ) : null}
      </div>

      {createPortal(
        <>
          {isSidebarOpen ? (
            <div
              className="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm animate-in fade-in"
              onClick={closeSidebar}
            />
          ) : null}

          <div
            className={`fixed top-0 left-0 z-[9999] flex h-full w-[280px] sm:w-[320px] transform flex-col bg-white text-[10px] font-bold uppercase tracking-widest shadow-2xl transition-transform duration-500 ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between p-6 bg-primary text-textMain h-24 shrink-0 shadow-lg">
              <div className="flex flex-col">
                <span className="text-[10px] opacity-70">Authenticated Access</span>
                <h2 className="text-lg font-black tracking-tighter uppercase leading-none">Global Navigation</h2>
              </div>
              <button onClick={closeSidebar} className="p-2 hover:bg-black/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {menuItems.map((item) => {
                  const isOpen = expandedMobileGroup === item.name;
                  const sections = item.sections;

                  return (
                    <div key={item.name} className="overflow-hidden rounded-sm border border-greyBorder bg-white">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-4 text-left text-textMain transition-colors hover:bg-greyLight/70"
                        onClick={() => toggleMobileGroup(item.name)}
                        aria-expanded={isOpen}
                      >
                        <span>{item.name}</span>
                        <ChevronDown
                          size={16}
                          className={`text-greyMedium transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
                        />
                      </button>

                      {isOpen ? (
                        <div className="space-y-3 border-t border-greyBorder bg-greyLight/60 p-3">
                          {sections.length ? (
                            sections.map((section) => {
                              const sectionKey = `${item.name}-${section.id}`;
                              const sectionOpen = Boolean(expandedMobileSections[sectionKey]);

                              return (
                                <div key={section.id} className="rounded-sm border border-greyBorder bg-white">
                                  <button
                                    type="button"
                                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                                    onClick={() => toggleMobileSection(sectionKey)}
                                    aria-expanded={sectionOpen}
                                  >
                                    <span className="flex items-center">
                                      <span className="text-[12px] font-semibold tracking-wide text-textMain">
                                        {section.title}
                                      </span>
                                    </span>
                                    <ChevronRight
                                      size={16}
                                      className={`text-greyMedium transition-transform duration-200 ${sectionOpen ? 'rotate-90 text-primary' : ''}`}
                                    />
                                  </button>

                                  {sectionOpen ? (
                                    <div className="border-t border-greyBorder px-3 py-3">
                                      {section.items.length ? (
                                        renderMobileItems(section.items)
                                      ) : (
                                        <div className="space-y-3">
                                          <NavLink
                                            to={section.path}
                                            className={({ isActive }) => `block rounded-sm px-3 py-2 text-[12px] font-black uppercase tracking-[0.08em] transition-colors ${isActive
                                              ? 'bg-primary/15 text-primary'
                                              : 'text-textSecondary hover:bg-greyLight hover:text-textMain'
                                              }`}
                                            onClick={closeSidebar}
                                          >
                                            View all {section.title}
                                          </NavLink>
                                          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-greyMedium">
                                            No subcategories available
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })
                          ) : (
                            <div className="rounded-sm border border-dashed border-greyBorder bg-white px-4 py-6 text-center normal-case text-textSecondary">
                              Categories will appear here once this navbar group has catalog data.
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}

              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

export default memo(CategoryNav);
