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
      navigate('/link-sent', {
        state: {
          kind: 'verification',
          title: 'Verify your email',
          message: result.message || 'Registration successful. Please verify your email before signing in.',
          link: result.verificationUrl || '',
          primaryLabel: 'Go to sign in',
          primaryTo: '/login',
        },
      });
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-[#DCE1DA] via-[#F4DDD5] to-[#DCE1DA]">
      <div className="w-full max-w-md p-8 glass-strong border border-[#A4BBAC]">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-black text-black" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
            Choose Not To Stop
          </h1>
          <p className="text-black font-semibold">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="px-4 py-3 text-sm text-black font-semibold border rounded-lg bg-[#ECB7B3]/40 border-[#8E929B]">
              {error}
            </div>
          )}

          <div>
            <label className="block mb-2 text-sm font-bold text-black">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field text-black font-medium"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-bold text-black">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field text-black font-medium"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-bold text-black">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input-field text-black font-medium"
              placeholder="••••••••"
            />
            <p className="mt-2 text-xs text-black font-medium">
              Must be at least 10 characters and include uppercase, lowercase, number, and special character.
            </p>
          </div>

          <div>
            <label className="block mb-2 text-sm font-bold text-black">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="input-field text-black font-medium"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-center"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-black font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-black font-black hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
