import { useState, useEffect } from 'react';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ category_name: '', desc: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      const payload = res.data.data || res.data || {};
      setCategories(Array.isArray(payload) ? payload : payload.categories || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, form);
      } else {
        await api.post('/categories', form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ category_name: '', desc: '' });
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save category.');
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.category_id);
    setForm({ category_name: cat.category_name, desc: cat.desc || '' });
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/categories/${deleteTarget}`);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <header className="bg-surface-container-lowest border-b border-outline-variant px-lg py-sm flex items-center justify-between z-10 shrink-0 h-20">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Category Management</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Organize your product catalog.</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ category_name: '', desc: '' }); }}
          className="bg-primary text-on-primary px-md py-2 rounded-lg font-label-md hover:bg-inverse-surface transition-colors flex items-center gap-xs">
          <span className="material-symbols-outlined text-[18px]">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancel' : 'Add Category'}
        </button>
      </header>

      <div className="flex-1 overflow-auto p-lg bg-surface">
        <div className="max-w-container-max mx-auto space-y-md">
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md space-y-sm max-w-[520px]">
              <div>
                <label className="block font-label-md text-on-surface-variant mb-1">Name</label>
                <input name="category_name" required value={form.category_name} onChange={handleChange}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md" />
              </div>
              <div>
                <label className="block font-label-md text-on-surface-variant mb-1">Description</label>
                <textarea name="desc" rows={3} value={form.desc} onChange={handleChange}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md" />
              </div>
              <button type="submit" className="bg-secondary text-on-secondary px-lg py-2 rounded-lg font-label-md">
                {editingId ? 'Update' : 'Create'}
              </button>
            </form>
          )}

          <div className="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
                  <th className="py-sm px-md font-semibold">ID</th>
                  <th className="py-sm px-md font-semibold">Name</th>
                  <th className="py-sm px-md font-semibold">Description</th>
                  <th className="py-sm px-md font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-on-surface font-body-sm text-body-sm">
                {loading ? (
                  <tr><td colSpan="4" className="py-xl text-center"><span className="material-symbols-outlined animate-spin text-[32px] text-secondary">progress_activity</span></td></tr>
                ) : categories.length === 0 ? (
                  <tr><td colSpan="4" className="py-xl text-center text-on-surface-variant">No categories found.</td></tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.category_id} className="hover:bg-secondary-container/10 transition-colors">
                      <td className="py-sm px-md font-bold">{cat.category_id}</td>
                      <td className="py-sm px-md font-semibold">{cat.category_name}</td>
                      <td className="py-sm px-md text-on-surface-variant max-w-xs truncate">{cat.desc || '—'}</td>
                      <td className="py-sm px-md text-right space-x-2">
                        <button onClick={() => handleEdit(cat)} className="text-secondary hover:underline font-label-md">Edit</button>
                        <button onClick={() => setDeleteTarget(cat.category_id)} className="text-error hover:underline font-label-md">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Category"
        message="Are you sure you want to delete this category? Products under it may be affected."
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AdminCategories;
