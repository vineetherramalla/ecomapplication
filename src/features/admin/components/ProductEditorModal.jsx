import { useEffect, useMemo, useState } from 'react';
import AdminModal from './AdminModal';
import { getTopLevelCategories } from '../utils/adminUtils';
import { createBrand } from '../../../api/brandApi';

import { resolveAssetUrl } from '../../../api/apiUtils';
import { showToast } from '../../../utils/helpers';

const DEFAULT_PRODUCT_FLAGS = [
  { key: 'featured', label: 'Featured' },
  { key: 'top_selling', label: 'Top Selling' },
  { key: 'new_arrival', label: 'New Arrival' },
];

const normalizeSpecification = (specification = {}, index = 0) => ({
  id: specification.id ?? `temp-${Date.now()}-${index}`,
  key: String(specification.key || specification.label || specification.name || '').trim(),
  value: String(specification.value || '').trim(),
  section: String(specification.section || specification.category || 'General').trim() || 'General',
});

const normalizeGroupedSpecifications = (groups = []) =>
  groups.flatMap((group, groupIndex) =>
    (group?.items || []).map((item, itemIndex) =>
      normalizeSpecification(
        {
          id: item.id ?? `${groupIndex}-${itemIndex}`,
          key: item.key,
          value: item.value,
          section: group.category || group.section || 'General',
        },
        groupIndex * 100 + itemIndex,
      ),
    ),
  );

const normalizeExistingImage = (image, index = 0) => {
  if (!image) {
    return null;
  }

  const url = image.url || image.image || (typeof image === 'string' ? image : '');
  if (!url) {
    return null;
  }

  return {
    id: image.id ?? null,
    url,
    display_order: image.display_order ?? index,
  };
};

const createInitialForm = (product) => {
  const baseSpecifications = Array.isArray(product?.specification_records) && product.specification_records.length
    ? product.specification_records.map(normalizeSpecification)
    : normalizeGroupedSpecifications(Array.isArray(product?.specifications) ? product.specifications : []);
  const existingImages = (
    Array.isArray(product?.gallery) && product.gallery.length
      ? product.gallery
      : Array.isArray(product?.images)
        ? product.images
        : []
  )
    .map(normalizeExistingImage)
    .filter(Boolean);

  return {
    name: product?.name || '',
    brand: String(typeof product?.brand === 'object' ? product?.brand?.id : product?.brand || ''),
    category:
      String((typeof product?.category === 'object' ? product?.category?.id : product?.category) || ''),
    subcategory: String(product?.subcategoryId || ''),
    description: product?.description || '',
    stock: product?.stock ?? 0,
    featured: Boolean(product?.featured),
    top_selling: Boolean(product?.top_selling ?? product?.topSelling),
    new_arrival: Boolean(product?.new_arrival ?? product?.isNew),
    mpn: product?.mpn || '',
    sku: product?.sku || '',
    specifications: baseSpecifications,
    highlights: Array.isArray(product?.highlights)
      ? product.highlights.map(h => (typeof h === 'object' ? h.text : h)).join('\n')
      : String(product?.highlights || ''),
    existingImages,
    files: [],
  };
};

function ProductEditorModal({
  open,
  product,
  products = [],
  categories = [],
  subcategoriesByCategory = {},
  submitting,
  brands = [],
  productFlags = [],
  setBrands,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(createInitialForm(product));

  useEffect(() => {
    const handlePaste = (event) => {
      if (!open) return;
      
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            setForm((current) => ({
              ...current,
              files: [...current.files, file],
            }));
            showToast({ title: 'Image pasted', message: 'Image captured from clipboard', type: 'success' });
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [open]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [showNewSectionInput, setShowNewSectionInput] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [showNewBrandInput, setShowNewBrandInput] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [creatingBrand, setCreatingBrand] = useState(false);

  useEffect(() => {
    setForm(createInitialForm(product));
  }, [product, open]);


  useEffect(() => {
    const nextUrls = form.files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setPreviewUrls(nextUrls);

    return () => {
      nextUrls.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [form.files]);

  const topLevelCategories = getTopLevelCategories(categories);
  const subcategories = useMemo(
    () => (form.category ? subcategoriesByCategory[String(form.category)] || [] : []),
    [form.category, subcategoriesByCategory],
  );
  const resolvedProductFlags = useMemo(() => {
    const allowedFlags = new Map(DEFAULT_PRODUCT_FLAGS.map((flag) => [flag.key, flag]));
    const dynamicFlags = (Array.isArray(productFlags) ? productFlags : [])
      .filter((flag) => allowedFlags.has(flag?.key))
      .map((flag) => ({
        key: flag.key,
        label: flag.label || allowedFlags.get(flag.key).label,
      }));

    return dynamicFlags.length ? dynamicFlags : DEFAULT_PRODUCT_FLAGS;
  }, [productFlags]);

  const globalSections = useMemo(() => {
    const defaultSections = [
      'General',
      'Processor',
      'Memory',
      'Display',
      'Connectivity',
      'Power',
      'Physical',
      'Operating System',
      'Additional Details'
    ];
    
    const catalogSections = products.flatMap(p => {
      const specs = p.specification_records || p.specifications || [];
      if (Array.isArray(specs)) {
        return specs.map(s => s.section || s.category).filter(Boolean);
      }
      return [];
    });

    return [...new Set([...defaultSections, ...catalogSections])].sort();
  }, [products]);

  useEffect(() => {
    if (!form.category) {
      return;
    }

    const subcategoryExists = subcategories.some(
      (subcategory) => String(subcategory.id) === String(form.subcategory),
    );

    if (!subcategoryExists && form.subcategory) {
      setForm((current) => ({
        ...current,
        subcategory: '',
      }));
    }
  }, [form.category, form.subcategory, subcategories]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      ...(name === 'category' ? { subcategory: '' } : {}),
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFlagChange = (name) => {
    setForm((current) => ({
      ...current,
      [name]: !current[name],
    }));
  };

  const handleSmartPaste = (event) => {
    const { name } = event.target;
    const text = event.clipboardData.getData('Text');
    if (!text || text.length < 10) return;

    // Convert bullet points and sentences into newlines for a list structure
    const points = text
      .split(/[•·●○■□▪▫*–—]|\n/)
      .flatMap(p => p.split(/\. (?=[A-Z])/))
      .map(p => p.trim().replace(/^\.*|\.*$/g, ''))
      .filter(p => p.length > 2);

    if (points.length > 1) {
      event.preventDefault();
      const newText = points.join('\n');
      
      setForm(prev => {
        const currentVal = prev[name] || '';
        const currentPrefix = currentVal && !currentVal.endsWith('\n') 
          ? currentVal + '\n' 
          : currentVal;
        return {
          ...prev,
          [name]: currentPrefix + newText + '\n'
        };
      });
    }
  };

  const handleFileChange = (event) => {
    const nextFiles = Array.from(event.target.files || []);
    if (!nextFiles.length) {
      return;
    }

    setForm((current) => ({
      ...current,
      files: [...current.files, ...nextFiles],
    }));
    event.target.value = '';
  };

  const handleRemoveNewFile = (index) => {
    setForm((current) => ({
      ...current,
      files: current.files.filter((_, fileIndex) => fileIndex !== index),
    }));
  };

  const handleRemoveExistingImage = (index) => {
    setForm((current) => ({
      ...current,
      existingImages: current.existingImages.filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  const handleAddSpecification = (section = 'General') => {
    setForm((current) => ({
      ...current,
      specifications: [
        ...current.specifications,
        { id: `temp-${Date.now()}`, section, key: '', value: '' }
      ],
    }));
  };

  const handleAddCustomSection = () => {
    const trimmed = newSectionName.trim();
    if (!trimmed) return;
    handleAddSpecification(trimmed);
    setNewSectionName('');
    setShowNewSectionInput(false);
  };

  const handleSpecificationChange = (index, field, value) => {
    setForm((current) => ({
      ...current,
      specifications: current.specifications.map((spec, specIndex) =>
        specIndex === index ? { ...spec, [field]: value } : spec
      ),
    }));
  };

  const handleRemoveSpecification = (index) => {
    setForm((current) => ({
      ...current,
      specifications: current.specifications.filter((_, specIndex) => specIndex !== index),
    }));
  };

  const handleAddCustomBrand = async () => {
    const trimmed = newBrandName.trim();
    if (!trimmed) return;
    setCreatingBrand(true);
    try {
      const newBrand = await createBrand({ name: trimmed });
      setBrands && setBrands(prev => [...prev, newBrand]);
      setForm(current => ({ ...current, brand: newBrand.id }));
      setNewBrandName('');
      setShowNewBrandInput(false);
    } catch {
      showToast({ title: 'Error', message: 'Failed to create brand', type: 'error' });
    } finally {
      setCreatingBrand(false);
    }
  };



  const handleSubmit = (event) => {
    event.preventDefault();

    // Brand is now a ForeignKey on the backend — send the numeric pk directly.
    const brandId = form.brand ? Number(form.brand) : null;

    onSubmit({
      name: form.name.trim(),
      brand: brandId,
      category: form.category ? Number(form.category) : null,
      subcategory: form.subcategory ? Number(form.subcategory) : null,
      description: form.description.trim(),
      stock: Number(form.stock || 0),
      featured: Boolean(form.featured),
      top_selling: Boolean(form.top_selling),
      new_arrival: Boolean(form.new_arrival),
      mpn: form.mpn.trim(),
      sku: form.sku.trim(),
      specifications: form.specifications.map(s => ({
        key: s.key.trim(),
        value: s.value.trim(),
        section: s.section.trim() || 'General'
      })).filter(s => s.key && s.value),
      highlights: typeof form.highlights === 'string' 
        ? form.highlights.split('\n').map(h => h.trim()).filter(h => h !== '')
        : [],
      files: form.files,
      remaining_image_ids: form.existingImages.map(img => img.id).filter(Boolean),
    });
  };

  const handleApplyTemplate = () => {
    const template = [
      { section: 'General', key: 'Brand', value: form.brand || '' },
      { section: 'General', key: 'Model Name', value: '' },
      { section: 'General', key: 'Model Number', value: form.mpn || '' },
      { section: 'General', key: 'Color', value: '' },
      { section: 'Processor', key: 'Processor', value: '' },
      { section: 'Processor', key: 'Processor Brand', value: '' },
      { section: 'Processor', key: 'Cores', value: '' },
      { section: 'Memory', key: 'RAM', value: '' },
      { section: 'Memory', key: 'Storage', value: '' },
      { section: 'Connectivity', key: 'WiFi', value: '' },
      { section: 'Connectivity', key: 'Bluetooth', value: '' },
      { section: 'Audio / Ports', key: 'USB Ports', value: '' },
      { section: 'Audio / Ports', key: 'HDMI', value: '' },
      { section: 'Power', key: 'Battery Type', value: '' },
      { section: 'Power', key: 'Charging', value: '' },
      { section: 'Physical', key: 'Dimensions', value: '' },
      { section: 'Physical', key: 'Weight', value: '' },
      { section: 'Operating System', key: 'OS', value: '' }
    ].map(s => ({ ...s, id: `temp-${Math.random()}` }));

    const existingMap = new Set(form.specifications.map(s => `${s.section}:${s.key}`.toLowerCase()));
    const nextSpecs = [...form.specifications];

    template.forEach(ts => {
      if (!existingMap.has(`${ts.section}:${ts.key}`.toLowerCase())) {
        nextSpecs.push(ts);
      }
    });

    setForm(f => ({ ...f, specifications: nextSpecs }));
  };

  const groupedSpecs = form.specifications.reduce((acc, s) => {
    const section = s.section.trim() || 'General';
    if (!acc[section]) acc[section] = [];
    acc[section].push(s);
    return acc;
  }, {});

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={product ? 'Edit product' : 'Add product'}
      description="Manage the catalog with the same product, image, specification, and inventory APIs used by the storefront."
      size="xl"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="admin-product-form"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-textMain transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Saving...' : product ? 'Save changes' : 'Create product'}
          </button>
        </div>
      }
    >
      <form id="admin-product-form" onSubmit={handleSubmit} className="space-y-8 pb-12">
        {/* Catalog Metadata */}
        <section className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Core info</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">Catalog metadata</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Product name</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                maxLength={255}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-yellowPrimary"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Brand</span>
              <div className="flex gap-2 relative">
                {!showNewBrandInput ? (
                  <select
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-yellowPrimary"
                    required
                  >
                    <option value="">Select brand</option>
                    {brands.map((b) => (
                      <option key={b.id || b.name} value={b.id || b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex-1 flex gap-2">
                    <input
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-yellowPrimary"
                      placeholder="Brand name..."
                      disabled={creatingBrand}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomBrand}
                      className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-textMain"
                      disabled={creatingBrand}
                    >
                      Add
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowNewBrandInput(!showNewBrandInput)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold whitespace-nowrap outline-none transition-colors hover:bg-slate-50"
                >
                  {showNewBrandInput ? 'Cancel' : 'New Brand'}
                </button>
              </div>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Category</span>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-yellowPrimary"
                required
              >
                <option value="">Select category</option>
                {topLevelCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Subcategory</span>
              <select
                name="subcategory"
                value={form.subcategory}
                onChange={handleChange}
                disabled={!form.category}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-yellowPrimary"
                required
              >
                <option value="">
                  {form.category ? 'Select subcategory' : 'Choose a category first'}
                </option>
                {subcategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Description</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                onPaste={handleSmartPaste}
                rows="4"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-yellowPrimary"
                placeholder="Short operational summary for buyers"
              />
            </label>
          </div>
        </section>

        {/* Specifications */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Technical data</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">Specification sheet</h3>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleApplyTemplate}
                className="inline-flex items-center justify-center rounded-full border border-primary px-4 py-2 text-xs font-bold text-textMain hover:bg-primary/5"
              >
                Fill PDF Template
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNewSectionInput(!showNewSectionInput)}
                  className="inline-flex items-center justify-center rounded-full border border-textMain px-4 py-2 text-xs font-bold text-textMain hover:bg-slate-50"
                >
                  {showNewSectionInput ? 'Cancel' : 'New Section'}
                </button>
                {showNewSectionInput && (
                  <div className="absolute right-0 top-full z-10 mt-2 flex w-64 gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                    <input
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      placeholder="Section name..."
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-yellowPrimary"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSection}
                      className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-textMain"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleAddSpecification()}
                className="inline-flex items-center justify-center rounded-full bg-textMain px-4 py-2 text-xs font-bold text-white hover:bg-black"
              >
                Add Row
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">MPN</span>
              <input
                name="mpn"
                value={form.mpn}
                onChange={handleChange}
                maxLength={100}
                placeholder="Manufacturer Part Number"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-yellowPrimary"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">SKU</span>
              <input
                name="sku"
                value={form.sku}
                onChange={handleChange}
                maxLength={100}
                placeholder="Internal SKU"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-yellowPrimary"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Stock</span>
              <input
                name="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-yellowPrimary"
                required
              />
            </label>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedSpecs).map(([sectionName, specs]) => (
              <div key={sectionName} className="rounded-[24px] border border-slate-100 bg-slate-50/50 overflow-hidden">
                <div className="bg-slate-100/50 px-5 py-3 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">{sectionName}</h4>
                    <button
                      type="button"
                      onClick={() => handleAddSpecification(sectionName)}
                      className="text-[10px] font-bold text-primary hover:underline"
                    >
                      + Add Row to {sectionName}
                    </button>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{specs.length} items</span>
                </div>
                <div className="p-4 space-y-3">
                  {specs.map((spec) => {
                    const globalIndex = form.specifications.findIndex(s => s.id === spec.id);
                    return (
                      <div key={spec.id} className="grid grid-cols-[1.5fr_1fr_2fr_auto] gap-3 items-center">
                        <select
                          value={spec.section}
                          onChange={(e) => handleSpecificationChange(globalIndex, 'section', e.target.value)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-tight outline-none focus:border-yellowPrimary"
                        >
                          {/* Combine global sections with current product sections and sectionName to satisfy all possibilities */}
                          {[...new Set([...globalSections, ...Object.keys(groupedSpecs), sectionName])].sort().map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <input
                          value={spec.key}
                          onChange={(e) => handleSpecificationChange(globalIndex, 'key', e.target.value)}
                          placeholder="Field name"
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-yellowPrimary"
                        />
                        <input
                          value={spec.value}
                          onChange={(e) => handleSpecificationChange(globalIndex, 'value', e.target.value)}
                          placeholder="Value"
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-yellowPrimary"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecification(globalIndex)}
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {!form.specifications.length && (
              <div className="py-12 flex flex-col items-center justify-center text-center opacity-50 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                <p className="text-sm font-medium text-slate-500">No specifications added yet.</p>
                <button type="button" onClick={handleApplyTemplate} className="mt-2 text-xs font-bold text-primary">Use standard PDF template</button>
              </div>
            )}
          </div>
        </section>

        {/* Highlights */}
        <section className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Merchandising</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">Product Highlights</h3>
          </div>
          <div className="space-y-3">
            <label className="field-stack">
              <span className="text-sm font-semibold text-slate-700">Detailed Features (New line per point)</span>
              <textarea
                name="highlights"
                value={form.highlights}
                onChange={handleChange}
                onPaste={handleSmartPaste}
                rows="6"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-yellowPrimary"
                placeholder="Enter key product features... 
Example:
High-speed data transfer
Premium build quality
3-year warranty"
              />
            </label>
            <p className="text-[10px] text-slate-400 font-medium">
              Each new line will be automatically converted into a bullet point on the live product page. Perfect for detailed technical advantages and selling points.
            </p>
          </div>
        </section>

        {/* Visuals */}
        <section className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Visuals</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">Images and gallery</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {form.existingImages.map((image, index) => (
              <div key={image.id || index} className="group relative aspect-square overflow-hidden rounded-[24px] border border-slate-200">
                <img src={resolveAssetUrl(image.url || image.image)} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(index)}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-rose-600 shadow-sm transition-opacity opacity-0 group-hover:opacity-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            {previewUrls.map((item, index) => (
              <div key={item.url} className="group relative aspect-square overflow-hidden rounded-[24px] border-2 border-primary/20">
                <img src={item.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveNewFile(index)}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-slate-600 shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-primary/50 hover:bg-primary/5">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-primary"><path d="M12 5v14M5 12h14" /></svg>
              <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Upload</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
            </label>
          </div>
        </section>

        {/* Merchandising Flags */}
        <section className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Visibility</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">Flags and listing</h3>
          </div>
          <div className="flex flex-wrap gap-4">
            {resolvedProductFlags.map((flag) => (
              <label key={flag.key} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 transition-colors hover:bg-slate-50">
                <input 
                  type="checkbox" 
                  checked={Boolean(form[flag.key])} 
                  onChange={() => handleFlagChange(flag.key)} 
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" 
                />
                <span className="text-sm font-bold text-slate-700">{flag.label}</span>
              </label>
            ))}
          </div>
        </section>
      </form>
    </AdminModal>
  );
}

export default ProductEditorModal;
