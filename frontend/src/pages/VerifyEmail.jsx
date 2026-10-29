import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authAPI } from '../services/api';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verifying your email...');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await authAPI.verifyEmail(token);
        setStatus(response.data.message || 'Email verified successfully.');
        setTimeout(() => navigate('/login', { state: { message: 'Your email has been verified. Please sign in.' } }), 1400);
      } catch (apiError) {
        setError(apiError.response?.data?.message || 'Unable to verify email');
        setStatus('');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [navigate, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#DCE1DA] via-[#F4DDD5] to-[#DCE1DA] p-4">
      <div className="glass-strong w-full max-w-md p-8 text-center border border-[#A4BBAC]">
        <h1 className="text-3xl font-black text-black mb-4" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
          Email Verification
        </h1>

        {status && (
          <div className="bg-[#A4BBAC]/30 border border-[#8E929B] text-black font-semibold px-4 py-3 rounded-lg text-sm">
            {loading ? 'Verifying your email...' : status}
          </div>
        )}

        {error && (
          <div className="bg-[#ECB7B3]/40 border border-[#8E929B] text-black font-semibold px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <p className="mt-6 text-black font-medium">
          Return to{' '}
          <Link to="/login" className="text-black font-black hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
