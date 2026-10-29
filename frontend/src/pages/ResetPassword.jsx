import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authAPI } from '../services/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.resetPassword(token, { password });
      setMessage(response.data.message || 'Password reset successful');
      setTimeout(() => navigate('/login'), 1200);
    } catch (apiError) {
      const validationMessage = apiError.response?.data?.errors?.[0]?.message;
      setError(validationMessage || apiError.response?.data?.message || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#DCE1DA] via-[#F4DDD5] to-[#DCE1DA] p-4">
      <div className="glass-strong w-full max-w-md p-8 border border-[#A4BBAC]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-black mb-2" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
            Set New Password
          </h1>
          <p className="text-black font-semibold">Choose a strong password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-[#ECB7B3]/40 border border-[#8E929B] text-black font-semibold px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-[#A4BBAC]/30 border border-[#8E929B] text-black font-semibold px-4 py-3 rounded-lg text-sm">
              {message}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-black mb-2">
              New Password
            </label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field text-black font-medium"
              placeholder="••••••••••"
            />
            <p className="mt-2 text-xs text-black font-medium">
              Must be at least 10 chars with uppercase, lowercase, number, and special character.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="input-field text-black font-medium"
              placeholder="••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-center"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="mt-6 text-center text-black font-medium">
          Remembered it?{' '}
          <Link to="/login" className="text-black font-black hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
