import { useEffect, useState } from 'react';
import { getCatalogData } from '@/features/catalog/services/catalogService';
import {
  createSubcategory,
  deleteSubcategory,
} from '@/features/catalog/services/subcategoryService';
import { getApiErrorMessage } from '../../../api/apiUtils';
import { showToast } from '../../../utils/helpers';
import AdminDataTable from '../components/AdminDataTable';
import CategoryModal from '../components/CategoryModal';
import AdminPageHeader from '../components/AdminPageHeader';

function AdminSubcategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSubcategoryData = async () => {
    setLoading(true);
    setError('');
    try {
      const catalogData = await getCatalogData();
      setCategories(catalogData.categories);
      setSubcategories(catalogData.subcategories);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load subcategories'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubcategoryData();
  }, []);

  const handleCreate = async (payload) => {
    setSaving(true);
    try {
      await createSubcategory({
        categoryId: payload.categoryId,
        payload: {
          name: payload.name,
        },
      });
      setModalOpen(false);
      showToast({ title: 'Subcategory created', message: `${payload.name} is now linked to its category.` });
      await loadSubcategoryData();
    } catch (err) {
      showToast({
        title: 'Unable to create subcategory',
        message: getApiErrorMessage(err, 'Subcategory creation failed'),
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (subcategory) => {
    const confirmed = window.confirm(`Delete subcategory "${subcategory.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteSubcategory(subcategory);
      showToast({ title: 'Subcategory deleted', message: `${subcategory.name} was removed.` });
      await loadSubcategoryData();
    } catch (err) {
      showToast({
        title: 'Unable to delete subcategory',
        message: getApiErrorMessage(err, 'Subcategory deletion failed'),
        type: 'error',
      });
    }
  };

  const categoryMap = new Map(categories.map((category) => [String(category.id), category]));

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-slate-500">Loading subcategories...</div>;
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <p className="text-lg font-semibold text-rose-900">Unable to load subcategories</p>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Taxonomy"
        title="Subcategories"
        description="Create subcategories directly under a specific category using the dedicated nested subcategory endpoints."
        action={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="admin-btn-primary max-sm:w-full"
          >
            Add subcategory
          </button>
        }
      />

      <AdminDataTable
        tableFixed
        columns={[
          {
            key: 'name',
            label: 'Subcategory',
            width: '40%',
            cellClassName: 'min-w-[260px]',
            render: (subcategory) => (
              <p className="font-semibold text-slate-950 leading-relaxed pr-4">{subcategory.name}</p>
            ),
          },
          {
            key: 'parent',
            label: 'Parent category',
            width: '40%',
            cellClassName: 'min-w-[260px]',
            render: (subcategory) => (
              <span className="inline-flex rounded-lg bg-slate-50 border border-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {categoryMap.get(String(subcategory.category_id))?.name || 'Unlinked'}
              </span>
            ),
          },
          {
            key: 'actions',
            label: 'Actions',
            width: '20%',
            cellClassName: 'text-right min-w-[120px]',
            render: (subcategory) => (
              <button
                type="button"
                onClick={() => handleDelete(subcategory)}
                className="admin-btn-danger !min-h-[38px] !rounded-xl !px-4 !py-1.5 !text-[11px] !font-black !uppercase"
              >
                Delete
              </button>
            ),
          },
        ]}
        rows={subcategories}
        emptyText="No subcategories available."
        minWidthClassName="min-w-[800px]"
      />

      <CategoryModal
        open={modalOpen}
        title="Create subcategory"
        description="Choose a category, then POST the new subcategory through that category's nested subcategory endpoint."
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        submitting={saving}
        categories={categories}
        requireParent
      />
    </div>
  );
}

export default AdminSubcategoriesPage;
