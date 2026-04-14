import { useEffect, useState } from 'react';
import { createCategory, deleteCategory } from '@/features/catalog/services/categoryService';
import { getCatalogData } from '@/features/catalog/services/catalogService';
import { getApiErrorMessage } from '../../../api/apiUtils';
import { showToast } from '../../../utils/helpers';
import AdminDataTable from '../components/AdminDataTable';
import CategoryModal from '../components/CategoryModal';
import AdminPageHeader from '../components/AdminPageHeader';

function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [subcategoriesByCategory, setSubcategoriesByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const catalogData = await getCatalogData();
      setCategories(catalogData.categories);
      setSubcategoriesByCategory(catalogData.subcategoriesByCategory);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load categories'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async (payload) => {
    setSaving(true);
    try {
      await createCategory(payload);
      setModalOpen(false);
      showToast({ title: 'Category created', message: `${payload.name} was added successfully.` });
      await loadCategories();
    } catch (err) {
      showToast({
        title: 'Unable to create category',
        message: getApiErrorMessage(err, 'Category creation failed'),
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(`Delete category "${category.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteCategory(category.id);
      showToast({ title: 'Category deleted', message: `${category.name} was removed.` });
      await loadCategories();
    } catch (err) {
      showToast({
        title: 'Unable to delete category',
        message: getApiErrorMessage(err, 'Category deletion failed'),
        type: 'error',
      });
    }
  };

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-slate-500">Loading categories...</div>;
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <p className="text-lg font-semibold text-rose-900">Unable to load categories</p>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Taxonomy"
        title="Categories"
        description="Manage top-level catalog groupings and assign each category to the correct navbar section."
        action={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="admin-btn-primary max-sm:w-full"
          >
            Add category
          </button>
        }
      />

      <AdminDataTable
        tableFixed
        columns={[
          {
            key: 'name',
            label: 'Category',
            width: '30%',
            cellClassName: 'min-w-[240px]',
            render: (category) => (
              <div className="min-w-0 pr-4">
                <p className="font-semibold text-slate-950 leading-relaxed">{category.name}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {(subcategoriesByCategory[String(category.id)] || []).length} linked subcategories
                </p>
              </div>
            ),
          },
          {
            key: 'group',
            label: 'Navbar placement',
            width: '20%',
            cellClassName: 'min-w-[180px]',
            render: (category) => (
              <span className="inline-flex rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1.5 text-[11px] font-black uppercase tracking-widest text-primary">
                {category.navbar_group || 'Unassigned'}
              </span>
            ),
          },
          {
            key: 'children',
            label: 'Active Subcategories',
            width: '35%',
            cellClassName: 'min-w-[260px]',
            render: (category) => {
              const linked = subcategoriesByCategory[String(category.id)] || [];
              return (
                <p className="text-xs leading-relaxed text-slate-500 italic">
                  {linked.length ? linked.map((item) => item.name).join(', ') : 'No subcategories linked'}
                </p>
              );
            },
          },
          {
            key: 'actions',
            label: 'Actions',
            width: '15%',
            cellClassName: 'text-right min-w-[120px]',
            render: (category) => (
              <button
                type="button"
                onClick={() => handleDelete(category)}
                className="admin-btn-danger !min-h-[38px] !rounded-xl !px-4 !py-1.5 !text-[11px] !font-black !uppercase"
              >
                Delete
              </button>
            ),
          },
        ]}
        rows={categories}
        emptyText="No categories available."
        minWidthClassName="min-w-[1000px]"
      />

      <CategoryModal
        open={modalOpen}
        title="Create category"
        description="Create a top-level category and place it under one of the six fixed navbar groups."
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        submitting={saving}
      />
    </div>
  );
}

export default AdminCategoriesPage;
