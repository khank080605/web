import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { resolveColor } from '../utils/colorConfig';

const Cart = () => {
  const { items, updateQuantity, removeItem } = useCart();
  const [unselectedIds, setUnselectedIds] = useState(new Set());
  const navigate = useNavigate();
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleToggleItem = (variant_id) => {
    const newSet = new Set(unselectedIds);
    if (newSet.has(variant_id)) newSet.delete(variant_id);
    else newSet.add(variant_id);
    setUnselectedIds(newSet);
  };

  const handleToggleAll = () => {
    if (unselectedIds.size === 0) {
      // Deselect all
      setUnselectedIds(new Set(items.map(i => i.variant_id)));
    } else {
      // Select all
      setUnselectedIds(new Set());
    }
  };

  const selectedItems = items.filter(item => !unselectedIds.has(item.variant_id));
  const selectedVariantIds = selectedItems.map(i => i.variant_id);
  const subtotal = selectedItems.reduce(
    (sum, item) => sum + (item.line_total ?? item.price * item.quantity),
    0,
  );
  const tax = subtotal * 0.1; // 10% tax example
  const finalTotal = subtotal + tax;

  const handleProceedToCheckout = (e) => {
    e.preventDefault();
    if (selectedVariantIds.length === 0) return;
    navigate('/checkout', { state: { selectedVariantIds } });
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-xl min-h-[60vh] gap-md">
        <span className="material-symbols-outlined text-[64px] text-outline-variant">shopping_bag</span>
        <h2 className="font-headline-lg text-headline-lg text-on-background">Your Cart is Empty</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Looks like you haven't added any products yet.</p>
        <Link to="/products" className="mt-md bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider py-md px-xl rounded-lg hover:bg-inverse-surface transition-colors">
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="py-lg">
      <div className="mb-lg flex items-center justify-between">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-background">Your Cart</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">{items.length} items in your cart</p>
        </div>
        {items.length > 0 && (
          <label className="flex items-center gap-sm cursor-pointer hover:text-primary transition-colors">
            <input 
              type="checkbox" 
              className="w-5 h-5 text-primary border-outline-variant rounded focus:ring-primary"
              checked={unselectedIds.size === 0}
              onChange={handleToggleAll}
            />
            <span className="font-label-lg font-medium text-on-background">Select All</span>
          </label>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-md">
          {items.map((item) => (
            <div key={`${item.variant_id}-${item.color}`} className={`bg-surface-container-lowest p-md border rounded-xl flex flex-col sm:flex-row gap-md items-start sm:items-center transition-colors ${!unselectedIds.has(item.variant_id) ? 'border-primary ring-1 ring-primary/20' : 'border-outline-variant opacity-80'}`}>
              <div className="flex items-center self-stretch sm:self-auto pl-sm pr-xs">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 text-primary border-outline-variant rounded focus:ring-primary cursor-pointer"
                  checked={!unselectedIds.has(item.variant_id)}
                  onChange={() => handleToggleItem(item.variant_id)}
                />
              </div>
              <Link to={`/products/${item.product_id}`} className="w-full sm:w-32 h-32 bg-surface-container rounded-lg overflow-hidden flex-shrink-0 cursor-pointer block hover:opacity-80 transition-opacity">
                <img 
                  alt={item.product_name} 
                  className="w-full h-full object-cover" 
                  src={item.image?.startsWith('http') ? item.image : `http://localhost:3000/uploads/${item.image}`}
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=200' }}
                />
              </Link>
              <div className="flex-grow flex flex-col sm:flex-row justify-between w-full">
                <div className="space-y-xs">
                  <Link to={`/products/${item.product_id}`} className="hover:underline">
                    <h3 className="font-headline-md text-headline-md text-on-background">{item.product_name}</h3>
                  </Link>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-outline-variant inline-block"
                      style={{ backgroundColor: resolveColor(item.color) }}
                    ></span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{item.color}</p>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center mt-sm sm:mt-0 gap-sm">
                  {item.discount && item.original_price > item.price ? (
                    <div className="flex flex-col sm:items-end">
                      <span className="font-headline-sm text-headline-sm text-error">{formatPrice(item.price)}</span>
                      <span className="text-xs text-on-surface-variant line-through">{formatPrice(item.original_price)}</span>
                    </div>
                  ) : (
                    <span className="font-headline-sm text-headline-sm text-on-background">{formatPrice(item.price)}</span>
                  )}
                  
                  {/* Quantity Selector */}
                  <div className="flex items-center border border-outline-variant rounded-full bg-surface">
                    <button 
                      onClick={() => updateQuantity(item.variant_id, Math.max(1, item.quantity - 1))}
                      className="p-xs text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">remove</span>
                    </button>
                    <span className="font-body-md text-body-md w-8 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                      className="p-xs text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => removeItem(item.variant_id)}
                    className="text-secondary font-label-md text-label-md uppercase tracking-wider hover:text-primary transition-colors mt-xs flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-surface-container-lowest p-lg border border-outline-variant rounded-xl sticky top-24">
            <h2 className="font-headline-md text-headline-md text-on-background mb-md">Order Summary</h2>
            <div className="space-y-sm mb-md">
              <div className="flex justify-between">
                <span className="font-body-md text-body-md text-on-surface-variant">Subtotal ({selectedItems.length} items)</span>
                <span className="font-body-md text-body-md text-on-background">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body-md text-body-md text-on-surface-variant">Estimated Shipping</span>
                <span className="font-body-md text-body-md text-on-background">Free</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body-md text-body-md text-on-surface-variant">Estimated Tax (10%)</span>
                <span className="font-body-md text-body-md text-on-background">{formatPrice(tax)}</span>
              </div>
            </div>
            
            <div className="border-t border-outline-variant pt-md mb-lg">
              <div className="flex justify-between items-end">
                <span className="font-headline-sm text-headline-sm text-on-background">Total</span>
                <span className="font-headline-lg text-headline-lg text-on-background">{formatPrice(finalTotal)}</span>
              </div>
            </div>
            
            <button 
              onClick={handleProceedToCheckout}
              disabled={selectedVariantIds.length === 0}
              className="w-full bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider py-md rounded-lg hover:bg-inverse-surface transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedVariantIds.length === 0 ? 'Select items to checkout' : 'Proceed to Checkout'}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
            
            <p className="font-body-sm text-body-sm text-on-surface-variant text-center mt-sm flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px]">lock</span>
              Secure Checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
