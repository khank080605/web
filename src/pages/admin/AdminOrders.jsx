import { useState, useEffect } from 'react';
import api from '../../services/api';

// Must match backend ORDER_STATUS exactly
const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Shipping', 'Delivered', 'Cancelled'];

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Pending': return 'bg-surface-container-high text-on-surface-variant border border-outline-variant';
    case 'Confirmed': return 'bg-secondary-container text-on-secondary-container';
    case 'Shipping': return 'bg-[#3B82F6]/20 text-[#1D4ED8] border border-[#3B82F6]/30';
    case 'Delivered': return 'bg-[#10B981]/20 text-[#047857] border border-[#10B981]/30';
    case 'Cancelled': return 'bg-error-container text-on-error-container';
    default: return 'bg-surface-variant text-on-surface';
  }
};

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

/* ───────────────────────── Order Detail Modal ───────────────────────── */
const OrderDetailModal = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markingPaid, setMarkingPaid] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/orders/admin/${orderId}`);
        setOrder(res.data.data || res.data || null);
      } catch (err) {
        console.error('Failed to load order detail', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [orderId]);

  const handleMarkPaid = async () => {
    setMarkingPaid(true);
    try {
      await api.patch(`/orders/admin/${orderId}/mark-paid`);
      setOrder(prev => ({ ...prev, payment_status: 'Paid' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not mark as paid.');
    } finally {
      setMarkingPaid(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-md">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-md border-b border-outline-variant sticky top-0 bg-surface-container-lowest z-10">
          <h3 className="font-headline-sm text-on-surface">Order #{orderId}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-xl">
            <span className="material-symbols-outlined animate-spin text-[36px] text-secondary">progress_activity</span>
          </div>
        ) : !order ? (
          <div className="p-xl text-center text-on-surface-variant">Failed to load order details.</div>
        ) : (
          <div className="p-md space-y-md">
            {/* Status + Payment Row */}
            <div className="flex flex-wrap items-center gap-sm">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(order.status)}`}>
                {order.status}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${order.payment_status === 'Paid' ? 'bg-[#10B981]/20 text-[#047857] border border-[#10B981]/30' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant'}`}>
                {order.payment_status === 'Paid' ? '✓ Paid' : '⏳ Unpaid'}
              </span>
              {order.payment_status !== 'Paid' && (
                <button onClick={handleMarkPaid} disabled={markingPaid}
                  className="ml-auto flex items-center gap-1 bg-[#10B981] text-white px-md py-1 rounded-lg font-label-md text-sm hover:bg-[#047857] transition-colors disabled:opacity-50">
                  {markingPaid
                    ? <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                    : <span className="material-symbols-outlined text-[16px]">payments</span>}
                  Mark as Paid
                </button>
              )}
            </div>

            {/* Customer Info */}
            <div className="bg-surface-container p-sm rounded-lg grid grid-cols-2 gap-xs text-body-sm">
              <div>
                <p className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider text-xs mb-1">Customer</p>
                <p className="font-semibold text-on-surface">
                  {order.user?.full_name || order.user?.user_name || order.user?.email || order.User?.full_name || order.User?.user_name || order.User?.email || 'N/A'}
                </p>
                <p className="text-on-surface-variant">
                  {order.user?.email || order.User?.email || order.user?.user_name || order.User?.user_name || ''}
                </p>
              </div>
              <div>
                <p className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider text-xs mb-1">Order Date</p>
                <p className="text-on-surface">{formatDate(order.order_date)}</p>
              </div>
              {order.address && (
                <div className="col-span-2">
                  <p className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider text-xs mb-1">Shipping Address</p>
                  <p className="text-on-surface">{order.address.specifiable_address}, {order.address.street}, {order.address.city}</p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div>
              <p className="font-label-md text-label-md uppercase tracking-wider text-xs text-on-surface-variant mb-sm">Items</p>
              <div className="space-y-xs">
                {(order.items || []).map((item, i) => (
                  <div key={i} className="flex items-center gap-sm bg-surface-container p-sm rounded-lg">
                    <div className="w-10 h-10 rounded bg-surface-container-high overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img src={item.image.startsWith('http') ? item.image : `http://localhost:3000/uploads/${item.image}`}
                          alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-outline-variant m-auto block text-[20px] pt-1.5 text-center">image</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-body-sm text-on-surface truncate">
                        {item.product_name || `Variant #${item.variant_id}`}
                      </p>
                      <p className="text-xs text-on-surface-variant">Qty: {item.quantity} × {formatPrice(item.price_at_purchase)}</p>
                    </div>
                    <p className="font-semibold text-on-surface text-body-sm">{formatPrice(item.price_at_purchase * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-outline-variant pt-sm flex justify-between items-center">
              <span className="font-headline-sm text-on-surface">Total</span>
              <span className="font-headline-md text-primary">{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ───────────────────────── AdminOrders Main ─────────────────────────── */
const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const [page, setPage] = useState(1);
  const limit = 15;
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/admin/all', { params: { page, limit } });
      const responseData = res.data.data || {};
      const rawOrders = responseData.orders || [];
      setOrders(Array.isArray(rawOrders) ? rawOrders : []);
      setTotalPages(responseData.totalPages || 1);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page]);

  const updateOrderStatus = async (orderId, newStatus) => {
    setStatusUpdating(orderId);
    try {
      await api.patch(`/orders/admin/${orderId}/status`, { status: newStatus });
      // Refresh from server to get correct state
      await fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update order status.');
    } finally {
      setStatusUpdating(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <header className="bg-surface-container-lowest border-b border-outline-variant px-lg py-sm flex items-center justify-between z-10 shrink-0 h-20">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Order Management</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Track and manage all customer orders.</p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-lg bg-surface">
        <div className="max-w-container-max mx-auto space-y-md">
          <div className="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
                    <th className="py-sm px-md font-semibold">Order ID</th>
                    <th className="py-sm px-md font-semibold">Customer</th>
                    <th className="py-sm px-md font-semibold">Date</th>
                    <th className="py-sm px-md font-semibold text-right">Amount</th>
                    <th className="py-sm px-md font-semibold">Payment</th>
                    <th className="py-sm px-md font-semibold">Status</th>
                    <th className="py-sm px-md font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-on-surface font-body-sm text-body-sm">
                  {loading ? (
                    <tr><td colSpan="7" className="py-xl text-center">
                      <span className="material-symbols-outlined animate-spin text-[32px] text-secondary">progress_activity</span>
                    </td></tr>
                  ) : orders.length === 0 ? (
                    <tr><td colSpan="7" className="py-xl text-center text-on-surface-variant">No orders found.</td></tr>
                  ) : orders.map((order) => (
                    <tr key={order.order_id} className="hover:bg-secondary-container/10 transition-colors">
                      <td className="py-sm px-md">
                        <button onClick={() => setSelectedOrderId(order.order_id)}
                          className="font-bold text-secondary hover:underline">#{order.order_id}</button>
                      </td>
                      <td className="py-sm px-md">
                        <div className="font-semibold">{order.items?.[0]?.product_name || 'Customer'}</div>
                        <div className="text-on-surface-variant text-[12px]">{order.items?.length || 0} item(s)</div>
                      </td>
                      <td className="py-sm px-md text-on-surface-variant">{formatDate(order.order_date)}</td>
                      <td className="py-sm px-md text-right font-medium">{formatPrice(order.total_amount)}</td>
                      <td className="py-sm px-md">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${order.payment_status === 'Paid' ? 'bg-[#10B981]/20 text-[#047857]' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant'}`}>
                          {order.payment_status || 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-sm px-md">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-sm px-md">
                        <div className="flex items-center gap-xs">
                          <select
                            disabled={statusUpdating === order.order_id || order.status === 'Delivered' || order.status === 'Cancelled'}
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.order_id, e.target.value)}
                            className="bg-surface border border-outline-variant rounded px-2 py-1 font-body-sm text-[13px] text-on-surface focus:border-secondary outline-none disabled:opacity-50"
                          >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          {statusUpdating === order.order_id && (
                            <span className="material-symbols-outlined animate-spin text-[16px] text-secondary">progress_activity</span>
                          )}
                          <button onClick={() => setSelectedOrderId(order.order_id)}
                            className="p-1 text-on-surface-variant hover:text-secondary transition-colors" title="View Details">
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="border-t border-outline-variant bg-surface-container-lowest p-sm flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
              <div>Page {page} of {totalPages || 1}</div>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-1 border border-outline-variant rounded hover:bg-surface disabled:opacity-50 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-1 border border-outline-variant rounded hover:bg-surface disabled:opacity-50 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <OrderDetailModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
      )}
    </div>
  );
};

export default AdminOrders;
