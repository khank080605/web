import { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
    productsInStock: 0
  });
  
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch these from specific endpoints
    // Mocking the stats for now, fetching recent orders
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch all orders for admin
        const ordersRes = await api.get('/orders/admin/all');
        const payload = ordersRes.data.data || ordersRes.data || {};
        const orders = Array.isArray(payload) ? payload : payload.orders || [];
        
        // Calculate some basic stats
        const revenue = orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);

        // Fetch products count
        let productCount = 0;
        try {
          const prodRes = await api.get('/products', { params: { limit: 1 } });
          const prodData = prodRes.data.data || prodRes.data || {};
          productCount = prodData.totalItems || 0;
        } catch (e) { /* ignore */ }

        // Fetch users count
        let userCount = 0;
        try {
          const userRes = await api.get('/admin/users', { params: { limit: 1 } });
          const userData = userRes.data.data || userRes.data || {};
          userCount = userData.totalItems || (userData.users || []).length || 0;
        } catch (e) { /* ignore */ }
        
        setStats({
          totalOrders: orders.length,
          totalRevenue: revenue,
          activeUsers: userCount,
          productsInStock: productCount
        });
        
        // Get 5 most recent orders
        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
         <span className="material-symbols-outlined animate-spin text-[40px] text-secondary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="p-xl space-y-xl">
      {/* Stats Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* Stat Card: Total Orders */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-sm">
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">shopping_cart_checkout</span>
            </div>
            <span className="bg-secondary-container text-on-secondary-container font-label-md text-label-md px-2 py-1 rounded-full flex items-center">
              <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span> +12%
            </span>
          </div>
          <div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-1">Total Orders</p>
            <h3 className="font-display-lg text-display-lg text-primary">{stats.totalOrders}</h3>
          </div>
        </div>

        {/* Stat Card: Total Revenue */}
        <div className="bg-primary text-on-primary rounded-xl p-md flex flex-col justify-between shadow-md relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary-fixed-dim opacity-20 rounded-full"></div>
          <div className="absolute right-8 bottom-8 w-16 h-16 bg-secondary-fixed opacity-20 rounded-full"></div>
          <div className="flex justify-between items-start mb-sm relative z-10">
            <div className="w-10 h-10 rounded-full bg-primary-fixed-variant flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <span className="bg-surface-container-highest text-primary font-label-md text-label-md px-2 py-1 rounded-full flex items-center">
              <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span> +8.5%
            </span>
          </div>
          <div className="relative z-10">
            <p className="font-body-sm text-body-sm text-primary-fixed opacity-90 mb-1">Total Revenue</p>
            <h3 className="font-display-lg text-display-lg text-on-primary">{formatPrice(stats.totalRevenue)}</h3>
          </div>
        </div>

        {/* Stat Card: Active Users */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-sm">
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">group_add</span>
            </div>
            <span className="bg-secondary-container text-on-secondary-container font-label-md text-label-md px-2 py-1 rounded-full flex items-center">
              <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span> +24%
            </span>
          </div>
          <div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-1">Active Users</p>
            <h3 className="font-display-lg text-display-lg text-primary">{stats.activeUsers}</h3>
          </div>
        </div>

        {/* Stat Card: Products in Stock */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-sm">
            <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center text-on-error-container">
              <span className="material-symbols-outlined">inventory</span>
            </div>
            <span className="bg-error-container text-on-error-container font-label-md text-label-md px-2 py-1 rounded-full flex items-center">
              <span className="material-symbols-outlined text-[14px] mr-1">trending_down</span> -2%
            </span>
          </div>
          <div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-1">Products in Stock</p>
            <h3 className="font-display-lg text-display-lg text-primary">{stats.productsInStock}</h3>
          </div>
        </div>
      </section>

      {/* Complex Layout Area: Table & Chart */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
            <h3 className="font-headline-sm text-headline-sm text-primary">Recent Orders</h3>
            <button className="font-label-md text-label-md text-secondary hover:text-on-secondary-container transition-colors flex items-center">
              View All <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-outline-variant">
                  <th className="py-sm px-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Order ID</th>
                  <th className="py-sm px-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Customer</th>
                  <th className="py-sm px-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Date</th>
                  <th className="py-sm px-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="py-sm px-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-outline-variant bg-surface-container-lowest">
                {recentOrders.length > 0 ? recentOrders.map(order => (
                  <tr key={order.order_id} className="hover:bg-inverse-on-surface transition-colors">
                    <td className="py-sm px-md font-bold">#{order.order_id}</td>
                    <td className="py-sm px-md">{order.items?.[0]?.product_name || `User ${order.user_id}`}</td>
                    <td className="py-sm px-md text-on-surface-variant">{formatDate(order.order_date)}</td>
                    <td className="py-sm px-md">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'Delivered' ? 'bg-[#10B981]/20 text-[#047857] border border-[#10B981]/30'
                        : order.status === 'Cancelled' ? 'bg-error-container text-on-error-container'
                        : order.status === 'Shipping' ? 'bg-[#3B82F6]/20 text-[#1D4ED8] border border-[#3B82F6]/30'
                        : 'bg-surface-container-high text-on-surface-variant border border-outline-variant'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-sm px-md text-right font-semibold">{formatPrice(order.total_amount)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="py-md text-center text-on-surface-variant">No recent orders.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Categories Chart Graphic (Mocked) */}
        <div className="lg:col-span-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-headline-sm text-headline-sm text-primary">Top Categories</h3>
            <button className="text-outline hover:text-primary transition-colors">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center py-md relative">
            <div className="w-48 h-48 rounded-full border-[16px] border-surface-container-high relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[16px] border-primary border-t-transparent border-r-transparent rotate-45 opacity-90"></div>
              <div className="absolute inset-0 rounded-full border-[16px] border-secondary border-b-transparent border-l-transparent -rotate-12 opacity-80"></div>
              <div className="text-center">
                <span className="block font-headline-md text-headline-md text-primary">85%</span>
                <span className="block font-label-md text-label-md text-on-surface-variant uppercase">Conversion</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-sm mt-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-primary mr-sm"></span>
                <span className="font-body-sm text-body-sm text-on-surface">Eyeglasses</span>
              </div>
              <span className="font-label-md text-label-md text-primary">45%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-secondary mr-sm"></span>
                <span className="font-body-sm text-body-sm text-on-surface">Sunglasses</span>
              </div>
              <span className="font-label-md text-label-md text-primary">30%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-surface-container-high mr-sm"></span>
                <span className="font-body-sm text-body-sm text-on-surface">Contact Lenses</span>
              </div>
              <span className="font-label-md text-label-md text-primary">25%</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
