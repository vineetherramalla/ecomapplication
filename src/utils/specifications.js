export const SPECIFICATION_FIELDS = [
  { key: 'model_name', label: 'Model Name', placeholder: 'MacBook Pro MDE54-M5', section: 'General' },
  { key: 'model_number', label: 'Model Number', placeholder: 'MDE54HN/A', section: 'General' },
  { key: 'colour', label: 'Colour', placeholder: 'Silver', section: 'General' },
  { key: 'color', label: 'Color', placeholder: 'Silver', section: 'General' },
  { key: 'graphics', label: 'Graphics', placeholder: 'Integrated 10 Core GPU', section: 'General' },
  { key: 'keyboard', label: 'Keyboard', placeholder: 'Backlit Magic Keyboard', section: 'General' },
  { key: 'pointing_device', label: 'Pointing Device', placeholder: 'Force Touch Trackpad', section: 'General' },
  { key: 'processor', label: 'Processor', placeholder: 'Apple M5 Chip', section: 'Processor' },
  { key: 'chipset', label: 'Chipset', placeholder: 'Apple Silicon', section: 'Processor' },
  { key: 'processor_brand', label: 'Processor Brand', placeholder: 'Apple', section: 'Processor' },
  { key: 'storage', label: 'Storage', placeholder: '1TB SSD', section: 'Memory' },
  { key: 'memory', label: 'Memory', placeholder: '16GB RAM', section: 'Memory' },
  { key: 'display_resolution', label: 'Display Resolution', placeholder: '3024 x 1964', section: 'Display' },
  { key: 'display_size', label: 'Display Size', placeholder: '14 inch', section: 'Display' },
  { key: 'display_features', label: 'Display Features', placeholder: 'Liquid Retina XDR', section: 'Display' },
  { key: 'wireless_connectivity', label: 'Wireless Connectivity', placeholder: 'Wi-Fi 6E, Bluetooth 5.3', section: 'Connectivity' },
  { key: 'power_adapter', label: 'Power Adapter', placeholder: '96W USB-C Power Adapter', section: 'Power' },
  { key: 'dimensions', label: 'Dimensions', placeholder: '31.26 x 22.12 x 1.55 cm', section: 'Physical' },
  { key: 'weight', label: 'Weight', placeholder: '1.55 kg', section: 'Physical' },
  { key: 'os', label: 'OS', placeholder: 'macOS', section: 'Operating System' },
  { key: 'operating_system', label: 'Operating System', placeholder: 'macOS', section: 'Operating System' },
  { key: 'product_type', label: 'Product Type', placeholder: 'Laptop', section: 'Additional Details' },
  { key: 'whats_in_the_box', label: 'Whats in the Box', placeholder: 'Laptop, adapter, cable', section: 'Additional Details' },
  { key: 'webcam', label: 'Webcam', placeholder: '1080p FaceTime HD camera', section: 'Additional Details' },
  { key: 'features', label: 'Features', placeholder: 'Touch ID, backlit keyboard', section: 'Additional Details' },
];

const SECTION_ORDER = [
  'General',
  'Processor',
  'Memory',
  'Display',
  'Connectivity',
  'Power',
  'Physical',
  'Operating System',
  'Additional Details',
];

const SECTION_ALIASES = {
  general: 'General',
  processor: 'Processor',
  memory: 'Memory',
  display: 'Display',
  connectivity: 'Connectivity',
  power: 'Power',
  physical: 'Physical',
  'operating system': 'Operating System',
  operatingsystem: 'Operating System',
  os: 'Operating System',
  'additional details': 'Additional Details',
  additional: 'Additional Details',
};

const FIELD_LABEL_LOOKUP = SPECIFICATION_FIELDS.reduce((accumulator, field) => {
  accumulator[field.key] = field.label;
  return accumulator;
}, {});

const titleCase = (value) =>
  String(value || '')
    .split(' ')
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');

export const normalizeSpecificationKey = (label) =>
  String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export const formatSpecificationLabel = (key) => {
  if (!key) {
    return 'Specification';
  }

  if (FIELD_LABEL_LOOKUP[key]) {
    return FIELD_LABEL_LOOKUP[key];
  }

  return titleCase(String(key).replace(/[_-]+/g, ' '));
};

export const normalizeSpecificationSection = (value) => {
  const normalized = String(value || 'General').trim().toLowerCase();
  return SECTION_ALIASES[normalized] || titleCase(normalized.replace(/[_-]+/g, ' '));
};

const normalizeSpecificationRecord = (record = {}, fallbackSection = 'General') => {
  const key =
    record?.key ??
    record?.name ??
    record?.label ??
    record?.field ??
    record?.spec_key ??
    record?.specification_key;
  const value =
    record?.value ??
    record?.spec_value ??
    record?.field_value ??
    record?.specification_value;

  if (!key || value === undefined || value === null || String(value).trim() === '') {
    return null;
  }

  return {
    id: record?.id ?? `${fallbackSection}-${key}`,
    key: normalizeSpecificationKey(key),
    label: formatSpecificationLabel(normalizeSpecificationKey(key)),
    value: String(value).trim(),
    section: normalizeSpecificationSection(record?.section || fallbackSection),
  };
};

export const toSpecificationRecords = (specificationSource = {}) => {
  if (Array.isArray(specificationSource)) {
    return specificationSource
      .map((record) => normalizeSpecificationRecord(record))
      .filter(Boolean);
  }

  if (!specificationSource || typeof specificationSource !== 'object') {
    return [];
  }

  return Object.entries(specificationSource)
    .map(([key, value]) => normalizeSpecificationRecord({ key, value }))
    .filter(Boolean);
};

export const buildSpecificationSections = (specificationSource = {}) => {
  const records = toSpecificationRecords(specificationSource);
  if (!records.length) {
    return [];
  }

  const groupedSections = records.reduce((accumulator, record) => {
    const sectionName = record.section || 'General';
    if (!accumulator[sectionName]) {
      accumulator[sectionName] = [];
    }

    accumulator[sectionName].push(record);
    return accumulator;
  }, {});

  const orderedSectionNames = [
    ...SECTION_ORDER.filter((section) => groupedSections[section]),
    ...Object.keys(groupedSections).filter((section) => !SECTION_ORDER.includes(section)),
  ];

  return orderedSectionNames.map((section) => ({
    id: normalizeSpecificationKey(section),
    title: section,
    items: groupedSections[section].map((record) => ({
      id: record.id,
      key: record.key,
      label: record.label,
      value: record.value,
    })),
  }));
};

export const getSpecificationHighlights = (specificationSource = {}, maxItems = 6) => {
  const records = toSpecificationRecords(specificationSource);
  if (!records.length) {
    return [];
  }

  const priorityKeys = [
    'processor',
    'chipset',
    'memory',
    'storage',
    'display_size',
    'display_resolution',
    'graphics',
    'os',
    'operating_system',
  ];

  const found = [];
  const remaining = [...records];

  priorityKeys.forEach((priorityKey) => {
    const matchIndex = remaining.findIndex((record) => record.key === priorityKey);
    if (matchIndex >= 0) {
      found.push(remaining[matchIndex]);
      remaining.splice(matchIndex, 1);
    }
  });

  return [...found, ...remaining].slice(0, maxItems).map((record) => ({
    key: record.key,
    label: record.label,
    value: record.value,
  }));
};

export const buildSpecificationFormState = (specifications = []) => {
  const records = toSpecificationRecords(specifications);
  const knownKeys = new Set(SPECIFICATION_FIELDS.map((field) => field.key));

  const fixedValues = SPECIFICATION_FIELDS.reduce((accumulator, field) => {
    const matchingRecord = records.find((record) => record.key === field.key);
    accumulator[field.key] = matchingRecord?.value || '';
    return accumulator;
  }, {});

  const customFields = records
    .filter((record) => !knownKeys.has(record.key))
    .map((record) => ({
      section: record.section,
      label: record.label,
      value: record.value,
    }));

  return { fixedValues, customFields };
};

export const buildSpecificationPayload = (fixedValues = {}, customFields = []) => {
  const fixedEntries = Object.entries(fixedValues || [])
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => {
      const matchingField = SPECIFICATION_FIELDS.find((field) => field.key === key);
      return {
        key,
        value: String(value).trim(),
        section: matchingField?.section || 'General',
      };
    });

  const extraEntries = (customFields || [])
    .map((field) => {
      const normalizedKey = normalizeSpecificationKey(field?.label);
      if (!normalizedKey || !field?.value?.trim()) {
        return null;
      }

      return {
        key: normalizedKey,
        value: field.value.trim(),
        section: normalizeSpecificationSection(field?.section || 'Additional Details'),
      };
    })
    .filter(Boolean);

  return [...fixedEntries, ...extraEntries];
};
