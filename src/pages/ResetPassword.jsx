import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const ResetPassword = () => {
  const location = useLocation();
  const [form, setForm] = useState({ email: location.state?.email || '', otp: '', newPassword: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', form);
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-xl min-h-[70vh]">
      <div className="w-full max-w-[448px] bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm">
        <div className="text-center mb-lg">
          <span className="material-symbols-outlined text-[48px] text-secondary mb-sm">password</span>
          <h1 className="text-headline-lg font-headline-lg text-primary">Reset Password</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Enter the OTP sent to your email and your new password</p>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container p-sm rounded-lg mb-md text-body-sm">{error}</div>
        )}
        {success && (
          <div className="bg-[#10B981]/10 border border-[#10B981]/30 text-[#047857] p-sm rounded-lg mb-md text-body-sm">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-md">
          <div>
            <label className="block font-label-md text-primary mb-1">Email</label>
            <input type="email" name="email" required value={form.email} onChange={handleChange}
              className="w-full px-sm py-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block font-label-md text-primary mb-1">OTP Code (6 digits)</label>
            <input type="text" name="otp" required maxLength={6} pattern="\d{6}" value={form.otp} onChange={handleChange}
              className="w-full px-sm py-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md tracking-[0.5em] text-center text-headline-md"
              placeholder="000000" />
          </div>
          <div>
            <label className="block font-label-md text-primary mb-1">New Password</label>
            <input type="password" name="newPassword" required minLength={8} value={form.newPassword} onChange={handleChange}
              className="w-full px-sm py-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md"
              placeholder="Min 8 characters" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-md hover:bg-inverse-surface transition-colors disabled:opacity-70 flex justify-center items-center">
            {loading ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : 'Reset Password'}
          </button>
        </form>

        <p className="text-center text-body-sm text-on-surface-variant mt-lg">
          <Link to="/forgot-password" className="text-secondary font-semibold hover:underline">Resend OTP</Link>
          {' · '}
          <Link to="/login" className="text-secondary font-semibold hover:underline">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
