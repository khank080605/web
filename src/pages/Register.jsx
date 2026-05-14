import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      await api.post('/auth/register', formData);
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-xl min-h-[80vh]">
      <div className="w-full max-w-[448px] bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm">
        <div className="text-center mb-lg">
          <h1 className="text-headline-lg font-headline-lg text-primary">Create Account</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Join Glasscart for premium eyewear</p>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container p-sm rounded-lg mb-md text-body-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-surface-container-low text-primary p-sm rounded-lg mb-md text-body-sm border border-secondary">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-sm">
          <div>
            <label className="block font-label-md text-primary mb-1">Full Name</label>
            <input
              type="text"
              name="fullName"
              required
              className="w-full px-sm py-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block font-label-md text-primary mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-sm py-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block font-label-md text-primary mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              required
              className="w-full px-sm py-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md"
              placeholder="0912345678"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block font-label-md text-primary mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength="8"
              className="w-full px-sm py-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md"
              placeholder="Min 8 characters"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block font-label-md text-primary mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              required
              className="w-full px-sm py-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-md hover:bg-inverse-surface transition-colors mt-md disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-body-sm text-on-surface-variant mt-lg">
          Already have an account?{' '}
          <Link to="/login" className="text-secondary font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
