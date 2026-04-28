import logger from '@/utils/logger';

const STORAGE_KEY = 'category_navbar_group_overrides';

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readOverrides = () => {
  if (!isBrowser()) {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    logger.warn('Unable to read navbar group overrides from localStorage.', error);
    return {};
  }
};

const writeOverrides = (value) => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    logger.warn('Unable to persist navbar group overrides to localStorage.', error);
  }
};

export const applyCategoryNavbarGroupOverride = (category) => {
  if (!category) {
    return category;
  }

  if (category.navbar_group) {
    return category;
  }

  const overrides = readOverrides();
  const override = overrides[String(category.id)];

  return override ? { ...category, navbar_group: override } : category;
};

export const applyCategoryNavbarGroupOverrides = (categories = []) =>
  categories.map((category) => applyCategoryNavbarGroupOverride(category));

export const setCategoryNavbarGroupOverride = (categoryId, navbarGroup) => {
  if (!categoryId || !navbarGroup) {
    return;
  }

  const overrides = readOverrides();
  overrides[String(categoryId)] = navbarGroup;
  writeOverrides(overrides);
};

export const removeCategoryNavbarGroupOverride = (categoryId) => {
  if (!categoryId) {
    return;
  }

  const overrides = readOverrides();
  delete overrides[String(categoryId)];
  writeOverrides(overrides);
};

const categoryNavbarGroupStore = {
  applyCategoryNavbarGroupOverride,
  applyCategoryNavbarGroupOverrides,
  setCategoryNavbarGroupOverride,
  removeCategoryNavbarGroupOverride,
};

export default categoryNavbarGroupStore;
