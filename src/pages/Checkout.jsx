import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Checkout = () => {
  const { items, fetchCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const selectedVariantIds = location.state?.selectedVariantIds;
  const checkoutItems = selectedVariantIds 
    ? items.filter(i => selectedVariantIds.includes(i.variant_id))
    : items;
  
  const totalAmount = checkoutItems.reduce(
    (sum, item) => sum + (item.line_total ?? item.price * item.quantity),
    0,
  );

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Fetch addresses
  useEffect(() => {
    if (isAuthenticated) {
      api.get('/addresses').then(res => {
        const addrList = res.data.data || res.data || [];
        setAddresses(addrList);
        if (addrList.length > 0) {
          setSelectedAddressId(addrList[0].address_id);
        }
      }).catch(console.error);
    }
  }, [isAuthenticated]);
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const tax = totalAmount * 0.1;
  const deliveryCost = deliveryMethod === 'express' ? 50000 : 0;
  const finalTotal = totalAmount + tax + deliveryCost;

  // Protect route
  if (!isAuthenticated && checkoutItems.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center py-xl min-h-[60vh]">
        <h2 className="font-headline-md text-headline-md text-on-background mb-md">Please Login to Checkout</h2>
        <Link to="/login?returnTo=/checkout" className="bg-primary text-on-primary py-2 px-lg rounded-lg">Go to Login</Link>
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-xl min-h-[60vh]">
        <h2 className="font-headline-md text-headline-md text-on-background mb-md">Your checkout is empty</h2>
        <Link to="/cart" className="bg-primary text-on-primary py-2 px-lg rounded-lg">Return to Cart</Link>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert('Please select a shipping address');
      return;
    }
    setLoading(true);
    try {
      const orderData = {
        selected_variant_ids: checkoutItems.map(i => i.variant_id),
        address_id: selectedAddressId,
        total_amount: finalTotal,
        shipping_fee: deliveryCost,
        note: `Payment Method: COD`,
        payment_method: 'COD'
      };

      await api.post('/orders/checkout', orderData);
      
      await fetchCart(); // Refresh cart to get rid of checked out items
      setOrderSuccess(true);
    } catch (error) {
      console.error('Checkout failed', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
        {/* Left Column: Checkout Steps */}
        <div className="lg:col-span-8 space-y-lg">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-xl relative">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-outline-variant -z-10 -translate-y-1/2"></div>
            
            <div className="flex flex-col items-center gap-xs bg-background px-sm">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-label-md text-label-md ${step >= 1 ? 'bg-primary text-on-primary' : 'bg-surface-container border border-outline-variant'}`}>
                {step > 1 ? <span className="material-symbols-outlined text-[16px]">check</span> : '1'}
              </div>
              <span className={`font-label-md text-label-md ${step >= 1 ? 'text-primary' : 'text-on-surface-variant'}`}>Shipping</span>
            </div>
            
            <div className="flex flex-col items-center gap-xs bg-background px-sm">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-label-md text-label-md ${step >= 2 ? 'bg-primary text-on-primary' : 'bg-surface-container border border-outline-variant'}`}>
                {step > 2 ? <span className="material-symbols-outlined text-[16px]">check</span> : '2'}
              </div>
              <span className={`font-label-md text-label-md ${step >= 2 ? 'text-primary' : 'text-on-surface-variant'}`}>Delivery</span>
            </div>
            
            <div className="flex flex-col items-center gap-xs bg-background px-sm">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-label-md text-label-md ${step >= 3 ? 'bg-primary text-on-primary' : 'bg-surface-container border border-outline-variant'}`}>
                3
              </div>
              <span className={`font-label-md text-label-md ${step >= 3 ? 'text-primary' : 'text-on-surface-variant'}`}>Payment</span>
            </div>
          </div>

          {/* Step 1: Shipping Address */}
          <section className={`bg-surface-container-lowest border border-outline-variant rounded-xl p-md md:p-lg ${step !== 1 && 'opacity-60'}`}>
            <div className="flex justify-between items-center mb-md">
              <h2 className="font-headline-sm text-headline-sm text-on-background flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">location_on</span>
                Shipping Address
              </h2>
              {step > 1 && <button onClick={() => setStep(1)} className="font-label-md text-label-md text-secondary hover:text-primary transition-colors">Edit</button>}
            </div>
            
            {step === 1 ? (
              <form className="space-y-sm" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
                {addresses.length === 0 ? (
                  <div className="text-center py-xl border border-outline-variant rounded-lg bg-surface-container-low">
                    <p className="font-body-md text-on-surface-variant mb-md">You don't have any saved addresses.</p>
                    <Link to="/my-account" className="bg-primary text-on-primary font-label-md py-2 px-lg rounded-lg hover:bg-inverse-surface transition-colors inline-block">
                      Go to My Account to Add Address
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-sm">
                    {addresses.map(addr => (
                      <label key={addr.address_id} className={`flex items-start gap-md p-md border rounded-lg cursor-pointer transition-colors ${selectedAddressId === addr.address_id ? 'border-primary bg-primary-container/10 ring-1 ring-primary' : 'border-outline-variant hover:border-outline'}`}>
                        <input 
                          type="radio" 
                          name="address" 
                          checked={selectedAddressId === addr.address_id} 
                          onChange={() => setSelectedAddressId(addr.address_id)} 
                          className="mt-1 w-4 h-4 text-primary focus:ring-secondary" 
                        />
                        <div>
                          <p className="font-body-md font-medium text-on-background">{addr.specifiable_address}</p>
                          <p className="font-body-sm text-on-surface-variant">{addr.street}, {addr.city}</p>
                        </div>
                      </label>
                    ))}
                    <div className="mt-md flex justify-end">
                      <button type="submit" disabled={!selectedAddressId} className="bg-primary text-on-primary font-label-md py-2 px-lg rounded-lg hover:bg-inverse-surface transition-colors disabled:opacity-50">Continue</button>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <div className="font-body-sm text-body-sm text-on-surface-variant">
                {addresses.find(a => a.address_id === selectedAddressId) ? (
                  <>
                    <p className="font-bold text-on-background">{addresses.find(a => a.address_id === selectedAddressId).specifiable_address}</p>
                    <p>{addresses.find(a => a.address_id === selectedAddressId).street}, {addresses.find(a => a.address_id === selectedAddressId).city}</p>
                  </>
                ) : (
                  <p>No address selected</p>
                )}
              </div>
            )}
          </section>

          {/* Step 2: Delivery Method */}
          <section className={`bg-surface-container-lowest border border-outline-variant rounded-xl p-md md:p-lg ${step !== 2 && 'opacity-60'}`}>
            <div className="flex justify-between items-center mb-md">
              <h2 className="font-headline-sm text-headline-sm text-on-background flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">local_shipping</span>
                Delivery Method
              </h2>
              {step > 2 && <button onClick={() => setStep(2)} className="font-label-md text-label-md text-secondary hover:text-primary transition-colors">Edit</button>}
            </div>

            {step === 2 && (
              <>
                <div className="space-y-sm">
                  <label className="flex items-center p-md border border-outline-variant rounded-lg cursor-pointer hover:bg-surface transition-colors">
                    <input type="radio" name="delivery" checked={deliveryMethod === 'standard'} onChange={() => setDeliveryMethod('standard')} className="w-4 h-4 text-primary focus:ring-secondary mr-md" />
                    <div className="flex-grow">
                      <span className="block font-body-md text-on-background font-bold mb-xs">Standard Shipping</span>
                      <span className="block font-body-sm text-on-surface-variant">3-5 Business Days</span>
                    </div>
                    <span className="font-body-md font-bold">Free</span>
                  </label>
                  <label className="flex items-center p-md border border-outline-variant rounded-lg cursor-pointer hover:bg-surface transition-colors">
                    <input type="radio" name="delivery" checked={deliveryMethod === 'express'} onChange={() => setDeliveryMethod('express')} className="w-4 h-4 text-primary focus:ring-secondary mr-md" />
                    <div className="flex-grow">
                      <span className="block font-body-md text-on-background font-bold mb-xs">Express Shipping</span>
                      <span className="block font-body-sm text-on-surface-variant">1-2 Business Days</span>
                    </div>
                    <span className="font-body-md font-bold">50,000 ₫</span>
                  </label>
                </div>
                <div className="mt-md flex justify-end">
                  <button onClick={() => setStep(3)} className="bg-primary text-on-primary font-label-md py-2 px-lg rounded-lg hover:bg-inverse-surface transition-colors">Continue</button>
                </div>
              </>
            )}
          </section>

          {/* Step 3: Payment */}
          <section className={`bg-surface-container-lowest border border-outline-variant rounded-xl p-md md:p-lg ${step !== 3 && 'opacity-60'}`}>
            <h2 className="font-headline-sm text-headline-sm text-on-background flex items-center gap-sm mb-md">
              <span className="material-symbols-outlined text-primary">payment</span>
              Payment
            </h2>
            {step === 3 && (
              <div>
                <p className="font-body-md text-on-surface-variant mb-md">For this prototype, we support Cash on Delivery (COD).</p>
                <div className="flex items-center p-md border border-outline-variant rounded-lg bg-surface-container-low mb-lg">
                   <span className="material-symbols-outlined mr-sm text-secondary">payments</span>
                   <span className="font-body-md font-semibold text-on-background">Cash on Delivery (COD)</span>
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="bg-primary text-on-primary font-label-md py-3 px-xl rounded-lg hover:bg-inverse-surface transition-colors flex items-center gap-xs"
                  >
                    {loading ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : 'Place Order'}
                    {!loading && <span className="material-symbols-outlined text-[16px]">arrow_forward</span>}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Order Summary (Fixed Sidebar) */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
            <h2 className="font-headline-sm text-headline-sm text-on-background mb-md pb-sm border-b border-outline-variant">Order Summary</h2>
            
            <div className="space-y-md mb-lg">
              {checkoutItems.map(item => (
                <div key={item.variant_id} className="flex gap-md">
                  <div className="w-16 h-16 bg-surface-container-high rounded-lg overflow-hidden flex-shrink-0">
                    <img alt={item.product_name} src={item.image?.startsWith('http') ? item.image : `http://localhost:3000/uploads/${item.image}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-body-md font-bold text-on-background leading-tight">{item.product_name}</h3>
                      <p className="font-body-sm text-on-surface-variant mt-xs text-xs">{item.color} - Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right mt-sm">
                      {item.discount && item.original_price > item.price ? (
                        <div>
                          <span className="font-body-md font-bold text-error block">{formatPrice(item.price * item.quantity)}</span>
                          <span className="text-xs text-on-surface-variant line-through">{formatPrice(item.original_price * item.quantity)}</span>
                        </div>
                      ) : (
                        <span className="font-body-md font-bold">{formatPrice(item.price * item.quantity)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-sm mb-lg border-t border-outline-variant pt-md">
              <div className="flex justify-between font-body-sm text-on-surface-variant">
                <span>Subtotal</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between font-body-sm text-on-surface-variant">
                <span>Shipping</span>
                <span>{deliveryCost === 0 ? 'Free' : formatPrice(deliveryCost)}</span>
              </div>
              <div className="flex justify-between font-body-sm text-on-surface-variant">
                <span>Estimated Tax (10%)</span>
                <span>{formatPrice(tax)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-sm border-t border-outline-variant mb-lg">
              <span className="font-headline-sm text-on-background">Total</span>
              <span className="font-headline-sm text-primary">{formatPrice(finalTotal)}</span>
            </div>
            
            <p className="font-body-sm text-on-surface-variant text-center flex items-center justify-center gap-xs">
              <span className="material-symbols-outlined text-[16px]">verified_user</span> Secure SSL Checkout
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {orderSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-md">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl w-[90%] max-w-[400px] p-xl text-center space-y-md animate-fade-in flex flex-col items-center">
            <div className="w-16 h-16 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mb-sm">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <h3 className="font-headline-md text-on-surface">Order Placed Successfully!</h3>
            <p className="font-body-md text-on-surface-variant">
              Thank you for shopping with Glasscart. Your order has been received and is now processing.
            </p>
            <div className="pt-md w-full">
              <button 
                onClick={() => navigate('/')} 
                className="w-full py-3 rounded-lg bg-primary text-on-primary font-label-lg hover:bg-inverse-surface transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
