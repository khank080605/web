import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext({});

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mergePromptItems, setMergePromptItems] = useState(null);

  // ─── helpers ───────────────────────────────────────────────
  const calcTotal = (cartItems) =>
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // ─── localStorage fallback (guest / unauthenticated) ───────
  const saveLocal = (cartItems) => {
    localStorage.setItem('cart', JSON.stringify({ items: cartItems }));
  };

  const loadLocal = () => {
    try {
      const s = localStorage.getItem('cart');
      return s ? JSON.parse(s).items || [] : [];
    } catch { return []; }
  };

  // ─── Fetch cart from backend ────────────────────────────────
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      const local = loadLocal();
      setItems(local);
      setTotalAmount(calcTotal(local));
      return;
    }
    
    // Check if there's a local cart to merge after login
    const local = loadLocal();
    if (local.length > 0 && mergePromptItems === null) {
      setMergePromptItems(local);
    }

    setLoading(true);
    try {
      const res = await api.get('/cart');
      const data = res.data.data || res.data || {};
      // Map unit_price to price so Cart UI can use item.price
      const cartItems = (data.items || (Array.isArray(data) ? data : [])).map(item => ({
        ...item,
        price: item.unit_price || item.price,
      }));
      setItems(cartItems);
      setTotalAmount(calcTotal(cartItems));
      // DO NOT keep localStorage in sync for authenticated users to avoid merge prompt loop
    } catch (err) {
      console.error('Failed to load cart', err);
      // Fall back to local if server unavailable
      const fallbackLocal = loadLocal();
      setItems(fallbackLocal);
      setTotalAmount(calcTotal(fallbackLocal));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load cart on mount / auth change
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ─── Add item ───────────────────────────────────────────────
  const addItem = async (item) => {
    if (!isAuthenticated) {
      // Guest: localStorage only
      const existing = items.findIndex(i => i.variant_id === item.variant_id);
      let updated;
      if (existing !== -1) {
        updated = items.map((i, idx) =>
          idx === existing ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      } else {
        updated = [...items, item];
      }
      setItems(updated);
      setTotalAmount(calcTotal(updated));
      saveLocal(updated);
      return;
    }
    try {
      await api.post('/cart/items', {
        variant_id: item.variant_id,
        quantity: item.quantity,
      });
      await fetchCart();
    } catch (err) {
      console.error('Failed to add to cart', err);
      alert(err.response?.data?.message || 'Could not add item to cart.');
    }
  };

  // ─── Update quantity ────────────────────────────────────────
  const updateQuantity = async (variant_id, quantity) => {
    if (quantity < 1) return;
    if (!isAuthenticated) {
      const updated = items.map(i =>
        i.variant_id === variant_id ? { ...i, quantity } : i
      );
      setItems(updated);
      setTotalAmount(calcTotal(updated));
      saveLocal(updated);
      return;
    }
    try {
      await api.put(`/cart/items/${variant_id}`, { quantity });
      await fetchCart();
    } catch (err) {
      console.error('Failed to update quantity', err);
    }
  };

  // ─── Remove item ────────────────────────────────────────────
  const removeItem = async (variant_id) => {
    if (!isAuthenticated) {
      const updated = items.filter(i => i.variant_id !== variant_id);
      setItems(updated);
      setTotalAmount(calcTotal(updated));
      saveLocal(updated);
      return;
    }
    try {
      await api.delete(`/cart/items/${variant_id}`);
      await fetchCart();
    } catch (err) {
      console.error('Failed to remove item', err);
    }
  };

  // ─── Clear cart ─────────────────────────────────────────────
  const clearCart = async () => {
    if (!isAuthenticated) {
      setItems([]);
      setTotalAmount(0);
      localStorage.removeItem('cart');
      return;
    }
    try {
      await api.delete('/cart');
      setItems([]);
      setTotalAmount(0);
      localStorage.removeItem('cart');
    } catch (err) {
      console.error('Failed to clear cart', err);
    }
  };

  const handleMergeAccept = async () => {
    if (!mergePromptItems) return;
    setLoading(true);
    try {
      for (const item of mergePromptItems) {
        await api.post('/cart/items', {
          variant_id: item.variant_id,
          quantity: item.quantity,
        });
      }
    } catch (err) {
      console.error('Failed to merge cart items', err);
    }
    localStorage.removeItem('cart');
    setMergePromptItems(null);
    await fetchCart();
  };

  const handleMergeDecline = () => {
    localStorage.removeItem('cart');
    setMergePromptItems(null);
  };

  return (
    <CartContext.Provider value={{
      items,
      totalAmount,
      loading,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      fetchCart,
    }}>
      {children}
      {mergePromptItems && mergePromptItems.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-md">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl w-[90%] max-w-[400px] p-lg text-center space-y-md animate-fade-in">
            <span className="material-symbols-outlined text-[48px] text-primary block">shopping_cart_checkout</span>
            <h3 className="font-headline-sm text-on-surface">Merge Guest Cart?</h3>
            <p className="font-body-sm text-on-surface-variant">
              You have {mergePromptItems.length} item(s) in your guest cart. Would you like to add them to your account's cart?
            </p>
            <div className="flex gap-sm justify-center pt-sm">
              <button onClick={handleMergeDecline} className="px-lg py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-md hover:bg-surface-container transition-colors">
                No, Thanks
              </button>
              <button onClick={handleMergeAccept} className="px-lg py-2 rounded-lg bg-primary text-on-primary font-label-md hover:bg-inverse-surface transition-colors flex items-center gap-2">
                Yes, Merge
              </button>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
