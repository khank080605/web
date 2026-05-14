import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import ProductCard from '../components/product/ProductCard';
import VirtualTryOnModal from '../components/try-on/VirtualTryOnModal';
import api from '../services/api';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedGlasses, setSelectedGlasses] = useState(null);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);

  // Dynamic filter data from API
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // URL search params — single source of truth
  const [searchParams, setSearchParams] = useSearchParams();

  // Local price state (controlled inputs, only applied on button click)
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');

  const currentPage  = parseInt(searchParams.get('page'))       || 1;
  const currentLimit = parseInt(searchParams.get('limit'))      || 16;
  const currentCat   = searchParams.get('category_id')          || '';
  const currentBrand = searchParams.get('brand_id')             || '';
  const currentSort  = searchParams.get('sort')                 || 'newest';
  const currentQ     = searchParams.get('q')                    || '';

  // ── Load categories & brands from API ─────────────────────
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands'),
        ]);
        const catPayload = catRes.data.data || catRes.data || {};
        const brandPayload = brandRes.data.data || brandRes.data || {};
        setCategories(Array.isArray(catPayload) ? catPayload : catPayload.categories || []);
        setBrands(Array.isArray(brandPayload) ? brandPayload : brandPayload.brands || []);
      } catch (err) {
        console.error('Failed to load filter options', err);
      }
    };
    loadFilters();
  }, []);

    // ── Fetch products whenever URL params change ──────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams(searchParams);
            // Default limit if not present
            if (!params.has('limit')) params.set('limit', String(16));
      const res = await api.get(`/products?${params.toString()}`);
      const data = res.data.data || {};
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalItems || 0);
    } catch (err) {
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Sync local price inputs when URL changes externally (e.g. browser back)
  useEffect(() => {
    setMinPrice(searchParams.get('min_price') || '');
    setMaxPrice(searchParams.get('max_price') || '');
  }, [searchParams]);

    // ── Helpers ────────────────────────────────────────────────
  const setParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) {
      p.set(key, value);
    } else {
      p.delete(key);
    }
    // Reset to page 1 for filter/sort changes, but NOT for page changes
    // The page button handlers call goToPage directly
    if (key !== 'page') {
      p.set('page', '1');
    }
    setSearchParams(p);
  };

  const goToPage = (page) => {
    const p = new URLSearchParams(searchParams);
    p.set('page', String(page));
    setSearchParams(p);
  };

  const applyPriceFilter = () => {
    const p = new URLSearchParams(searchParams);
    if (minPrice) p.set('min_price', minPrice); else p.delete('min_price');
    if (maxPrice) p.set('max_price', maxPrice); else p.delete('max_price');
    p.set('page', '1');
    setSearchParams(p);
  };

  const clearAllFilters = () => {
    const p = new URLSearchParams();
    if (currentSort !== 'newest') p.set('sort', currentSort);
    setSearchParams(p);
    setMinPrice('');
    setMaxPrice('');
  };

  const hasActiveFilters = currentCat || currentBrand ||
    searchParams.get('min_price') || searchParams.get('max_price') || currentQ;

  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  const openTryOn = (glasses) => {
    setSelectedGlasses(glasses);
    setIsTryOnOpen(true);
  };

  const closeTryOn = () => {
    setIsTryOnOpen(false);
    setSelectedGlasses(null);
  };

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter py-xl">
      <div className="md:col-span-12">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl px-lg py-md mb-md">
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/' },
              { label: 'Products' },
            ]}
          />
        </div>
      </div>

      {/* ── Sidebar Filters ── */}
      <aside className="md:col-span-3 lg:col-span-2 hidden md:block">
        <div className="sticky top-24 space-y-md">

          {/* Clear all */}
          {hasActiveFilters && (
            <button onClick={clearAllFilters}
              className="w-full flex items-center justify-center gap-1 text-error text-body-sm font-label-md border border-error/40 rounded-lg py-1.5 hover:bg-error-container transition-colors">
              <span className="material-symbols-outlined text-[16px]">filter_list_off</span>
              Clear Filters
            </button>
          )}

          {/* Category */}
          <div>
            <h3 className="font-label-md text-label-md uppercase text-on-surface mb-xs border-b border-outline-variant pb-base">
              Category
            </h3>
            <ul className="space-y-base font-body-sm text-body-sm text-on-surface-variant">
              <li>
                <label className="flex items-center gap-xs cursor-pointer hover:text-on-surface transition-colors">
                  <input type="radio" name="category" className="text-secondary focus:ring-secondary"
                    checked={!currentCat}
                    onChange={() => setParam('category_id', '')} />
                  All
                </label>
              </li>
              {categories.map(cat => (
                <li key={cat.category_id}>
                  <label className="flex items-center gap-xs cursor-pointer hover:text-on-surface transition-colors">
                    <input type="radio" name="category" className="text-secondary focus:ring-secondary"
                      checked={currentCat === String(cat.category_id)}
                      onChange={() => setParam('category_id', String(cat.category_id))} />
                    {cat.category_name}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {/* Brand */}
          <div>
            <h3 className="font-label-md text-label-md uppercase text-on-surface mb-xs border-b border-outline-variant pb-base">
              Brand
            </h3>
            <ul className="space-y-base font-body-sm text-body-sm text-on-surface-variant">
              <li>
                <label className="flex items-center gap-xs cursor-pointer hover:text-on-surface transition-colors">
                  <input type="radio" name="brand" className="text-secondary focus:ring-secondary"
                    checked={!currentBrand}
                    onChange={() => setParam('brand_id', '')} />
                  All Brands
                </label>
              </li>
              {brands.map(b => (
                <li key={b.brand_id}>
                  <label className="flex items-center gap-xs cursor-pointer hover:text-on-surface transition-colors">
                    <input type="radio" name="brand" className="text-secondary focus:ring-secondary"
                      checked={currentBrand === String(b.brand_id)}
                      onChange={() => setParam('brand_id', String(b.brand_id))} />
                    {b.brand_name}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="font-label-md text-label-md uppercase text-on-surface mb-xs border-b border-outline-variant pb-base">
              Price Range
            </h3>
            <div className="space-y-xs">
              <div className="flex items-center gap-xs">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  className="w-full font-body-sm text-body-sm border border-outline-variant rounded px-xs py-1.5 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary/30 bg-surface"
                />
                <span className="text-on-surface-variant flex-shrink-0">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-full font-body-sm text-body-sm border border-outline-variant rounded px-xs py-1.5 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary/30 bg-surface"
                />
              </div>
              {/* Active price badge */}
              {(searchParams.get('min_price') || searchParams.get('max_price')) && (
                <p className="text-xs text-secondary font-medium">
                  {searchParams.get('min_price') ? formatPrice(searchParams.get('min_price')) : '0'}
                  {' → '}
                  {searchParams.get('max_price') ? formatPrice(searchParams.get('max_price')) : '∞'}
                </p>
              )}
              <button onClick={applyPriceFilter}
                className="w-full bg-secondary text-on-secondary font-label-md text-label-md py-1.5 rounded-lg hover:bg-on-secondary-fixed-variant transition-colors flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[16px]">tune</span>
                Apply
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Product Grid Area ── */}
      <section className="md:col-span-9 lg:col-span-10 flex flex-col gap-md">

        {/* Sorting Header (search bar removed — use Navbar live search instead) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm bg-surface-container-lowest p-sm rounded-lg border border-outline-variant">
          {/* Result count only */}
          <div className="flex flex-wrap items-center gap-xs flex-1">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {loading ? '...' : `${totalItems} product${totalItems !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-sm">
            <select
              className="font-body-sm text-body-sm border border-outline-variant rounded px-sm py-1.5 bg-surface-container-lowest focus:border-secondary focus:outline-none"
              onChange={e => setParam('sort', e.target.value)}
              value={currentSort}
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
            </select>

            <label className="font-body-sm text-on-surface-variant">Per page</label>
            <select
              className="font-body-sm text-body-sm border border-outline-variant rounded px-sm py-1.5 bg-surface-container-lowest focus:border-secondary focus:outline-none"
              onChange={e => setParam('limit', e.target.value)}
              value={String(currentLimit)}
            >
              <option value="16">16</option>
              <option value="24">24</option>
              <option value="32">32</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-xl">
            <span className="material-symbols-outlined animate-spin text-[40px] text-secondary">progress_activity</span>
          </div>
        ) : error ? (
          <div className="bg-error-container text-on-error-container p-lg rounded-xl text-center">{error}</div>
        ) : products.length === 0 ? (
          <div className="bg-surface-container-low text-on-surface-variant p-xl rounded-xl text-center">
            <span className="material-symbols-outlined text-[48px] block mb-sm">search_off</span>
            No products found matching your criteria.
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="block mx-auto mt-sm text-secondary hover:underline text-body-sm">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
            {products.map(product => (
              <ProductCard
                key={product.product_id}
                product={product}
                openTryOn={openTryOn}
              />
            ))}
          </div>
        )}

                                {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-lg flex justify-center items-center gap-1.5 flex-wrap">
            <button
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
              className="w-10 h-10 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-high hover:text-secondary transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {(() => {
              // Show ALL page numbers. If totalPages is large, show first, last, and a window around current.
              const pages = [];
              const maxVisible = 10; // show up to 10 numbers before collapsing
              if (totalPages <= maxVisible) {
                // Show all pages
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                // Always show first page
                pages.push(1);
                // Window around current page
                let start = Math.max(2, currentPage - 2);
                let end = Math.min(totalPages - 1, currentPage + 2);
                // Adjust window to show enough pages
                if (currentPage <= 4) {
                  start = 2;
                  end = Math.min(totalPages - 1, 6);
                }
                if (currentPage >= totalPages - 3) {
                  start = Math.max(2, totalPages - 5);
                  end = totalPages - 1;
                }
                if (start > 2) pages.push('ellipsis-start');
                for (let i = start; i <= end; i++) pages.push(i);
                if (end < totalPages - 1) pages.push('ellipsis-end');
                // Always show last page
                pages.push(totalPages);
              }
              return pages.map((pg, idx) => {
                if (pg === 'ellipsis-start' || pg === 'ellipsis-end') {
                  return <span key={pg} className="text-on-surface-variant px-1">…</span>;
                }
                return (
                  <button key={pg}
                    onClick={() => goToPage(pg)}
                    className={`min-w-[36px] h-10 flex items-center justify-center rounded font-body-sm font-bold transition-colors px-2 ${pg === currentPage ? 'bg-primary text-on-primary' : 'border border-outline-variant hover:bg-surface-container-high'}`}>
                    {pg}
                  </button>
                );
              });
            })()}
            <button
              disabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
              className="w-10 h-10 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-high hover:text-secondary transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        )}
      </section>
    </div>
    <VirtualTryOnModal
      isOpen={isTryOnOpen}
      glasses={selectedGlasses}
      onClose={closeTryOn}
    />
    </>
  );
};

export default ProductList;
