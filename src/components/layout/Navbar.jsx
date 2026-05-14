import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Navbar = () => {
  const { items } = useCart();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'staff');
  const navigate = useNavigate();
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  // Live search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Debounce API call
    clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get('/products', { params: { q: value.trim(), limit: 6 } });
        const data = res.data.data || res.data || {};
        const products = data.products || (Array.isArray(data) ? data : []);
        setSearchResults(products);
        setShowDropdown(true);
      } catch (err) {
        console.error('Search failed', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowDropdown(false);
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/products?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/products');
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <nav className="sticky top-0 z-50 flex justify-between items-center w-full px-lg max-w-container-max mx-auto h-16 bg-surface-container-lowest border-b border-outline-variant">
      {/* Search Bar (Left) */}
      <div className="flex items-center w-1/3" ref={searchRef}>
        <div className="relative w-full max-w-[320px]">
          <form onSubmit={handleSearchSubmit}>
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant z-10 pointer-events-none">search</span>
            <input 
              className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-full text-body-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all text-on-surface" 
              placeholder="Search products..." 
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
            />
          </form>

          {/* Live Search Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden z-[100] max-h-[420px] overflow-y-auto">
              {searching ? (
                <div className="flex items-center justify-center py-md">
                  <span className="material-symbols-outlined animate-spin text-[20px] text-secondary">progress_activity</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-md text-center text-on-surface-variant text-body-sm">
                  No products found for "{searchQuery}"
                </div>
              ) : (
                <>
                  {searchResults.map((product) => {
                    const variant = product.variants?.[0];
                    const imgSrc = variant?.image
                      ? (variant.image.startsWith('http') ? variant.image : `http://localhost:3000/uploads/${variant.image}`)
                      : null;
                    return (
                      <Link
                        key={product.product_id}
                        to={`/products/${product.product_id}`}
                        onClick={() => { setShowDropdown(false); setSearchQuery(''); }}
                        className="flex items-center gap-sm px-md py-sm hover:bg-secondary-container/20 transition-colors border-b border-outline-variant/30 last:border-b-0"
                      >
                        <div className="w-12 h-12 bg-surface-container-high rounded-lg overflow-hidden flex-shrink-0">
                          {imgSrc ? (
                            <img src={imgSrc} alt={product.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-outline-variant">image</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body-sm font-bold text-on-background truncate">{product.product_name}</p>
                          <p className="font-body-sm text-secondary font-semibold">
                            {variant?.price ? formatPrice(variant.price) : ''}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                  <Link
                    to={`/products?q=${encodeURIComponent(searchQuery)}`}
                    onClick={() => { setShowDropdown(false); setSearchQuery(''); }}
                    className="block text-center py-sm text-secondary font-label-md hover:bg-secondary-container/10 transition-colors"
                  >
                    View all results →
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Brand Logo (Center) */}
      <div className="flex justify-center w-1/3">
        <Link className="text-headline-md font-headline-lg text-primary tracking-tight" to="/">Glasscart</Link>
      </div>

      {/* Navigation Links & Icons (Right) */}
      <div className="flex items-center justify-end w-1/3 space-x-md">
        <div className="hidden md:flex space-x-md items-center">
          <Link className="text-on-surface-variant font-body-md hover:text-secondary transition-colors" to="/products?category_id=1">Eyeglasses</Link>
          <Link className="text-on-surface-variant font-body-md hover:text-secondary transition-colors" to="/products?category_id=2">Sunglasses</Link>
          <Link className="text-on-surface-variant font-body-md hover:text-secondary transition-colors" to="/products?category_id=3">Contact Lenses</Link>
        </div>
        <div className="flex items-center space-x-sm">
          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-on-secondary rounded-full font-label-md text-label-md hover:bg-on-secondary-fixed-variant transition-colors">
              <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
              <span className="hidden lg:inline">Admin</span>
            </Link>
          )}
          <Link to="/cart" aria-label="Shopping Cart" className="relative p-2 text-primary hover:text-secondary transition-colors scale-95 active:scale-90">
            <span className="material-symbols-outlined">shopping_cart</span>
            {cartItemCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-error rounded-full">
                {cartItemCount}
              </span>
            )}
          </Link>
          <Link to={isAuthenticated ? "/my-account" : "/login"} aria-label="Account" className="p-2 text-primary hover:text-secondary transition-colors scale-95 active:scale-90">
            <span className="material-symbols-outlined">account_circle</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
