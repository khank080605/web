import { useState, useEffect } from 'react';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [banTarget, setBanTarget] = useState(null); // { userId, currentStatus }

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { page, limit } });
      const responseData = res.data.data || res.data || {};
      const rawUsers = responseData.users || [];
      setUsers(Array.isArray(rawUsers) ? rawUsers : []);
      setTotalPages(responseData.totalPages || 1);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const confirmToggleActive = async () => {
    if (!banTarget) return;
    const { userId, currentStatus } = banTarget;
    setUpdatingId(userId);
    try {
      await api.patch(`/admin/users/${userId}/active`, { is_active: !currentStatus });
      setUsers(prev => prev.map(user =>
        user.id === userId ? { ...user, isActive: !currentStatus } : user
      ));
    } catch (err) {
      console.error('Failed to update user status', err);
      alert(err.response?.data?.message || 'Could not update user status.');
    } finally {
      setUpdatingId(null);
      setBanTarget(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (err) {
      console.error('Failed to update user role', err);
      alert(err.response?.data?.message || 'Could not update user role.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <header className="bg-surface-container-lowest border-b border-outline-variant px-lg py-sm flex items-center justify-between z-10 shrink-0 h-20">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">User Management</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Manage accounts, roles, and permissions.</p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-lg bg-surface">
        <div className="max-w-container-max mx-auto space-y-md">
          <div className="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
                    <th className="py-sm px-md font-semibold">ID</th>
                    <th className="py-sm px-md font-semibold">User Details</th>
                    <th className="py-sm px-md font-semibold">Username</th>
                    <th className="py-sm px-md font-semibold">Phone</th>
                    <th className="py-sm px-md font-semibold">Role</th>
                    <th className="py-sm px-md font-semibold">Status</th>
                    <th className="py-sm px-md font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-on-surface font-body-sm text-body-sm">
                  {loading ? (
                    <tr><td colSpan="7" className="py-xl text-center">
                      <span className="material-symbols-outlined animate-spin text-[32px] text-secondary">progress_activity</span>
                    </td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan="7" className="py-xl text-center text-on-surface-variant">No users found.</td></tr>
                  ) : users.map((user) => (
                    <tr key={user.id} className="hover:bg-secondary-container/10 transition-colors">
                      <td className="py-sm px-md font-bold">{user.id}</td>
                      <td className="py-sm px-md">
                        <div className="font-semibold text-on-surface">{user.fullName}</div>
                        <div className="text-on-surface-variant text-[12px]">{user.email}</div>
                      </td>
                      <td className="py-sm px-md text-on-surface-variant">{user.userName}</td>
                      <td className="py-sm px-md text-on-surface-variant">{user.phone || 'N/A'}</td>
                      <td className="py-sm px-md">
                        <select
                          disabled={updatingId === user.id}
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="bg-surface border border-outline-variant rounded px-2 py-1 font-body-sm text-[13px] text-on-surface focus:border-secondary outline-none disabled:opacity-50"
                        >
                          <option value="customer">Customer</option>
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-sm px-md">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${user.isActive ? 'bg-[#10B981]/20 text-[#047857] border border-[#10B981]/30' : 'bg-error-container text-on-error-container border border-error/30'}`}>
                          {user.isActive ? 'Active' : 'Banned'}
                        </span>
                      </td>
                      <td className="py-sm px-md text-right">
                        <div className="flex items-center justify-end gap-2">
                          {updatingId === user.id && (
                            <span className="material-symbols-outlined animate-spin text-[16px] text-secondary mr-2">progress_activity</span>
                          )}
                          <button
                            disabled={updatingId === user.id}
                            onClick={() => setBanTarget({ userId: user.id, currentStatus: user.isActive })}
                            className={`p-1 rounded transition-colors ${user.isActive ? 'text-error hover:bg-error-container hover:text-on-error-container' : 'text-[#047857] hover:bg-[#10B981]/20 hover:text-[#047857]'} disabled:opacity-50`}
                            title={user.isActive ? 'Ban User' : 'Unban User'}
                          >
                            <span className="material-symbols-outlined text-[20px]">{user.isActive ? 'block' : 'check_circle'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
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

      <ConfirmModal
        open={!!banTarget}
        title={banTarget?.currentStatus ? 'Ban User' : 'Unban User'}
        message={banTarget?.currentStatus
          ? 'Are you sure you want to ban this user? They will not be able to access their account.'
          : 'Are you sure you want to unban this user? They will regain access to their account.'}
        confirmText={banTarget?.currentStatus ? 'Ban' : 'Unban'}
        variant={banTarget?.currentStatus ? 'danger' : 'default'}
        onConfirm={confirmToggleActive}
        onCancel={() => setBanTarget(null)}
      />
    </div>
  );
};

export default AdminUsers;
