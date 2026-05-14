import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'staff')) {
    // Basic redirect if not admin
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-surface-container-lowest p-xl rounded-xl shadow-md text-center">
          <h1 className="text-headline-md text-error mb-sm">Access Denied</h1>
          <p className="text-body-md text-on-surface-variant mb-md">You do not have permission to view this page.</p>
          <Link to="/" className="bg-primary text-on-primary px-lg py-2 rounded-md">Return Home</Link>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'bg-secondary-container text-on-secondary-container font-bold' : 'text-on-primary-container opacity-80 hover:opacity-100 hover:bg-on-primary-fixed-variant';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background font-body-md text-on-background">
      {/* SideNavBar */}
      <nav className="bg-primary-container text-on-primary w-64 shadow-md fixed left-0 top-0 h-screen flex flex-col py-md px-sm z-50">
        {/* Header */}
        <div className="mb-xl flex flex-col items-center text-center mt-md">
          <div className="w-16 h-16 rounded-full mb-sm bg-secondary flex items-center justify-center text-on-secondary border-2 border-on-primary">
            <span className="material-symbols-outlined text-[32px]">admin_panel_settings</span>
          </div>
          <h1 className="text-headline-sm font-headline-lg text-on-primary">Glasscart Admin</h1>
          <p className="font-body-sm text-body-sm opacity-80">Management Portal</p>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto">
          <ul className="space-y-sm">
            <li>
              <Link to="/admin" className={`flex items-center px-sm py-xs rounded-lg transition-all ${location.pathname === '/admin' ? 'bg-secondary-container text-on-secondary-container font-bold' : 'text-on-primary-container opacity-80 hover:opacity-100 hover:bg-on-primary-fixed-variant'}`}>
                <span className="material-symbols-outlined mr-sm" style={{fontVariationSettings: "'FILL' 1"}}>dashboard</span>
                <span className="font-label-md text-label-md">Dashboard</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/products" className={`flex items-center px-sm py-xs rounded-lg transition-all ${isActive('/admin/products')}`}>
                <span className="material-symbols-outlined mr-sm">inventory_2</span>
                <span className="font-label-md text-label-md">Products</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/orders" className={`flex items-center px-sm py-xs rounded-lg transition-all ${isActive('/admin/orders')}`}>
                <span className="material-symbols-outlined mr-sm">shopping_bag</span>
                <span className="font-label-md text-label-md">Orders</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/users" className={`flex items-center px-sm py-xs rounded-lg transition-all ${isActive('/admin/users')}`}>
                <span className="material-symbols-outlined mr-sm">group</span>
                <span className="font-label-md text-label-md">Users</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/categories" className={`flex items-center px-sm py-xs rounded-lg transition-all ${isActive('/admin/categories')}`}>
                <span className="material-symbols-outlined mr-sm">category</span>
                <span className="font-label-md text-label-md">Categories</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/brands" className={`flex items-center px-sm py-xs rounded-lg transition-all ${isActive('/admin/brands')}`}>
                <span className="material-symbols-outlined mr-sm">verified</span>
                <span className="font-label-md text-label-md">Brands</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/discounts" className={`flex items-center px-sm py-xs rounded-lg transition-all ${isActive('/admin/discounts')}`}>
                <span className="material-symbols-outlined mr-sm">sell</span>
                <span className="font-label-md text-label-md">Discounts</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Footer Navigation */}
        <div className="mt-auto pt-md border-t border-on-primary-fixed-variant">
          <ul className="space-y-sm">
            <li>
              <Link to="/" className="flex items-center px-sm py-xs text-on-primary-container opacity-80 hover:opacity-100 hover:bg-on-primary-fixed-variant transition-all rounded-lg">
                <span className="material-symbols-outlined mr-sm">storefront</span>
                <span className="font-label-md text-label-md">View Store</span>
              </Link>
            </li>
            <li>
              <button onClick={handleLogout} className="w-full flex items-center px-sm py-xs text-on-primary-container opacity-80 hover:opacity-100 hover:bg-on-primary-fixed-variant transition-all rounded-lg">
                <span className="material-symbols-outlined mr-sm">logout</span>
                <span className="font-label-md text-label-md">Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        {/* Admin Header */}
        <header className="bg-surface-container-lowest border-b border-outline-variant py-sm px-xl flex justify-between items-center z-10 sticky top-0 h-20 shrink-0">
          <div>
            <h2 className="font-headline-md text-headline-md text-primary">Admin Portal</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Welcome back, {user?.fullName || user?.name || 'Admin'}.</p>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
