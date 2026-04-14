import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Home, ChevronRight, LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
import ProductGrid from '../../components/product/ProductGrid';
import FilterSidebar from '../../components/filters/FilterSidebar';
import Pagination from '../../components/filters/Pagination';
import ProductDetails from './ProductDetails';
import { useProducts } from '@/features/catalog/hooks/useProducts';
import { getBrandName, getCategoryName, getSubcategoryName } from '../../api/apiUtils';
import { DEFAULT_FILTERS } from '../../utils/constants';
import { slugify } from '../../utils/helpers';
import { normalizeSpecificationKey } from '../../utils/specifications';

const PRODUCTS_PER_PAGE = 12;
const DETAIL_ALIAS_PATTERN = /^\d+$/;

const FILTER_SECTIONS = [
  { key: 'display', label: 'Display', optionKey: 'displayValue', emptyLabel: 'No display values available.' },
  { key: 'categories', label: 'Category', optionKey: 'categoryLabel', idKey: 'categoryId', emptyLabel: 'No categories available.' },
  { key: 'subcategories', label: 'Subcategory', optionKey: 'subcategoryLabel', idKey: 'subcategoryId', emptyLabel: 'No subcategories available.' },
  { key: 'modelName', label: 'Model Name', optionKey: 'modelNameValue', emptyLabel: 'No model names available.' },
  { key: 'brands', label: 'Brands', optionKey: 'brandValue', emptyLabel: 'No brands available.' },
  { key: 'colour', label: 'Colour', optionKey: 'colourValue', emptyLabel: 'No colour values available.' },
  { key: 'operatingSystem', label: 'Operating System', optionKey: 'operatingSystemValue', emptyLabel: 'No operating systems available.' },
];

const toDisplayValue = (value) => String(value || '').trim();

const getSpecificationValue = (product, keys = []) => {
  const specifications = product?.specifications || {};
  const specificationRecords = Array.isArray(product?.specification_records) ? product.specification_records : [];
  const normalizedKeys = keys.map((key) => normalizeSpecificationKey(key));

  for (const [key, value] of Object.entries(specifications)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    if (normalizedKeys.includes(normalizeSpecificationKey(key))) {
      return String(value).trim();
    }
  }

  for (const record of specificationRecords) {
    const recordKey = normalizeSpecificationKey(record?.key || record?.label || record?.name);
    if (normalizedKeys.includes(recordKey) && record?.value) {
      return String(record.value).trim();
    }
  }

  return '';
};

const matchesSelectedValues = (selectedValues = [], entryValue = '') =>
  !selectedValues.length || (entryValue && selectedValues.includes(entryValue));

function ProductsPage({ predefinedCategory }) {
  const { category: urlCategory, subcategory: urlSubcategory } = useParams();
  const navigate = useNavigate();
  const { products = [], categories = [], subcategories = [], subcategoriesByCategory = {}, brands = [], loading = false, error = null } = useProducts() ?? {};
  const [searchParams, setSearchParams] = useSearchParams();

  const querySearch = searchParams.get('search') || '';
  const searchCategory = searchParams.get('category') || '';
  const searchSubcategory = searchParams.get('subcategory') || '';
  const requestedCategory = predefinedCategory || urlCategory || searchCategory || '';
  const requestedSubcategory = urlSubcategory || searchSubcategory || '';

  const findCategory = useCallback((value) => {
    if (!value || value === 'All') {
      return null;
    }

    return (
      categories.find((category) => {
        const categoryName = category?.name || '';
        return (
          String(category?.id) === String(value) ||
          categoryName.toLowerCase() === String(value).toLowerCase() ||
          slugify(categoryName) === slugify(value)
        );
      }) || null
    );
  }, [categories]);

  const findSubcategory = useCallback((value, source = subcategories) => {
    if (!value || value === 'All') {
      return null;
    }

    return (
      source.find((subcategory) => {
        const subcategoryName = subcategory?.name || '';
        return (
          String(subcategory?.id) === String(value) ||
          subcategoryName.toLowerCase() === String(value).toLowerCase() ||
          slugify(subcategoryName) === slugify(value)
        );
      }) || null
    );
  }, [subcategories]);

  const resolvedCategory = useMemo(() => findCategory(requestedCategory), [requestedCategory, findCategory]);

  const categoryScopedSubcategories = useMemo(
    () => (resolvedCategory ? subcategoriesByCategory[String(resolvedCategory.id)] || [] : subcategories),
    [resolvedCategory, subcategoriesByCategory, subcategories],
  );

  const resolvedSubcategory = useMemo(
    () => findSubcategory(requestedSubcategory, categoryScopedSubcategories) || findSubcategory(requestedSubcategory, subcategories),
    [requestedSubcategory, categoryScopedSubcategories, subcategories, findSubcategory],
  );

  const routeCategoryId = resolvedCategory?.id ? String(resolvedCategory.id) : null;
  const routeSubcategoryId = resolvedSubcategory?.id ? String(resolvedSubcategory.id) : null;

  const searchBrand = searchParams.get('brand');

  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    categories: routeCategoryId ? [routeCategoryId] : [],
    subcategories: routeSubcategoryId ? [routeSubcategoryId] : [],
    brands: searchBrand ? [searchBrand] : [],
    featuredOnly: searchParams.get('featured') === '1',
  });
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState(querySearch);
  const debouncedSearch = useDeferredValue(searchTerm);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      categories: routeCategoryId ? [routeCategoryId] : [],
      subcategories: routeSubcategoryId ? [routeSubcategoryId] : [],
      brands: searchBrand ? [searchBrand] : [],
    }));
  }, [routeCategoryId, routeSubcategoryId, searchBrand]);

  useEffect(() => {
    setSearchTerm(querySearch);
  }, [querySearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, debouncedSearch, sortBy]);

  const catalogEntries = useMemo(
    () =>
      products.map((product) => {
        const categoryLabel = getCategoryName(product.category, categories) || 'Uncategorized';
        const subcategoryLabel = getSubcategoryName(product.subcategoryData ?? product.subcategory, subcategories) || '';
        const categoryId = String(product.categoryId ?? product.category?.id ?? product.category ?? '');
        const subcategoryId = String(product.subcategoryId ?? product.subcategoryData?.id ?? product.subcategory?.id ?? '');
        const displayValue =
          getSpecificationValue(product, ['display_size', 'display', 'screen_size']) || '';
        const modelNameValue =
          getSpecificationValue(product, ['model_name', 'model_number']) || '';
        const colourValue =
          getSpecificationValue(product, ['colour', 'color']) || '';
        const operatingSystemValue =
          getSpecificationValue(product, ['operating_system', 'os']) || '';
          
        const brandValue = toDisplayValue(product.brandName || getBrandName(product.brand, brands));
        const name = toDisplayValue(product.name);
        const mpn = toDisplayValue(product.mpn) || 'N/A';
        const sku = toDisplayValue(product.sku) || 'N/A';

        const specificationsText = (product.specifications || [])
          .flatMap((group) => [
            group.category,
            ...(group.items || []).flatMap((item) => [item.key, item.value]),
          ])
          .filter(Boolean)
          .join(' ');

        const recordsText = (product.specification_records || [])
          .flatMap((rec) => [rec.key, rec.label, rec.name, rec.value])
          .filter(Boolean)
          .join(' ');

        return {
          id: String(product.id),
          product,
          detailPath: `/products/${product.id}`,
          name,
          mpn,
          sku,
          categoryId,
          categoryLabel,
          subcategoryId,
          subcategoryLabel,
          displayValue,
          modelNameValue,
          brandValue,
          colourValue,
          operatingSystemValue,
          searchText: `${name} ${mpn} ${sku} ${specificationsText} ${recordsText}`.toLowerCase(),
        };
      }),
    [products, categories, subcategories, brands],
  );

  const selectedCategoryIds = filters.categories;
  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [String(category.id), category.name])),
    [categories],
  );
  const subcategoryNameById = useMemo(
    () => new Map(subcategories.map((subcategory) => [String(subcategory.id), subcategory.name])),
    [subcategories],
  );

  const availableSubcategories = useMemo(() => {
    if (!selectedCategoryIds.length) {
      return subcategories;
    }

    const lookup = new Map();
    selectedCategoryIds.forEach((categoryId) => {
      (subcategoriesByCategory[String(categoryId)] || []).forEach((subcategory) => {
        lookup.set(String(subcategory.id), subcategory);
      });
    });

    return Array.from(lookup.values());
  }, [selectedCategoryIds, subcategories, subcategoriesByCategory]);

  useEffect(() => {
    if (!filters.subcategories.length) {
      return;
    }

    const availableIds = new Set(availableSubcategories.map((subcategory) => String(subcategory.id)));
    const nextSubcategories = filters.subcategories.filter((subcategoryId) => availableIds.has(String(subcategoryId)));

    if (nextSubcategories.length !== filters.subcategories.length) {
      setFilters((current) => ({
        ...current,
        subcategories: nextSubcategories,
      }));
    }
  }, [availableSubcategories, filters.subcategories]);

  const matchesEntry = (entry, activeFilters, searchValue, ignoreKey = null) => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (normalizedSearch && !entry.searchText.includes(normalizedSearch)) {
      return false;
    }

    if (ignoreKey !== 'categories' && !matchesSelectedValues(activeFilters.categories, entry.categoryId)) {
      return false;
    }

    if (ignoreKey !== 'subcategories' && !matchesSelectedValues(activeFilters.subcategories, entry.subcategoryId)) {
      return false;
    }

    if (ignoreKey !== 'display' && !matchesSelectedValues(activeFilters.display, entry.displayValue)) {
      return false;
    }

    if (ignoreKey !== 'modelName' && !matchesSelectedValues(activeFilters.modelName, entry.modelNameValue)) {
      return false;
    }

    if (ignoreKey !== 'brands' && !matchesSelectedValues(activeFilters.brands, entry.brandValue)) {
      return false;
    }

    if (ignoreKey !== 'colour' && !matchesSelectedValues(activeFilters.colour, entry.colourValue)) {
      return false;
    }

    if (ignoreKey !== 'operatingSystem' && !matchesSelectedValues(activeFilters.operatingSystem, entry.operatingSystemValue)) {
      return false;
    }

    if (ignoreKey !== 'featuredOnly' && activeFilters.featuredOnly && !entry.product.featured) {
      return false;
    }

    return true;
  };

  const filterSections = useMemo(
    () =>
      FILTER_SECTIONS.map((section) => {
        const scopedEntries = catalogEntries.filter((entry) => matchesEntry(entry, filters, debouncedSearch, section.key));
        const counts = new Map();

        scopedEntries.forEach((entry) => {
          const optionValue = section.idKey ? entry[section.idKey] : entry[section.optionKey];
          const optionLabel = entry[section.optionKey];

          if (!optionValue || !optionLabel) {
            return;
          }

          const current = counts.get(String(optionValue)) || {
            value: String(optionValue),
            label: optionLabel,
            count: 0,
          };

          counts.set(String(optionValue), {
            ...current,
            count: current.count + 1,
          });
        });

        const selectedValues = filters[section.key] || [];
        selectedValues.forEach((selectedValue) => {
          const valueKey = String(selectedValue);

          if (counts.has(valueKey)) {
            return;
          }

          let label = valueKey;

          if (section.key === 'categories') {
            label = categoryNameById.get(valueKey) || valueKey;
          } else if (section.key === 'subcategories') {
            label = subcategoryNameById.get(valueKey) || valueKey;
          } else {
            const matchingEntry = catalogEntries.find((entry) => {
              const optionValue = section.idKey ? entry[section.idKey] : entry[section.optionKey];
              return String(optionValue) === valueKey;
            });

            label = matchingEntry?.[section.optionKey] || valueKey;
          }

          counts.set(valueKey, {
            value: valueKey,
            label,
            count: 0,
          });
        });

        return {
          ...section,
          options: Array.from(counts.values()).sort((first, second) => first.label.localeCompare(second.label)),
        };
      }),
    [catalogEntries, filters, debouncedSearch, categoryNameById, subcategoryNameById],
  );

  const filteredEntries = useMemo(() => {
    const visibleEntries = catalogEntries.filter((entry) => matchesEntry(entry, filters, debouncedSearch));

    return [...visibleEntries].sort((first, second) => {
      if (sortBy === 'name-asc') {
        return first.name.localeCompare(second.name);
      }

      if (sortBy === 'name-desc') {
        return second.name.localeCompare(first.name);
      }

      return 0;
    });
  }, [catalogEntries, filters, debouncedSearch, sortBy]);

  const totalPages = Math.ceil(filteredEntries.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredEntries
    .slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE)
    .map((entry) => entry.product);

  const selectedCategoryLabels = useMemo(() => {
    const map = new Map(categories.map((category) => [String(category.id), category.name]));
    return filters.categories.map((categoryId) => ({
      key: 'categories',
      value: categoryId,
      label: map.get(String(categoryId)) || String(categoryId),
      groupLabel: 'Category',
    }));
  }, [filters.categories, categories]);

  const selectedSubcategoryLabels = useMemo(() => {
    const map = new Map(subcategories.map((subcategory) => [String(subcategory.id), subcategory.name]));
    return filters.subcategories.map((subcategoryId) => ({
      key: 'subcategories',
      value: subcategoryId,
      label: map.get(String(subcategoryId)) || String(subcategoryId),
      groupLabel: 'Subcategory',
    }));
  }, [filters.subcategories, subcategories]);

  const activeFilterChips = useMemo(() => {
    const chips = [...selectedCategoryLabels, ...selectedSubcategoryLabels];

    filterSections.forEach((section) => {
      if (section.key === 'categories' || section.key === 'subcategories') {
        return;
      }

      const selectedValues = filters[section.key] || [];
      selectedValues.forEach((selectedValue) => {
        const matchingOption = section.options.find((option) => String(option.value) === String(selectedValue));

        chips.push({
          key: section.key,
          value: selectedValue,
          label: matchingOption?.label || String(selectedValue),
          groupLabel: section.label,
        });
      });
    });

    if (filters.featuredOnly) {
      chips.push({
        key: 'featuredOnly',
        value: 'featuredOnly',
        label: 'Stocked Units',
        groupLabel: 'Availability',
      });
    }

    return chips;
  }, [filters, filterSections, selectedCategoryLabels, selectedSubcategoryLabels]);

  const handleToggleFilter = (key, value) => {
    setFilters((current) => {
      if (key === 'featuredOnly') {
        return {
          ...current,
          featuredOnly: !current.featuredOnly,
        };
      }

      const currentValues = Array.isArray(current[key]) ? current[key] : [];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      if (key === 'categories') {
        if (!nextValues.length) {
          return {
            ...current,
            categories: [],
            subcategories: [],
          };
        }

        const validSubcategoryIds = new Set(
          nextValues.flatMap((categoryId) =>
            (subcategoriesByCategory[String(categoryId)] || []).map((subcategory) => String(subcategory.id)),
          ),
        );

        return {
          ...current,
          categories: nextValues,
          subcategories: current.subcategories.filter((subcategoryId) => validSubcategoryIds.has(String(subcategoryId))),
        };
      }

      return {
        ...current,
        [key]: nextValues,
      };
    });
  };

  const handleRemoveFilter = (key, value) => {
    if (key === 'featuredOnly') {
      setFilters((current) => ({
        ...current,
        featuredOnly: false,
      }));
      return;
    }

    setFilters((current) => ({
      ...current,
      [key]: (current[key] || []).filter((item) => String(item) !== String(value)),
    }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchTerm('');
    setSearchParams({});

    if (urlCategory || urlSubcategory || predefinedCategory) {
      navigate('/products');
    }
  };

  const activeCategoryLabel =
    filters.categories.length === 1
      ? categories.find((category) => String(category.id) === String(filters.categories[0]))?.name || ''
      : '';

  const activeSubcategoryLabel =
    filters.subcategories.length === 1
      ? subcategories.find((subcategory) => String(subcategory.id) === String(filters.subcategories[0]))?.name || ''
      : '';
  const hasCategoryScopedResults = Boolean(filters.categories.length || filters.subcategories.length);

  return (
    <div className="container-shell pb-8 sm:pb-16 lg:pb-20">
      <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-greyMedium sm:py-6 sm:text-[11px]">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-primary hover:opacity-90">
          <Home size={12} /> Home
        </Link>
        <span className="text-slate-300">/</span>
        <Link to="/products" className="transition-colors hover:text-primary hover:opacity-90">Products</Link>
        {filters.categories.length === 1 ? (
          <>
            <ChevronRight size={10} />
            <span className="text-textSecondary">{activeCategoryLabel}</span>
          </>
        ) : null}
        {activeSubcategoryLabel ? (
          <>
            <ChevronRight size={10} />
            <span className="text-textMain">{activeSubcategoryLabel}</span>
          </>
        ) : null}
      </nav>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        {showMobileFilters ? (
          <button
            type="button"
            className="fixed inset-0 z-[39] bg-black/45 backdrop-blur-[1px] lg:hidden"
            onClick={() => setShowMobileFilters(false)}
            aria-label="Close filters"
          />
        ) : null}

        <div
          className={`fixed inset-y-0 left-0 z-[40] w-[min(88vw,340px)] bg-white transition-transform duration-300 lg:sticky lg:top-6 lg:z-auto lg:w-[280px] lg:self-start lg:bg-transparent xl:w-[300px] ${showMobileFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-greyBorder bg-primary p-4 lg:hidden">
              <span className="text-sm font-black uppercase tracking-widest text-textMain">Filters</span>
              <button type="button" onClick={() => setShowMobileFilters(false)} aria-label="Close filters">
                <X size={20} />
              </button>
            </div>
            <div className="h-full overflow-y-auto p-6 lg:p-0">
              <FilterSidebar
                sections={filterSections}
                filters={filters}
                totalResults={filteredEntries.length}
                onToggleOption={handleToggleFilter}
                onReset={resetFilters}
              />
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-5 border-b border-greyBorder pb-5 sm:mb-8 sm:pb-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold text-textSecondary sm:text-sm">{filteredEntries.length} Total Item(s)</p>
                <h1 className="mt-1.5 text-2xl font-black tracking-tighter text-textMain sm:mt-2 sm:text-3xl md:text-4xl">
                  {activeSubcategoryLabel || activeCategoryLabel || 'Global Catalog'}
                </h1>
              </div>

              <div className="flex flex-col gap-4 xl:items-end">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
                  <div className="relative w-full sm:max-w-[320px] sm:flex-1 xl:w-[320px] xl:flex-none">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-greyMedium" />
                    <input
                      type="text"
                      placeholder="Search by name, SKU, or specifications"
                      value={searchTerm}
                      onChange={(event) => {
                        startTransition(() => {
                          setSearchTerm(event.target.value);
                        });
                      }}
                      className="w-full rounded-xl border border-greyBorder bg-greyLight/35 py-2.5 pl-10 pr-4 text-sm font-medium text-textMain outline-none transition-colors focus:border-primary sm:py-3"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMobileFilters(true)}
                    className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-greyBorder bg-white px-3.5 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-textMain lg:hidden sm:min-h-[46px] sm:px-4 sm:py-3 sm:text-[11px]"
                  >
                    <SlidersHorizontal size={14} />
                    Filters
                  </button>

                  <div className="flex min-h-[42px] items-center justify-between gap-2 rounded-xl border border-greyBorder bg-white px-3 sm:min-h-[46px] sm:justify-start">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-greyMedium sm:text-[11px]">Sort</span>
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                      className="bg-white py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-textMain outline-none sm:py-3 sm:text-[11px]"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="name-asc">Name (A-Z)</option>
                      <option value="name-desc">Name (Z-A)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-greyBorder sm:flex">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`inline-flex min-h-[42px] items-center justify-center gap-1.5 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] transition-colors sm:min-h-[46px] sm:gap-2 sm:px-4 sm:py-3 sm:text-[11px] ${viewMode === 'grid'
                          ? 'bg-yellowPrimary text-textMain'
                          : 'bg-white text-textSecondary hover:bg-greyLight/50'
                        }`}
                    >
                      <LayoutGrid size={15} />
                      Grid View
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`inline-flex min-h-[42px] items-center justify-center gap-1.5 border-l border-greyBorder px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] transition-colors sm:min-h-[46px] sm:gap-2 sm:px-4 sm:py-3 sm:text-[11px] ${viewMode === 'list'
                          ? 'bg-yellowPrimary text-textMain'
                          : 'bg-white text-textSecondary hover:bg-greyLight/50'
                        }`}
                    >
                      <List size={15} />
                      List View
                    </button>
                  </div>
                </div>

                {activeFilterChips.length ? (
                  <div className="w-full xl:max-w-4xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[11px] font-black uppercase tracking-[0.18em] text-textMain">Active Filters</span>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary transition-colors hover:opacity-90"
                      >
                        Clear Filters
                      </button>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {activeFilterChips.map((chip) => (
                        <button
                          key={`${chip.key}-${chip.value}`}
                          type="button"
                          onClick={() => handleRemoveFilter(chip.key, chip.value)}
                          className="inline-flex items-center gap-2 rounded-full border border-greyBorder bg-white px-3 py-2 text-[11px] font-semibold text-textSecondary transition-colors hover:border-primary hover:opacity-90 hover:text-textMain"
                        >
                          <span>{chip.label}</span>
                          <X size={12} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="min-h-[420px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20 opacity-60">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-greyBorder border-t-primary" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-textSecondary">
                  Refreshing Catalog
                </span>
              </div>
            ) : error ? (
              <div className="rounded-sm border border-rose-200 bg-rose-50 px-6 py-12 text-center">
                <p className="text-lg font-black uppercase tracking-tight text-rose-700">Unable to load catalog</p>
                <p className="mx-auto mt-3 max-w-xl text-sm text-rose-600">{error}</p>
              </div>
            ) : filteredEntries.length ? (
              <div className="space-y-6 sm:space-y-10">
                <ProductGrid products={paginatedProducts} viewMode={viewMode} />
                {totalPages > 1 ? (
                  <div className="border-t border-greyBorder pt-8 sm:pt-12">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-sm border border-dashed border-greyBorder bg-greyLight/40 py-24 text-center">
                <p className="mb-4 text-xl font-black uppercase tracking-tighter text-textSecondary">
                  {products.length
                    ? (hasCategoryScopedResults ? 'No products available for this category' : 'No products found')
                    : 'No products available'}
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="bg-primary px-8 py-3 text-[11px] font-black uppercase tracking-widest text-textMain transition-colors hover:opacity-90"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Products(props) {
  const { category, subcategory } = useParams();

  if (!subcategory && DETAIL_ALIAS_PATTERN.test(category || '')) {
    return <ProductDetails productIdOverride={category} />;
  }

  return <ProductsPage {...props} />;
}

export default Products;
