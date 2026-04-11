import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordStrength = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/;

    if (!passwordStrength.test(formData.password)) {
      setError('Password must be at least 10 characters and include uppercase, lowercase, number, and special character');
      return;
    }

    setLoading(true);

    const result = await register(
      formData.name,
      formData.email,
      formData.password
    );

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900">
      <div className="w-full max-w-md p-8 glass-strong">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-transparent bg-gradient-to-r from-electric-400 to-electric-600 bg-clip-text">
            Choose Not To Stop
          </h1>
          <p className="text-gray-400">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="px-4 py-3 text-red-200 border rounded-lg bg-red-500/20 border-red-500/50">
              {error}
            </div>
          )}

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="••••••••"
            />
            <p className="mt-2 text-xs text-gray-400">
              Must be at least 10 characters and include uppercase, lowercase, number, and special character.
            </p>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-electric-400 hover:text-electric-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

