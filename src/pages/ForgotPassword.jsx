import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-xl min-h-[70vh]">
      <div className="w-full max-w-[448px] bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm">
        <div className="text-center mb-lg">
          <span className="material-symbols-outlined text-[48px] text-secondary mb-sm">lock_reset</span>
          <h1 className="text-headline-lg font-headline-lg text-primary">Forgot Password</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Enter your email to receive a password reset OTP</p>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container p-sm rounded-lg mb-md text-body-sm">{error}</div>
        )}

        {submitted ? (
          <div className="text-center space-y-md">
            <div className="bg-[#10B981]/10 border border-[#10B981]/30 text-[#047857] p-md rounded-lg text-body-sm">
              <span className="material-symbols-outlined text-[20px] align-middle mr-1">check_circle</span>
              OTP has been sent to <strong>{email}</strong>. Check your terminal/log for the code.
            </div>
            <Link to="/reset-password" state={{ email }} className="inline-block bg-primary text-on-primary px-lg py-2 rounded-lg font-label-md hover:bg-inverse-surface transition-colors">
              Enter OTP & Reset Password
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-md">
            <div>
              <label className="block font-label-md text-primary mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full px-sm py-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-md hover:bg-inverse-surface transition-colors disabled:opacity-70 flex justify-center items-center"
            >
              {loading ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : 'Send OTP'}
            </button>
          </form>
        )}

        <p className="text-center text-body-sm text-on-surface-variant mt-lg">
          Remember your password?{' '}
          <Link to="/login" className="text-secondary font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
