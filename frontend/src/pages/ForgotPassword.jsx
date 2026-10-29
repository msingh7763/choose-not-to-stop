import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetUrl('');
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword({ email });
      const resetLink = response.data.resetUrl || '';
      setMessage(response.data.message || 'Reset link generated. Check your email.');
      setResetUrl(resetLink);

      navigate('/link-sent', {
        state: {
          kind: 'reset',
          title: 'Reset link sent',
          message: response.data.message || 'Reset link generated. Check your email.',
          link: resetLink,
          primaryLabel: 'Back to sign in',
          primaryTo: '/login',
        },
      });
    } catch (apiError) {
      const validationMessage = apiError.response?.data?.errors?.[0]?.message;
      setError(validationMessage || apiError.response?.data?.message || 'Unable to process request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#DCE1DA] via-[#F4DDD5] to-[#DCE1DA] p-4">
      <div className="glass-strong w-full max-w-md p-8 border border-[#A4BBAC]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-black mb-2" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
            Reset Password
          </h1>
          <p className="text-black font-semibold">Enter your account email to generate a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-[#ECB7B3]/40 border border-[#8E929B] text-black font-semibold px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-[#A4BBAC]/30 border border-[#8E929B] text-black font-semibold px-4 py-3 rounded-lg break-words text-sm">
              <p>{message}</p>
              {resetUrl && (
                <a className="underline mt-2 inline-block font-bold" href={resetUrl}>
                  Open reset link
                </a>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field text-black font-medium"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-center"
          >
            {loading ? 'Generating link...' : 'Generate Reset Link'}
          </button>
        </form>

        <p className="mt-6 text-center text-black font-medium">
          Back to{' '}
          <Link to="/login" className="text-black font-black hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
