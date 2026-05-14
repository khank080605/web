import { useState, useEffect } from 'react';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';

const AdminDiscounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ type_discount: 'Percent', discount_value: '', start_date: '', end_date: '', discount_number: '', desc: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Product attach/detach state
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [attachProductId, setAttachProductId] = useState('');
  const [allProducts, setAllProducts] = useState([]);

  // ── fetch discounts ──────────────────────────────────────────
  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/discounts');
      const payload = res.data.data || res.data || {};
      setDiscounts(Array.isArray(payload) ? payload : payload.discounts || []);
    } catch (err) {
      console.error('Failed to load discounts', err);
    } finally {
      setLoading(false);
    }
  };

  // ── fetch all products for attach dropdown ───────────────────
  const fetchAllProducts = async () => {
    try {
      const res = await api.get('/products', { params: { limit: 200 } });
      const data = res.data.data || res.data || {};
      setAllProducts(Array.isArray(data) ? data : data.products || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchDiscounts();
    fetchAllProducts();
  }, []);

  // ── form handlers ────────────────────────────────────────────
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm({ type_discount: 'Percent', discount_value: '', start_date: '', end_date: '', discount_number: '', desc: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        discount_value: Number(form.discount_value),
        discount_number: form.discount_number ? Number(form.discount_number) : null,
      };
      if (editingId) {
        await api.put(`/discounts/${editingId}`, payload);
      } else {
        await api.post('/discounts', payload);
      }
      resetForm();
      fetchDiscounts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save discount.');
    }
  };

  const handleEdit = (d) => {
    setEditingId(d.discount_id);
    setForm({
      type_discount: d.type_discount || 'Percent',
      discount_value: d.discount_value || '',
      start_date: d.start_date ? d.start_date.slice(0, 10) : '',
      end_date: d.end_date ? d.end_date.slice(0, 10) : '',
      discount_number: d.discount_number || '',
      desc: d.desc || ''
    });
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/discounts/${deleteTarget}`);
      fetchDiscounts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete discount.');
    } finally {
      setDeleteTarget(null);
    }
  };

  // ── Manage Products Modal ────────────────────────────────────
  const openManageProducts = async (discount) => {
    setSelectedDiscount(discount);
    setProductsLoading(true);
    try {
      const res = await api.get(`/discounts/${discount.discount_id}`);
      const data = res.data.data || res.data || {};
      setProducts(data.products || []);
    } catch (err) {
      console.error('Failed to load discount products', err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleAttachProduct = async () => {
    if (!attachProductId) return;
    try {
      await api.post(`/discounts/${selectedDiscount.discount_id}/products/${attachProductId}`);
      await openManageProducts(selectedDiscount);
      setAttachProductId('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to attach product.');
    }
  };

  const handleDetachProduct = async (productId) => {
    try {
      await api.delete(`/discounts/${selectedDiscount.discount_id}/products/${productId}`);
      setProducts(prev => prev.filter(p => p.product_id !== productId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to detach product.');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const formatValue = (d) => {
    if (d.type_discount === 'Percent') return `${d.discount_value}%`;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(d.discount_value);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <header className="bg-surface-container-lowest border-b border-outline-variant px-lg py-sm flex items-center justify-between z-10 shrink-0 h-20">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Discount Management</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Create and manage promotional discounts.</p>
        </div>
        <button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="bg-primary text-on-primary px-md py-2 rounded-lg font-label-md hover:bg-inverse-surface transition-colors flex items-center gap-xs">
          <span className="material-symbols-outlined text-[18px]">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancel' : 'Add Discount'}
        </button>
      </header>

      <div className="flex-1 overflow-auto p-lg bg-surface">
        <div className="max-w-container-max mx-auto space-y-md">
          {/* Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md space-y-sm max-w-[600px]">
              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label className="block font-label-md text-on-surface-variant mb-1">Type</label>
                  <select name="type_discount" required value={form.type_discount} onChange={handleChange}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md">
                    <option value="Percent">Percent (%)</option>
                    <option value="Fixed">Fixed (VND)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-md text-on-surface-variant mb-1">
                    Value {form.type_discount === 'Percent' ? '(%)' : '(VND)'}
                  </label>
                  <input name="discount_value" type="number" min="1" required value={form.discount_value} onChange={handleChange}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md" placeholder={form.type_discount === 'Percent' ? '25' : '100000'} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label className="block font-label-md text-on-surface-variant mb-1">Start Date</label>
                  <input name="start_date" type="date" required value={form.start_date} onChange={handleChange}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md" />
                </div>
                <div>
                  <label className="block font-label-md text-on-surface-variant mb-1">End Date</label>
                  <input name="end_date" type="date" required value={form.end_date} onChange={handleChange}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label className="block font-label-md text-on-surface-variant mb-1">Quantity (optional)</label>
                  <input name="discount_number" type="number" min="0" value={form.discount_number} onChange={handleChange}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md" placeholder="Leave empty for unlimited" />
                </div>
                <div>
                  <label className="block font-label-md text-on-surface-variant mb-1">Description</label>
                  <input name="desc" value={form.desc} onChange={handleChange}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md" placeholder="Summer sale" />
                </div>
              </div>
              <button type="submit" className="bg-secondary text-on-secondary px-lg py-2 rounded-lg font-label-md">
                {editingId ? 'Update' : 'Create'}
              </button>
            </form>
          )}

          {/* Table */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
                    <th className="py-sm px-md font-semibold">ID</th>
                    <th className="py-sm px-md font-semibold">Type</th>
                    <th className="py-sm px-md font-semibold">Value</th>
                    <th className="py-sm px-md font-semibold">Start</th>
                    <th className="py-sm px-md font-semibold">End</th>
                    <th className="py-sm px-md font-semibold">Status</th>
                    <th className="py-sm px-md font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-on-surface font-body-sm text-body-sm">
                  {loading ? (
                    <tr><td colSpan="7" className="py-xl text-center">
                      <span className="material-symbols-outlined animate-spin text-[32px] text-secondary">progress_activity</span>
                    </td></tr>
                  ) : discounts.length === 0 ? (
                    <tr><td colSpan="7" className="py-xl text-center text-on-surface-variant">No discounts found.</td></tr>
                  ) : discounts.map((d) => (
                    <tr key={d.discount_id} className="hover:bg-secondary-container/10 transition-colors">
                      <td className="py-sm px-md font-bold">{d.discount_id}</td>
                      <td className="py-sm px-md">
                        <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded font-bold text-xs">{d.type_discount}</span>
                      </td>
                      <td className="py-sm px-md font-semibold">{formatValue(d)}</td>
                      <td className="py-sm px-md text-on-surface-variant">{formatDate(d.start_date)}</td>
                      <td className="py-sm px-md text-on-surface-variant">{formatDate(d.end_date)}</td>
                      <td className="py-sm px-md">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${d.is_active ? 'bg-[#10B981]/20 text-[#047857]' : 'bg-error-container text-on-error-container'}`}>
                          {d.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-sm px-md text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openManageProducts(d)}
                            className="text-on-surface-variant hover:text-secondary transition-colors p-1" title="Manage Products">
                            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                          </button>
                          <button onClick={() => handleEdit(d)} className="text-secondary hover:underline font-label-md">Edit</button>
                          <button onClick={() => setDeleteTarget(d.discount_id)} className="text-error hover:underline font-label-md">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Manage Products Modal */}
      {selectedDiscount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-md">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl w-full max-w-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-md border-b border-outline-variant sticky top-0 bg-surface-container-lowest">
              <div>
                <h3 className="font-headline-sm text-on-surface">Products for <span className="text-secondary">{selectedDiscount.type_discount} {formatValue(selectedDiscount)}</span></h3>
                <p className="font-body-sm text-on-surface-variant">Discount #{selectedDiscount.discount_id}</p>
              </div>
              <button onClick={() => setSelectedDiscount(null)} className="p-1 rounded-full hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-md space-y-md">
              {/* Attach Product */}
              <div className="flex gap-sm items-end">
                <div className="flex-1">
                  <label className="block font-label-md text-on-surface-variant mb-1">Attach Product</label>
                  <select value={attachProductId} onChange={(e) => setAttachProductId(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md focus:border-secondary focus:ring-1 focus:ring-secondary text-body-sm">
                    <option value="">Select a product...</option>
                    {allProducts
                      .filter(p => !products.some(ap => ap.product_id === p.product_id))
                      .map(p => (
                        <option key={p.product_id} value={p.product_id}>{p.product_name}</option>
                      ))}
                  </select>
                </div>
                <button onClick={handleAttachProduct} disabled={!attachProductId}
                  className="bg-secondary text-on-secondary px-md py-2 rounded-lg font-label-md disabled:opacity-50 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">add_link</span>
                  Attach
                </button>
              </div>

              {/* Attached Products List */}
              {productsLoading ? (
                <div className="flex justify-center py-md">
                  <span className="material-symbols-outlined animate-spin text-[28px] text-secondary">progress_activity</span>
                </div>
              ) : products.length === 0 ? (
                <p className="text-center text-on-surface-variant py-md">No products attached to this discount.</p>
              ) : (
                <div className="space-y-xs">
                  {products.map((p) => (
                    <div key={p.product_id} className="flex items-center justify-between bg-surface-container p-sm rounded-lg">
                      <div>
                        <p className="font-semibold text-body-sm text-on-surface">{p.product_name}</p>
                        <p className="text-xs text-on-surface-variant">ID: {p.product_id}</p>
                      </div>
                      <button onClick={() => handleDetachProduct(p.product_id)}
                        className="text-error hover:bg-error-container p-1 rounded transition-colors" title="Remove">
                        <span className="material-symbols-outlined text-[18px]">link_off</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Deactivate Discount"
        message="Are you sure you want to deactivate this discount?"
        confirmText="Deactivate"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AdminDiscounts;
