import { useEffect, useState } from 'react';
import AdminModal from './AdminModal';
import { getTopLevelCategories } from '../utils/adminUtils';
import { NAVBAR_GROUPS } from '../../../utils/constants';

function CategoryModal({
  open,
  title,
  description,
  onClose,
  onSubmit,
  submitting,
  categories = [],
  requireParent = false,
}) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [navbarGroup, setNavbarGroup] = useState(NAVBAR_GROUPS[0]);

  useEffect(() => {
    if (open) {
      setName('');
      setParentId('');
      setNavbarGroup(NAVBAR_GROUPS[0]);
    }
  }, [open]);

  const topLevelCategories = getTopLevelCategories(categories);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }

    onSubmit({
      ...(requireParent
        ? {
            categoryId: parentId,
            name: name.trim(),
          }
        : {
            name: name.trim(),
            navbar_group: navbarGroup,
          }),
    });
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="md"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="admin-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="admin-category-form"
            disabled={submitting || (requireParent && !parentId)}
            className="admin-btn-primary"
          >
            {submitting ? 'Saving...' : requireParent ? 'Create subcategory' : 'Create category'}
          </button>
        </div>
      }
    >
      <form id="admin-category-form" onSubmit={handleSubmit} className="space-y-5">
        {requireParent ? (
          <div className="field-stack">
            <label className="text-sm font-semibold text-slate-700" htmlFor="admin-parent-category">
              Parent category
            </label>
            <select
              id="admin-parent-category"
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
              className="admin-control"
              required
            >
              <option value="">Select a category</option>
              {topLevelCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {!requireParent ? (
          <div className="field-stack">
            <label className="text-sm font-semibold text-slate-700" htmlFor="admin-navbar-group">
              Navbar group
            </label>
            <select
              id="admin-navbar-group"
              value={navbarGroup}
              onChange={(event) => setNavbarGroup(event.target.value)}
              className="admin-control"
              required
            >
              {NAVBAR_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="field-stack">
          <label className="text-sm font-semibold text-slate-700" htmlFor="admin-category-name">
            {requireParent ? 'Subcategory name' : 'Category name'}
          </label>
          <input
            id="admin-category-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={requireParent ? 'Example: Workstations' : 'Example: Enterprise'}
            className="admin-control"
            required
          />
        </div>
      </form>
    </AdminModal>
  );
}

export default CategoryModal;
