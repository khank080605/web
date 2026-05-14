import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Pagination (simple implementation for UI)
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Load filter options
    const loadFilters = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands')
        ]);
        const catPayload = catRes.data.data || catRes.data || {};
        const brandPayload = brandRes.data.data || brandRes.data || {};
        setCategories(Array.isArray(catPayload) ? catPayload : catPayload.categories || []);
        setBrands(Array.isArray(brandPayload) ? brandPayload : brandPayload.brands || []);
      } catch (err) { console.error(err); }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, searchTerm, filterCategory, filterBrand]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (searchTerm) params.q = searchTerm;
      if (filterCategory) params.category_id = filterCategory;
      if (filterBrand) params.brand_id = filterBrand;
      const res = await api.get('/products', { params });
      const responseData = res.data.data || {};
      setProducts(responseData.products || []);
      setTotalPages(responseData.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/products/${deleteTarget}`);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product.');
      console.error(err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Top Toolbar */}
      <header className="bg-surface-container-lowest border-b border-outline-variant px-lg py-sm flex items-center justify-between z-10 shrink-0 h-20">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Product Management</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Manage your eyewear inventory, stock levels, and pricing.</p>
        </div>
        <Link to="/admin/products/new" className="bg-primary hover:bg-inverse-surface text-on-primary font-label-md text-label-md px-md py-sm rounded flex items-center gap-xs transition-colors shadow-sm">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add New Product
        </Link>
      </header>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-auto p-lg bg-surface">
        <div className="max-w-container-max mx-auto space-y-md">
          
          {/* Search & Filters Bar */}
          <div className="bg-surface-container-lowest p-sm rounded border border-outline-variant flex flex-col md:flex-row gap-sm items-center shadow-sm">
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">search</span>
              <input 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full pl-xl pr-sm py-2 bg-surface border border-outline-variant rounded focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all font-body-sm text-body-sm text-on-surface outline-none" 
                placeholder="Search products by name..." 
                type="text"
              />
            </div>
            <div className="flex gap-sm w-full md:w-auto">
              <select 
                value={filterCategory} 
                onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                className="bg-surface border border-outline-variant rounded px-sm py-2 font-body-sm text-body-sm text-on-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none w-full md:w-40 appearance-none"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
              </select>
              <select 
                value={filterBrand} 
                onChange={(e) => { setFilterBrand(e.target.value); setPage(1); }}
                className="bg-surface border border-outline-variant rounded px-sm py-2 font-body-sm text-body-sm text-on-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none w-full md:w-40 appearance-none"
              >
                <option value="">All Brands</option>
                {brands.map(b => <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>)}
              </select>
            </div>
          </div>

          {/* Data Table Container */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
                    <th className="py-sm px-md font-semibold w-16">Image</th>
                    <th className="py-sm px-md font-semibold">Name</th>
                    <th className="py-sm px-md font-semibold">Brand</th>
                    <th className="py-sm px-md font-semibold">Category</th>
                    <th className="py-sm px-md font-semibold text-right">Base Price</th>
                    <th className="py-sm px-md font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-on-surface font-body-sm text-body-sm">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-xl text-center">
                        <span className="material-symbols-outlined animate-spin text-[32px] text-secondary">progress_activity</span>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-xl text-center text-on-surface-variant">
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.product_id} className="hover:bg-secondary-container/20 transition-colors group">
                        <td className="py-sm px-md">
                          <div className="w-12 h-12 bg-surface rounded border border-outline-variant overflow-hidden flex items-center justify-center">
                            <img 
                              alt={product.product_name} 
                              className="w-full h-full object-cover" 
                              src={product.variants?.[0]?.image?.startsWith('http') ? product.variants[0].image : `http://localhost:3000/uploads/${product.variants?.[0]?.image || 'placeholder.jpg'}`}
                              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=100' }}
                            />
                          </div>
                        </td>
                        <td className="py-sm px-md">
                          <div className="font-semibold text-on-surface">{product.product_name}</div>
                          <div className="text-on-surface-variant text-[12px] mt-1">ID: {product.product_id}</div>
                        </td>
                        <td className="py-sm px-md text-on-surface-variant">{product.brand?.brand_name || product.brand_name || 'N/A'}</td>
                        <td className="py-sm px-md">
                          <span className="inline-flex items-center px-2 py-1 rounded bg-surface border border-outline-variant text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                          {product.category?.category_name || product.category_name || 'N/A'}
                          </span>
                        </td>
                        <td className="py-sm px-md text-right font-medium">
                          {formatPrice(product.variants?.[0]?.price || 0)}
                        </td>
                        <td className="py-sm px-md text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link to={`/admin/products/${product.product_id}/edit`} className="text-secondary hover:text-on-secondary-container p-1 transition-colors" title="Edit">
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </Link>
                            <button onClick={() => setDeleteTarget(product.product_id)} className="text-error hover:text-on-error-container p-1 transition-colors" title="Delete">
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="border-t border-outline-variant bg-surface-container-lowest p-sm flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
              <div>Page {page} of {totalPages || 1}</div>
              <div className="flex items-center gap-2">
                <button 
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-1 border border-outline-variant rounded hover:bg-surface disabled:opacity-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button 
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-1 border border-outline-variant rounded hover:bg-surface disabled:opacity-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AdminProducts;
