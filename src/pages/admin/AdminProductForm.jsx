import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';

const AdminProductForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  
  const [formData, setFormData] = useState({
    product_name: '',
    category_id: '',
    brand_id: '',
    desc: '',
    shape: '',
    material: '',
    variants: [
      { color: '', price: '', stock_quantity: '', image: '' }
    ]
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch categories and brands
    const fetchSelectData = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands')
        ]);
        const catPayload = catRes.data.data || catRes.data || {};
        const brandPayload = brandRes.data.data || brandRes.data || {};
        setCategories(Array.isArray(catPayload) ? catPayload : catPayload.categories || []);
        const allBrands = Array.isArray(brandPayload) ? brandPayload : brandPayload.brands || [];
        // Filter out placeholder/test brands
        setBrands(allBrands.filter(b => b.brand_name && !b.brand_name.toLowerCase().includes('brand mới')));
      } catch (err) {
        console.error('Failed to load categories/brands', err);
      }
    };

    fetchSelectData();

    if (isEdit) {
      // Fetch product details
      const fetchProduct = async () => {
        try {
          const res = await api.get(`/products/${id}`);
          const p = res.data.data || res.data || {};
          setFormData({
            product_name: p.product_name || '',
            category_id: p.category_id || '',
            brand_id: p.brand_id || '',
            desc: p.desc || '',
            shape: p.shape || '',
            material: p.material || '',
            variants: p.variants && p.variants.length > 0
              ? p.variants.map(v => ({ ...v, image: v.image || '', _existing: true }))
              : [{ color: '', price: '', stock_quantity: '', image: '' }]
          });
        } catch (err) {
          console.error(err);
          setError('Failed to load product details');
        }
      };
      fetchProduct();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (index, e) => {
    const { name, value } = e.target;
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [name]: value };
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { color: '', price: '', stock_quantity: '', image: '' }]
    }));
  };

  const removeVariant = async (index) => {
    if (formData.variants.length <= 1) return;
    const variant = formData.variants[index];
    // If it's an existing variant in DB, call delete API
    if (isEdit && variant.variant_id) {
      try {
        await api.delete(`/products/${id}/variants/${variant.variant_id}`);
      } catch (err) {
        alert(err.response?.data?.message || 'Could not delete variant.');
        return;
      }
    }
    const newVariants = formData.variants.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Need to format variants to correct data types
      const payload = {
        ...formData,
        variants: formData.variants.map(v => ({
          ...v,
          price: Number(v.price),
          stock_quantity: Number(v.stock_quantity),
          image: v.image || 'placeholder.jpg'
        }))
      };

      if (isEdit) {
        await api.put(`/products/${id}`, payload);
        alert('Product updated successfully');
      } else {
        await api.post('/products', payload);
        alert('Product created successfully');
      }
      navigate('/admin/products');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-auto">
      <header className="bg-surface-container-lowest border-b border-outline-variant px-lg py-sm flex items-center justify-between z-10 shrink-0 h-20 sticky top-0">
        <div className="flex items-center gap-md">
          <Link to="/admin/products" className="p-xs text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          </div>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="bg-primary hover:bg-inverse-surface text-on-primary font-label-md text-label-md px-lg py-sm rounded transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Product'}
        </button>
      </header>

      <div className="p-lg max-w-4xl mx-auto w-full">
        {error && <div className="bg-error-container text-on-error-container p-md rounded-lg mb-md">{error}</div>}
        
        <form className="space-y-lg">
          {/* Basic Info */}
          <section className="bg-surface-container-lowest border border-outline-variant p-md rounded-xl space-y-md shadow-sm">
            <h3 className="font-headline-sm text-on-surface border-b border-outline-variant pb-xs">Basic Information</h3>
            
            <div>
              <label className="block font-label-md text-on-surface-variant mb-1">Product Name *</label>
              <input required type="text" name="product_name" value={formData.product_name} onChange={handleChange} className="w-full px-3 py-2 bg-surface border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label className="block font-label-md text-on-surface-variant mb-1">Category *</label>
                <select required name="category_id" value={formData.category_id} onChange={handleChange} className="w-full px-3 py-2 bg-surface border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md appearance-none">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-label-md text-on-surface-variant mb-1">Brand *</label>
                <select required name="brand_id" value={formData.brand_id} onChange={handleChange} className="w-full px-3 py-2 bg-surface border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md appearance-none">
                  <option value="">Select Brand</option>
                  {brands.map(b => <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-label-md text-on-surface-variant mb-1">Description</label>
              <textarea name="desc" value={formData.desc} onChange={handleChange} rows="4" className="w-full px-3 py-2 bg-surface border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label className="block font-label-md text-on-surface-variant mb-1">Shape</label>
                <input type="text" name="shape" value={formData.shape} onChange={handleChange} className="w-full px-3 py-2 bg-surface border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md" placeholder="e.g. Round, Square, Aviator" />
              </div>
              <div>
                <label className="block font-label-md text-on-surface-variant mb-1">Material</label>
                <input type="text" name="material" value={formData.material} onChange={handleChange} className="w-full px-3 py-2 bg-surface border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md" placeholder="e.g. Metal, Acetate" />
              </div>
            </div>
          </section>

          {/* Variants */}
          <section className="bg-surface-container-lowest border border-outline-variant p-md rounded-xl space-y-md shadow-sm">
            <div className="flex justify-between items-center border-b border-outline-variant pb-xs">
              <h3 className="font-headline-sm text-on-surface">Variants</h3>
              <button type="button" onClick={addVariant} className="text-secondary font-label-md flex items-center gap-1 hover:underline">
                <span className="material-symbols-outlined text-[16px]">add</span> Add Variant
              </button>
            </div>

            {formData.variants.map((variant, index) => (
              <div key={index} className="p-sm border border-outline-variant rounded-lg bg-surface relative">
                {formData.variants.length > 1 && (
                  <button type="button" onClick={() => removeVariant(index)} className="absolute top-2 right-2 text-error hover:bg-error-container p-1 rounded transition-colors">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-sm pr-8">
                  <div>
                    <label className="block font-label-md text-on-surface-variant mb-1">Color/Style *</label>
                    <input required type="text" name="color" value={variant.color} onChange={(e) => handleVariantChange(index, e)} className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md" placeholder="e.g. Matte Black" />
                  </div>
                  <div>
                    <label className="block font-label-md text-on-surface-variant mb-1">Image URL *</label>
                    <input required type="text" name="image" value={variant.image || ''} onChange={(e) => handleVariantChange(index, e)} className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md" placeholder="e.g. https://example.com/img.jpg" />
                  </div>
                  <div>
                    <label className="block font-label-md text-on-surface-variant mb-1">Price (VND) *</label>
                    <input required type="number" name="price" value={variant.price} onChange={(e) => handleVariantChange(index, e)} className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md" />
                  </div>
                  <div>
                    <label className="block font-label-md text-on-surface-variant mb-1">Stock Quantity *</label>
                    <input required type="number" name="stock_quantity" value={variant.stock_quantity} onChange={(e) => handleVariantChange(index, e)} className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md" />
                  </div>
                </div>
              </div>
            ))}
          </section>
        </form>
      </div>
    </div>
  );
};

export default AdminProductForm;
