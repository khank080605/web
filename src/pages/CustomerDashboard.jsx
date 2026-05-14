import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CustomerDashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelOrderId, setCancelOrderId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await api.get('/orders');
        const payload = res.data.data || res.data || {};
        setOrders(Array.isArray(payload) ? payload : payload.orders || []);
      } catch (err) {
        console.error('Failed to fetch orders', err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'orders') {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, activeTab, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const requestCancelOrder = (orderId) => {
    setCancelOrderId(orderId);
  };

  const confirmCancelOrder = async () => {
    if (!cancelOrderId) return;
    try {
      await api.post(`/orders/${cancelOrderId}/cancel`);
      setOrders(prev => prev.map(o => o.order_id === cancelOrderId ? { ...o, status: 'Cancelled' } : o));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancelOrderId(null);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col md:flex-row w-full max-w-container-max mx-auto px-sm md:px-lg py-md md:py-lg gap-gutter min-h-[70vh]">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 gap-sm">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-sm flex flex-col gap-base">
          <div 
            onClick={() => setActiveTab('profile')}
            className={`px-sm py-sm rounded-lg flex items-center gap-xs cursor-pointer transition-all ${activeTab === 'profile' ? 'bg-secondary-container text-on-secondary-container font-bold' : 'text-on-surface-variant opacity-80 hover:opacity-100 hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined">person</span>
            <span className="font-label-md text-label-md">My Profile</span>
          </div>
          
          <div 
            onClick={() => setActiveTab('orders')}
            className={`px-sm py-sm rounded-lg flex items-center gap-xs cursor-pointer transition-all ${activeTab === 'orders' ? 'bg-secondary-container text-on-secondary-container font-bold' : 'text-on-surface-variant opacity-80 hover:opacity-100 hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined">receipt_long</span>
            <span className="font-label-md text-label-md">Orders</span>
          </div>

          <div 
            onClick={() => setActiveTab('addresses')}
            className={`px-sm py-sm rounded-lg flex items-center gap-xs cursor-pointer transition-all ${activeTab === 'addresses' ? 'bg-secondary-container text-on-secondary-container font-bold' : 'text-on-surface-variant opacity-80 hover:opacity-100 hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined">location_on</span>
            <span className="font-label-md text-label-md">Addresses</span>
          </div>

          <div 
            onClick={() => setActiveTab('password')}
            className={`px-sm py-sm rounded-lg flex items-center gap-xs cursor-pointer transition-all ${activeTab === 'password' ? 'bg-secondary-container text-on-secondary-container font-bold' : 'text-on-surface-variant opacity-80 hover:opacity-100 hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined">lock</span>
            <span className="font-label-md text-label-md">Change Password</span>
          </div>
          
          <div 
            onClick={handleLogout}
            className="px-sm py-sm text-error opacity-80 hover:opacity-100 hover:bg-error-container transition-all rounded-lg flex items-center gap-xs cursor-pointer mt-md"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md text-label-md">Logout</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-lg">
        {/* ─── ORDERS TAB ─── */}
        {activeTab === 'orders' && (
          <>
            <header className="flex flex-col gap-xs">
              <h1 className="font-headline-lg text-headline-lg text-on-background">Order History</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">Manage your recent orders, track shipments, and view details.</p>
            </header>

            {loading ? (
              <div className="flex justify-center py-xl">
                 <span className="material-symbols-outlined animate-spin text-[40px] text-secondary">progress_activity</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-xl text-center">
                <p className="text-on-surface-variant mb-md">You haven't placed any orders yet.</p>
                <button onClick={() => navigate('/products')} className="bg-primary text-on-primary font-label-md py-2 px-lg rounded-lg">Start Shopping</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-md">
                {orders.map((order) => (
                  <div key={order.order_id} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md flex flex-col gap-sm relative overflow-hidden">
                    {/* Status accent bar */}
                    <div className={`absolute top-0 left-0 w-full h-1 ${['Pending', 'Processing'].includes(order.status) ? 'bg-secondary' : order.status === 'Shipped' ? 'bg-secondary-fixed' : order.status === 'Cancelled' ? 'bg-error' : 'bg-surface-variant'}`}></div>
                    
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-base">
                        <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Order #{order.order_id}</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">{formatDate(order.order_date)}</span>
                      </div>
                      <span className={`font-label-md text-label-md px-sm py-base rounded-full flex items-center gap-xs ${['Pending', 'Processing'].includes(order.status) ? 'bg-surface-container-high text-on-surface' : order.status === 'Shipped' ? 'bg-secondary-container text-on-secondary-container' : order.status === 'Cancelled' ? 'bg-error-container text-on-error-container' : 'bg-surface-variant text-on-surface'}`}>
                        <span className="material-symbols-outlined text-[14px]">
                          {['Pending', 'Processing'].includes(order.status) ? 'pending' : order.status === 'Shipped' ? 'local_shipping' : order.status === 'Cancelled' ? 'cancel' : 'check_circle'}
                        </span>
                        {order.status}
                      </span>
                    </div>

                    <div className="flex flex-col mt-xs bg-surface-container-low p-sm rounded-md">
                      {order.items && order.items.slice(0, 2).map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-1">
                          <span className="font-body-sm truncate pr-2 flex-1">{item.ProductVariant?.Product?.product_name || `Item ${item.variant_id}`} (x{item.quantity})</span>
                          <span className="font-body-sm">{formatPrice(item.price_at_purchase || item.price)}</span>
                        </div>
                      ))}
                      {order.items && order.items.length > 2 && (
                        <div className="font-body-sm text-on-surface-variant text-center mt-1">+{order.items.length - 2} more items</div>
                      )}
                    </div>

                    <div className="mt-auto pt-sm border-t border-outline-variant flex justify-between items-center">
                      <span className="font-headline-md text-headline-md text-on-background">{formatPrice(order.total_amount)}</span>
                      {['Pending', 'Processing'].includes(order.status) && (
                        <button 
                          onClick={() => requestCancelOrder(order.order_id)}
                          className="font-label-md text-label-md text-error hover:bg-error-container px-sm py-1 rounded transition-colors"
                        >Cancel</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Cancel Confirm Modal */}
            {cancelOrderId && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-md">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl w-[90%] max-w-[400px] p-xl text-center space-y-md animate-fade-in flex flex-col items-center">
                  <div className="w-16 h-16 bg-error-container text-on-error-container rounded-full flex items-center justify-center mb-sm">
                    <span className="material-symbols-outlined text-[32px]">warning</span>
                  </div>
                  <h3 className="font-headline-md text-on-surface">Cancel Order?</h3>
                  <p className="font-body-md text-on-surface-variant">
                    Are you sure you want to cancel Order #{cancelOrderId}? This action cannot be undone.
                  </p>
                  <div className="flex gap-sm justify-center w-full pt-md">
                    <button 
                      onClick={() => setCancelOrderId(null)} 
                      className="flex-1 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-md hover:bg-surface-container transition-colors"
                    >
                      No, Keep It
                    </button>
                    <button 
                      onClick={confirmCancelOrder} 
                      className="flex-1 py-2 rounded-lg bg-error text-on-error font-label-md hover:opacity-90 transition-opacity"
                    >
                      Yes, Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── PROFILE TAB ─── */}
        {activeTab === 'profile' && <ProfileTab />}

        {/* ─── ADDRESSES TAB ─── */}
        {activeTab === 'addresses' && <AddressesTab />}

        {/* ─── CHANGE PASSWORD TAB ─── */}
        {activeTab === 'password' && <ChangePasswordTab />}
      </main>
    </div>
  );
};

/* ──────────────────────────────────────────────
   Sub-component: Profile Tab 
   ────────────────────────────────────────────── */
const ProfileTab = () => {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', { fullName });
      updateUser(res.data.data.user); // Refresh user context locally
      alert('Profile updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md md:p-lg">
      <h2 className="font-headline-md text-on-background mb-md">My Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-md max-w-[448px]">
        <div>
          <label className="block font-label-md text-on-surface-variant mb-1">Email</label>
          <input type="email" disabled value={user?.email || ''} className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-md text-on-surface-variant cursor-not-allowed" />
        </div>
        <div>
          <label className="block font-label-md text-on-surface-variant mb-1">Full Name</label>
          <input 
            type="text" 
            required 
            value={fullName} 
            onChange={e => setFullName(e.target.value)} 
            className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md" 
          />
        </div>
        <button 
          type="submit" 
          disabled={loading || fullName === user?.fullName}
          className="bg-primary text-on-primary font-label-md py-2 px-lg rounded-lg hover:bg-inverse-surface transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </section>
  );
};

/* ──────────────────────────────────────────────
   Sub-component: Addresses Tab 
   ────────────────────────────────────────────── */
const AddressesTab = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ city: '', street: '', specifiable_address: '' });

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch addresses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAddresses(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/addresses/${editingId}`, form);
      } else {
        await api.post('/addresses', form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ city: '', street: '', specifiable_address: '' });
      fetchAddresses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save address.');
    }
  };

  const handleEdit = (addr) => {
    setEditingId(addr.address_id);
    setForm({ city: addr.city, street: addr.street, specifiable_address: addr.specifiable_address });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this address?')) {
      try {
        await api.delete(`/addresses/${id}`);
        fetchAddresses();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete address.');
      }
    }
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-md">
        <h2 className="font-headline-md text-on-background">My Addresses</h2>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ city: '', street: '', specifiable_address: '' }); }}
          className="bg-primary text-on-primary px-md py-2 rounded-lg font-label-md hover:bg-inverse-surface transition-colors flex items-center gap-xs">
          <span className="material-symbols-outlined text-[18px]">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancel' : 'Add Address'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md mb-md space-y-sm max-w-[520px]">
          <div>
            <label className="block font-label-md text-on-surface-variant mb-1">City</label>
            <input name="city" required value={form.city} onChange={handleChange} className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md" />
          </div>
          <div>
            <label className="block font-label-md text-on-surface-variant mb-1">Street</label>
            <input name="street" required value={form.street} onChange={handleChange} className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md" />
          </div>
          <div>
            <label className="block font-label-md text-on-surface-variant mb-1">Full Address</label>
            <input name="specifiable_address" required value={form.specifiable_address} onChange={handleChange} className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md" />
          </div>
          <button type="submit" className="bg-secondary text-on-secondary px-lg py-2 rounded-lg font-label-md">
            {editingId ? 'Update' : 'Save'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-xl"><span className="material-symbols-outlined animate-spin text-[32px] text-secondary">progress_activity</span></div>
      ) : addresses.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-xl text-center text-on-surface-variant">No addresses saved yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {addresses.map((addr) => (
            <div key={addr.address_id} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md flex flex-col gap-xs">
              <div className="flex items-start gap-xs">
                <span className="material-symbols-outlined text-secondary mt-0.5">location_on</span>
                <div>
                  <p className="font-body-md font-bold text-on-background">{addr.specifiable_address}</p>
                  <p className="font-body-sm text-on-surface-variant">{addr.street}, {addr.city}</p>
                </div>
              </div>
              <div className="flex gap-sm mt-sm">
                <button onClick={() => handleEdit(addr)} className="text-secondary font-label-md hover:underline">Edit</button>
                <button onClick={() => handleDelete(addr.address_id)} className="text-error font-label-md hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

/* ──────────────────────────────────────────────
   Sub-component: Change Password Tab 
   ────────────────────────────────────────────── */
const ChangePasswordTab = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setLoading(true);
    try {
      await api.post('/auth/change-password', form);
      setMsg({ type: 'success', text: 'Password changed successfully!' });
      setForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md md:p-lg">
      <h2 className="font-headline-md text-on-background mb-md">Change Password</h2>
      {msg.text && (
        <div className={`p-sm rounded-lg mb-md text-body-sm ${msg.type === 'success' ? 'bg-[#10B981]/10 border border-[#10B981]/30 text-[#047857]' : 'bg-error-container text-on-error-container'}`}>{msg.text}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-md max-w-[448px]">
        <div>
          <label className="block font-label-md text-on-surface-variant mb-1">Current Password</label>
          <input type="password" name="currentPassword" required value={form.currentPassword} onChange={handleChange}
            className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md" />
        </div>
        <div>
          <label className="block font-label-md text-on-surface-variant mb-1">New Password (min 8 chars)</label>
          <input type="password" name="newPassword" required minLength={8} value={form.newPassword} onChange={handleChange}
            className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md" />
        </div>
        <button type="submit" disabled={loading}
          className="bg-primary text-on-primary py-2 px-lg rounded-lg font-label-md hover:bg-inverse-surface transition-colors disabled:opacity-70 flex items-center gap-xs">
          {loading ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : 'Change Password'}
        </button>
      </form>
    </section>
  );
};

export default CustomerDashboard;

