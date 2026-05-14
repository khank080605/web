import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { resolveColor } from '../utils/colorConfig';
import VirtualTryOnModal from '../components/try-on/VirtualTryOnModal';

const ProductDetail = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGlasses, setSelectedGlasses] = useState(null);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [lensType, setLensType] = useState('single');
  // Live review stats — updated by ReviewsSection
  const [reviewStats, setReviewStats] = useState({ avg: 0, count: 0 });
  
  // Calculate price based on lens type (example pricing)
  const lensPriceMap = {
    single: 0,
    progressive: 1000000,
    non_prescription: 0
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const [productRes, relatedRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/products/${id}/related?limit=4`).catch(() => ({ data: [] })) // Fallback if related API fails
        ]);
        
        const prodData = productRes.data.data || productRes.data;
        setProduct(prodData);
        if (prodData.variants && prodData.variants.length > 0) {
          setSelectedVariant(prodData.variants[0]);
        }
        
        const relData = relatedRes.data.data || relatedRes.data || {};
        setRelatedProducts(relData.products || relData || []);
      } catch (err) {
        setError('Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    
    // Total price is base variant price + lens price
    const finalPrice = selectedVariant.price + lensPriceMap[lensType];
    
    addItem({
      variant_id: selectedVariant.variant_id,
      product_id: product.product_id,
      product_name: product.product_name,
      color: selectedVariant.color,
      image: selectedVariant.image,
      price: finalPrice,
      quantity: 1,
      lensType
    });
    
    alert('Added to cart successfully!');
  };

  const openTryOn = (glasses, variant = null) => {
    setSelectedGlasses({
      ...glasses,
      selectedVariant: variant || glasses?.selectedVariant || glasses?.variants?.[0] || null,
    });
    setIsTryOnOpen(true);
  };

  const closeTryOn = () => {
    setIsTryOnOpen(false);
    setSelectedGlasses(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-xl min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-[40px] text-secondary">progress_activity</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-xl">
        <div className="bg-error-container text-on-error-container p-lg rounded-xl text-center">
          {error || 'Product not found.'}
        </div>
        <div className="mt-md text-center">
          <Link to="/products" className="text-secondary hover:underline">Return to Products</Link>
        </div>
      </div>
    );
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const finalPrice = selectedVariant ? selectedVariant.price + lensPriceMap[lensType] : 0;
  const imageSrc = selectedVariant?.image?.startsWith('http') ? selectedVariant.image : `http://localhost:3000/uploads/${selectedVariant?.image}`;

  return (
    <div className="py-lg">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl px-lg py-md mb-lg">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Products', to: '/products' },
            { label: product.product_name },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
        {/* Product Images Gallery */}
        <section className="lg:col-span-7 flex flex-col gap-sm">
          {/* Main Image */}
          <div className="w-full bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden aspect-[4/3] flex items-center justify-center relative">
            <img 
              alt={product.product_name} 
              className="w-full h-full object-contain p-md" 
              src={imageSrc}
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=800' }}
            />
            {/* Virtual Try-On Floating CTA */}
            <button
              type="button"
              onClick={() => openTryOn(product, selectedVariant)}
              className="absolute bottom-md right-md bg-white border border-outline-variant text-primary font-label-md text-label-md px-sm py-xs rounded-full shadow-md hover:border-secondary hover:text-secondary transition-all flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-[18px]">face</span>
              Virtual Try-On
            </button>
          </div>
          
          {/* Thumbnails (Mocked since we only have 1 image per variant usually, but showing variant images here) */}
          {product.variants && product.variants.length > 1 && (
            <div className="grid grid-cols-4 gap-sm">
              {product.variants.map((variant) => (
                <button 
                  key={variant.variant_id}
                  onClick={() => setSelectedVariant(variant)}
                  className={`aspect-square bg-surface-container-lowest rounded-lg border overflow-hidden ${selectedVariant?.variant_id === variant.variant_id ? 'border-2 border-secondary' : 'border-outline-variant hover:border-secondary opacity-70 hover:opacity-100'} transition-colors`}
                >
                  <img 
                    alt={`${product.product_name} in ${variant.color}`} 
                    className="w-full h-full object-contain p-xs" 
                    src={variant.image?.startsWith('http') ? variant.image : `http://localhost:3000/uploads/${variant.image}`}
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=200' }}
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Product Details & Configuration */}
        <section className="lg:col-span-5 flex flex-col gap-lg">
          {/* Header & Price */}
          <div className="flex flex-col gap-xs border-b border-outline-variant pb-md">
            <h1 className="font-headline-lg text-headline-lg text-on-background">{product.product_name}</h1>
            <div className="flex items-center justify-between">
              <span className="font-headline-md text-headline-md text-primary">{formatPrice(finalPrice)}</span>
              <div className="flex items-center gap-1 text-secondary">
                {reviewStats.count > 0 ? (
                  <>
                    {[1,2,3,4,5].map(star => (
                      <span key={star} className="material-symbols-outlined text-[18px]"
                        style={{ fontVariationSettings: star <= Math.round(reviewStats.avg) ? "'FILL' 1" : "'FILL' 0" }}>
                        star
                      </span>
                    ))}
                    <a className="font-body-sm text-body-sm text-on-surface-variant ml-2 hover:underline" href="#reviews">
                      {reviewStats.avg.toFixed(1)} ({reviewStats.count} review{reviewStats.count !== 1 ? 's' : ''})
                    </a>
                  </>
                ) : (
                  <>
                    {[1,2,3,4,5].map(star => (
                      <span key={star} className="material-symbols-outlined text-[18px] text-outline-variant"
                        style={{ fontVariationSettings: "'FILL' 0" }}>star</span>
                    ))}
                    <span className="font-body-sm text-body-sm text-on-surface-variant ml-2">No reviews yet</span>
                  </>
                )}
              </div>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              {product.desc || 'Premium eyewear crafted for modern life.'}
            </p>
          </div>

          {/* Frame Specs */}
          <div className="grid grid-cols-2 gap-sm bg-surface-container-low p-md rounded-lg border border-outline-variant">
            <div>
              <span className="font-label-md text-label-md text-on-surface-variant uppercase block mb-1">Material</span>
              <span className="font-body-md text-body-md text-on-background font-medium">{product.material || 'N/A'}</span>
            </div>
            <div>
              <span className="font-label-md text-label-md text-on-surface-variant uppercase block mb-1">Shape</span>
              <span className="font-body-md text-body-md text-on-background font-medium">{product.shape || 'N/A'}</span>
            </div>
            <div>
              <span className="font-label-md text-label-md text-on-surface-variant uppercase block mb-1">Brand</span>
              <span className="font-body-md text-body-md text-on-background font-medium">
                {product.brand?.brand_name || product.brand_name || 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-label-md text-label-md text-on-surface-variant uppercase block mb-1">Category</span>
              <span className="font-body-md text-body-md text-on-background font-medium">
                {product.category?.category_name || product.category_name || 'N/A'}
              </span>
            </div>
          </div>

          {/* Color Selection */}
          <div className="flex flex-col gap-sm">
            <div className="flex justify-between items-end">
              <label className="font-label-md text-label-md text-on-background uppercase">
                Frame Color: <span className="font-normal text-on-surface-variant ml-1">{selectedVariant?.color}</span>
              </label>
              {selectedVariant?.stock_quantity < 10 && selectedVariant?.stock_quantity > 0 && (
                 <span className="text-xs text-error">Only {selectedVariant.stock_quantity} left!</span>
              )}
              {selectedVariant?.stock_quantity === 0 && (
                 <span className="text-xs text-error">Out of Stock</span>
              )}
            </div>
            <div className="flex gap-sm">
              {product.variants?.map((variant) => (
                <button 
                  key={variant.variant_id}
                  onClick={() => setSelectedVariant(variant)}
                  aria-label={`Select ${variant.color}`} 
                  title={variant.color}
                  // Color comes from config_color asset (with fallbacks)
                  className={`w-10 h-10 rounded-full border-2 ${selectedVariant?.variant_id === variant.variant_id ? 'border-secondary' : 'border-outline-variant'} ring-2 ring-transparent ring-offset-2 hover:ring-outline-variant transition-all focus:outline-none`}
                  style={{ backgroundColor: resolveColor(variant.color) }}
                ></button>
              ))}
            </div>
          </div>

          {/* Lens Selection */}
          <div className="flex flex-col gap-sm">
            <label className="font-label-md text-label-md text-on-background uppercase">Lens Type</label>
            <div className="flex flex-col gap-2">
              <label className={`flex items-center justify-between p-sm border rounded-lg cursor-pointer transition-colors ${lensType === 'single' ? 'border-secondary bg-surface-container-low' : 'border-outline-variant bg-surface-container-lowest hover:border-secondary hover:bg-surface-container-low'}`}>
                <div className="flex items-center gap-sm">
                  <input 
                    type="radio" 
                    name="lens_type" 
                    value="single" 
                    checked={lensType === 'single'} 
                    onChange={() => setLensType('single')}
                    className="text-secondary focus:ring-secondary w-4 h-4 border-outline-variant"
                  />
                  <div>
                    <span className="font-body-md text-body-md text-on-background block font-medium">Single Vision</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">For distance or reading</span>
                  </div>
                </div>
                <span className="font-body-md text-body-md font-semibold text-primary">Included</span>
              </label>
              
              <label className={`flex items-center justify-between p-sm border rounded-lg cursor-pointer transition-colors ${lensType === 'progressive' ? 'border-secondary bg-surface-container-low' : 'border-outline-variant bg-surface-container-lowest hover:border-secondary hover:bg-surface-container-low'}`}>
                <div className="flex items-center gap-sm">
                  <input 
                    type="radio" 
                    name="lens_type" 
                    value="progressive" 
                    checked={lensType === 'progressive'} 
                    onChange={() => setLensType('progressive')}
                    className="text-secondary focus:ring-secondary w-4 h-4 border-outline-variant"
                  />
                  <div>
                    <span className="font-body-md text-body-md text-on-background block font-medium">Progressive</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Multifocal without lines</span>
                  </div>
                </div>
                <span className="font-body-md text-body-md font-semibold text-primary">{formatPrice(lensPriceMap.progressive)}</span>
              </label>
              
              <label className={`flex items-center justify-between p-sm border rounded-lg cursor-pointer transition-colors ${lensType === 'non_prescription' ? 'border-secondary bg-surface-container-low' : 'border-outline-variant bg-surface-container-lowest hover:border-secondary hover:bg-surface-container-low'}`}>
                <div className="flex items-center gap-sm">
                  <input 
                    type="radio" 
                    name="lens_type" 
                    value="non_prescription" 
                    checked={lensType === 'non_prescription'} 
                    onChange={() => setLensType('non_prescription')}
                    className="text-secondary focus:ring-secondary w-4 h-4 border-outline-variant"
                  />
                  <div>
                    <span className="font-body-md text-body-md text-on-background block font-medium">Non-Prescription</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Fashion lenses</span>
                  </div>
                </div>
                <span className="font-body-md text-body-md font-semibold text-primary">Included</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-sm mt-sm">
            <button 
              onClick={handleAddToCart}
              disabled={selectedVariant?.stock_quantity === 0}
              className="w-full bg-primary hover:bg-inverse-surface text-on-primary font-label-md text-label-md py-md px-lg rounded-lg transition-colors flex items-center justify-center gap-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedVariant?.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
              <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
            </button>
          </div>
          
          {/* Guarantees */}
          <div className="flex items-center justify-between py-sm border-t border-b border-outline-variant mt-sm">
            <div className="flex items-center gap-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">local_shipping</span>
              <span className="font-body-sm text-body-sm">Free Shipping</span>
            </div>
            <div className="flex items-center gap-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">replay</span>
              <span className="font-body-sm text-body-sm">30-Day Returns</span>
            </div>
            <div className="flex items-center gap-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span className="font-body-sm text-body-sm">1-Year Warranty</span>
            </div>
          </div>
        </section>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-xl pt-xl border-t border-outline-variant">
          <div className="flex items-center justify-between mb-lg">
            <h2 className="font-headline-md text-headline-md text-on-background">You Might Also Like</h2>
            <Link className="text-secondary font-label-md text-label-md hover:underline flex items-center gap-xs" to={`/products?category_id=${product.category_id}`}>
              View All <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
            {relatedProducts.map(rel => (
               <ProductCard
                key={rel.product_id}
                product={rel}
                openTryOn={openTryOn}
               />
            ))}
          </div>
        </section>
      )}

      {/* Reviews Section */}
      {selectedVariant && (
        <ReviewsSection
          variantId={selectedVariant.variant_id}
          onStatsChange={setReviewStats}
        />
      )}
      <VirtualTryOnModal
        isOpen={isTryOnOpen}
        glasses={selectedGlasses}
        onClose={closeTryOn}
      />
    </div>
  );
};

/* ──────────────────────────────────────────────
   Sub-component: Reviews Section 
   ────────────────────────────────────────────── */
const ReviewsSection = ({ variantId, onStatsChange }) => {
  const { isAuthenticated, user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ rate: 5, desc: '' });
  // Login prompt for guests
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/variants/${variantId}/comments`);
      const data = res.data.data || res.data || {};
      const list = Array.isArray(data) ? data : data.comments || [];
      setComments(list);
      if (onStatsChange) {
        const avg = list.length > 0
          ? list.reduce((sum, c) => sum + c.rate, 0) / list.length
          : 0;
        onStatsChange({ avg, count: list.length });
      }
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (variantId) fetchComments();
  }, [variantId]);

  // Guard: require login before any interactive action
  const requireAuth = (action) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return false;
    }
    action();
    return true;
  };

  const handleGoToLogin = () => {
    // Save current URL so we can redirect back after login
    const returnUrl = window.location.pathname + window.location.search;
    window.location.href = `/login?returnTo=${encodeURIComponent(returnUrl)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/comments/${editingId}`, { rate: Number(form.rate), desc: form.desc });
      } else {
        await api.post('/comments', { variant_id: variantId, rate: Number(form.rate), desc: form.desc });
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ rate: 5, desc: '' });
      fetchComments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (c) => {
    setEditingId(c.comment_id);
    setForm({ rate: c.rate, desc: c.desc || '' });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this review?')) {
      try {
        await api.delete(`/comments/${id}`);
        fetchComments();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete review.');
      }
    }
  };

  const avgRating = comments.length > 0
    ? (comments.reduce((sum, c) => sum + c.rate, 0) / comments.length).toFixed(1)
    : 0;

  const StarDisplay = ({ rating, size = 18 }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} className={`material-symbols-outlined text-[${size}px] ${star <= rating ? 'text-[#F59E0B]' : 'text-outline-variant'}`}
          style={{ fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0" }}>
          star
        </span>
      ))}
    </div>
  );

  const StarInput = ({ value, onChange }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} type="button" onClick={() => onChange(star)}
          className={`material-symbols-outlined text-[28px] transition-colors ${star <= value ? 'text-[#F59E0B]' : 'text-outline-variant hover:text-[#F59E0B]/50'}`}
          style={{ fontVariationSettings: star <= value ? "'FILL' 1" : "'FILL' 0" }}>
          star
        </button>
      ))}
      <span className="ml-2 font-body-sm text-on-surface-variant">{value}/5</span>
    </div>
  );

  return (
    <section id="reviews" className="mt-xl pt-xl border-t border-outline-variant">

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-md">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl w-full max-w-sm p-lg text-center space-y-md">
            <span className="material-symbols-outlined text-[48px] text-secondary block">account_circle</span>
            <h3 className="font-headline-sm text-on-surface">Sign in to leave a review</h3>
            <p className="font-body-sm text-on-surface-variant">You need to be logged in to rate or review products.</p>
            <div className="flex gap-sm justify-center">
              <button onClick={() => setShowLoginPrompt(false)}
                className="px-lg py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-md hover:bg-surface-container transition-colors">
                Cancel
              </button>
              <button onClick={handleGoToLogin}
                className="px-lg py-2 rounded-lg bg-primary text-on-primary font-label-md hover:bg-inverse-surface transition-colors">
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-background">Customer Reviews</h2>
          {comments.length > 0 && (
            <div className="flex items-center gap-sm mt-xs">
              <StarDisplay rating={Math.round(avgRating)} />
              <span className="font-body-md font-bold text-on-background">{avgRating}</span>
              <span className="font-body-sm text-on-surface-variant">({comments.length} review{comments.length !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>
        {/* Write Review button — only for authenticated users */}
        {isAuthenticated && !showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm({ rate: 5, desc: '' }); }}
            className="bg-primary text-on-primary px-md py-2 rounded-lg font-label-md hover:bg-inverse-surface transition-colors flex items-center gap-xs">
            <span className="material-symbols-outlined text-[18px]">rate_review</span>
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form — only shown when authenticated and showForm is true */}
      {isAuthenticated && showForm && (
        <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md mb-lg space-y-sm max-w-[600px]">
          <div>
            <label className="block font-label-md text-on-surface-variant mb-2">Your Rating</label>
            <StarInput value={form.rate} onChange={(val) => setForm({ ...form, rate: val })} />
          </div>
          <div>
            <label className="block font-label-md text-on-surface-variant mb-1">Your Review (optional)</label>
            <textarea rows={4} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md"
              placeholder="Share your experience with this product..." />
          </div>
          <div className="flex gap-sm">
            <button type="submit" disabled={submitting}
              className="bg-secondary text-on-secondary px-lg py-2 rounded-lg font-label-md disabled:opacity-70 flex items-center gap-xs">
              {submitting ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : (editingId ? 'Update Review' : 'Submit Review')}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
              className="px-lg py-2 rounded-lg font-label-md border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Guest prompt banner (below the form area) */}
      {!isAuthenticated && !showForm && (
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-md mb-lg flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-on-surface-variant">lock</span>
            <p className="font-body-sm text-on-surface-variant">Sign in to share your experience with this product.</p>
          </div>
          <button onClick={handleGoToLogin}
            className="bg-primary text-on-primary px-md py-1.5 rounded-lg font-label-md text-sm hover:bg-inverse-surface transition-colors">
            Sign In
          </button>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-xl"><span className="material-symbols-outlined animate-spin text-[32px] text-secondary">progress_activity</span></div>
      ) : comments.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-xl text-center">
          <span className="material-symbols-outlined text-[48px] text-outline-variant mb-sm">reviews</span>
          <p className="text-on-surface-variant">No reviews yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-md">
          {comments.map((c) => (
            <div key={c.comment_id} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-sm mb-xs">
                    <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-xs">
                      {(c.user?.full_name || c.user?.user_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-body-md font-bold text-on-background">
                        {c.user?.full_name || c.user?.user_name || 'Anonymous'}
                      </span>
                      <span className="font-body-sm text-on-surface-variant ml-2">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </span>
                    </div>
                  </div>
                  <StarDisplay rating={c.rate} size={16} />
                </div>

                {/* Edit/Delete for owner or admin */}
                {isAuthenticated && (user?.user_id === c.user_id || user?.role === 'admin' || user?.role === 'staff') && (
                  <div className="flex gap-2">
                    {user?.id === c.user_id && (
                      <button onClick={() => handleEdit(c)} className="text-secondary text-xs font-label-md hover:underline">Edit</button>
                    )}
                    <button onClick={() => handleDelete(c.comment_id)} className="text-error text-xs font-label-md hover:underline">Delete</button>
                  </div>
                )}
              </div>

              {c.desc && (
                <p className="font-body-md text-on-surface mt-sm leading-relaxed">{c.desc}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductDetail;

