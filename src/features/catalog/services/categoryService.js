import {
  createCategory as postCategory,
  deleteCategory as removeCategory,
  getCategories as fetchCategories,
  getCategoryById as fetchCategoryById,
  updateCategory as putCategory,
} from '@/api/categoryApi';
import { subcategoryService } from '@/features/catalog/services/subcategoryService';
import {
  applyCategoryNavbarGroupOverride,
  applyCategoryNavbarGroupOverrides,
  removeCategoryNavbarGroupOverride,
  setCategoryNavbarGroupOverride,
} from '@/store/catalog/categoryNavbarGroupStore';
import { runCatalogMutation, runServiceAction } from '@/features/catalog/services/serviceHelpers';

export const getCategories = async () =>
  runServiceAction(
    async () => applyCategoryNavbarGroupOverrides(await fetchCategories()),
    'Error fetching categories:',
  );

export const createCategory = async (data) => {
  if (data.parent) {
    return runServiceAction(
      () =>
        subcategoryService.createSubcategory({
          categoryId: data.parent,
          payload: {
            name: data.name,
            navbar_group: data.navbar_group,
          },
        }),
      'Error creating category:',
    );
  }

  return runCatalogMutation(
    () => postCategory(data),
    'Error creating category:',
    (result) => {
      if (data.navbar_group) {
        setCategoryNavbarGroupOverride(result?.id ?? result?.pk, data.navbar_group);
      }
    },
  ).then(applyCategoryNavbarGroupOverride);
};

export const getCategoryById = async (id) =>
  runServiceAction(
    async () => applyCategoryNavbarGroupOverride(await fetchCategoryById(id)),
    `Error fetching category with id ${id}:`,
  );

export const updateCategory = async (id, data) => {
  if (data.parent || data.categoryId) {
    return runServiceAction(
      () =>
        subcategoryService.updateSubcategory(id, {
          categoryId: data.parent || data.categoryId,
          payload: data,
        }),
      `Error updating category with id ${id}:`,
    );
  }

  return runCatalogMutation(
    () => putCategory(id, data),
    `Error updating category with id ${id}:`,
    (result) => {
      if (Object.prototype.hasOwnProperty.call(data, 'navbar_group')) {
        const categoryId = result?.id ?? result?.pk ?? id;
        if (data.navbar_group) {
          setCategoryNavbarGroupOverride(categoryId, data.navbar_group);
        } else {
          removeCategoryNavbarGroupOverride(categoryId);
        }
      }
    },
  ).then(applyCategoryNavbarGroupOverride);
};

export const deleteCategory = async (id, parentId = null) => {
  if (parentId) {
    return runServiceAction(
      () => subcategoryService.deleteSubcategory(id, parentId),
      `Error deleting category with id ${id}:`,
    );
  }

  return runCatalogMutation(
    () => removeCategory(id),
    `Error deleting category with id ${id}:`,
    () => {
      removeCategoryNavbarGroupOverride(id);
    },
  );
};

const getParentCategoryId = (category) =>
  category?.parent?.id ?? category?.parent_id ?? category?.parent ?? null;

const isSubcategoryMap = (value) =>
  value && typeof value === 'object' && !Array.isArray(value);

export const buildCategoryTree = (categories = [], subcategoriesByCategory = null) => {
  if (isSubcategoryMap(subcategoriesByCategory)) {
    return categories.map((category) => {
      const rawChildren = Array.isArray(subcategoriesByCategory[String(category.id)])
        ? subcategoriesByCategory[String(category.id)]
        : [];

      const childrenWithParent = rawChildren.map((child) => ({
        ...child,
        parent: category.id,
      }));

      return {
        ...category,
        parent: null,
        children: childrenWithParent,
        subcategories: childrenWithParent,
      };
    });
  }

  const nodes = categories.map((category) => {
    const parentId = getParentCategoryId(category);
    return {
      ...category,
      parent: parentId,
      children: [],
    };
  });

  const lookup = new Map();
  nodes.forEach((category) => lookup.set(String(category.id), category));

  const roots = [];

  nodes.forEach((category) => {
    if (category.parent && lookup.has(String(category.parent))) {
      const parentNode = lookup.get(String(category.parent));
      parentNode.children.push(category);
    } else {
      roots.push(category);
    }
  });

  const attachAlias = (node) => {
    node.subcategories = node.children;
    node.children.forEach(attachAlias);
    return node;
  };

  return roots.map(attachAlias);
};

const categoryService = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  buildCategoryTree,
};

export default categoryService;
