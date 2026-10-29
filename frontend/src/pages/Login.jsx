import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [verificationInfo, setVerificationInfo] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      setNotice(location.state.message);
    }
  }, [location.state]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
      if (result.verificationRequired) {
        setVerificationInfo('Your account is not verified yet. Use the button below to resend the verification email.');
      } else {
        setVerificationInfo('');
      }
    }

    setLoading(false);
  };

  const handleResendVerification = async () => {
    setError('');
    setVerificationInfo('');
    setResendLoading(true);

    try {
      const response = await authAPI.resendVerification({ email: formData.email });
      navigate('/link-sent', {
        state: {
          kind: 'verification',
          title: 'Verification email sent',
          message: response.data.message || 'We sent a verification email if the account exists.',
          link: response.data.verificationUrl || '',
          primaryLabel: 'Back to sign in',
          primaryTo: '/login',
        },
      });
    } catch (apiError) {
      const validationMessage = apiError.response?.data?.errors?.[0]?.message;
      setError(validationMessage || apiError.response?.data?.message || 'Unable to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#DCE1DA] via-[#F4DDD5] to-[#DCE1DA] p-4">
      <div className="glass-strong w-full max-w-md p-8 border border-[#A4BBAC]">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-black mb-2" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
            Choose Not To Stop
          </h1>
          <p className="text-black font-semibold">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {notice && (
            <div className="bg-[#A4BBAC]/30 border border-[#8E929B] text-black font-semibold px-4 py-3 rounded-lg text-sm">
              {notice}
            </div>
          )}

          {error && (
            <div className="bg-[#ECB7B3]/40 border border-[#8E929B] text-black font-semibold px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-black mb-2">
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
            <label className="block text-sm font-bold text-black mb-2">
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
            <div className="mt-2 text-right">
              <Link to="/forgot-password" className="text-sm text-black font-bold hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-center"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {verificationInfo && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading || !formData.email}
                className="w-full btn-secondary text-center"
              >
                {resendLoading ? 'Sending verification email...' : 'Resend verification email'}
              </button>
            </div>
          )}
        </form>

        <p className="mt-6 text-center text-black font-medium">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-black font-black hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
