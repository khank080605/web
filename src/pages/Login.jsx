import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Try customer login first
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user } = res.data.data || res.data;
      login(user || { email, role: 'customer' }, accessToken);
      navigate(returnTo);
      setLoading(false);
      return;
    } catch (customerErr) {
      // Only try admin login if customer login returned 401 (wrong creds) or 404 (user not found)
      // 401/404 = valid attempt, fallback to admin. Other errors = network/server issue.
      const status = customerErr.response?.status;
      if (status === 401 || status === 404 || status === 400) {
        try {
          const res = await api.post('/admin/login', { email, password });
          const { accessToken, user } = res.data.data || res.data;
          login(user || { email, role: 'admin' }, accessToken);
          navigate(returnTo === '/' ? '/admin' : returnTo);
          setLoading(false);
          return;
        } catch (adminErr) {
          // Both failed — show a single clean error, not two
          const msg = adminErr.response?.data?.message
            || customerErr.response?.data?.message
            || 'Invalid email or password.';
          setError(msg);
        }
      } else {
        setError(customerErr.response?.data?.message || 'Login failed. Please try again.');
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center py-xl min-h-[70vh]">
      <div className="w-full max-w-[448px] bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm">
        <div className="text-center mb-lg">
          <h1 className="text-headline-lg font-headline-lg text-primary">Welcome Back</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Sign in to your Glasscart account</p>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container p-sm rounded-lg mb-md text-body-sm">{error}</div>
        )}

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
          <div>
            <label className="block font-label-md text-primary mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-sm py-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center text-body-sm text-on-surface-variant">
              <input type="checkbox" className="mr-2 text-secondary focus:ring-secondary border-outline-variant rounded" />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-label-md text-secondary hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-md hover:bg-inverse-surface transition-colors disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-body-sm text-on-surface-variant mt-lg">
          Don't have an account?{' '}
          <Link to="/register" className="text-secondary font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
