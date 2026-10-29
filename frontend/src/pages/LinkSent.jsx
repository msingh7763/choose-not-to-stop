import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo } from 'react';

const LinkSent = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const data = useMemo(() => {
    const state = location.state || {};
    return {
      kind: state.kind || 'info',
      title: state.title || 'Link sent',
      message: state.message || 'We generated a secure link for you.',
      link: state.link || '',
      primaryLabel: state.primaryLabel || 'Back to sign in',
      primaryTo: state.primaryTo || '/login',
    };
  }, [location.state]);

  useEffect(() => {
    if (!location.state) {
      navigate('/login', { replace: true });
    }
  }, [location.state, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#DCE1DA] via-[#F4DDD5] to-[#DCE1DA] p-4">
      <div className="glass-strong w-full max-w-md p-8 border border-[#A4BBAC]">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black text-black mb-2" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
            {data.title}
          </h1>
          <p className="text-black font-semibold">
            {data.kind === 'verification' ? 'Check your inbox to finish setup.' : 'Use the link below to continue.'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg border bg-[#A4BBAC]/30 border-[#8E929B] text-black font-semibold">
            <p className="text-sm leading-6">{data.message}</p>
          </div>

          {data.link && (
            <div className="p-4 rounded-lg border bg-white border-[#8E929B] text-black">
              <p className="text-xs uppercase tracking-[0.16em] text-black font-bold mb-2">Direct link</p>
              <a
                href={data.link}
                className="block break-all text-sm font-bold text-black underline"
              >
                {data.link}
              </a>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {data.link && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(data.link);
                  } catch {
                    // No-op; link is shown above.
                  }
                }}
                className="btn-secondary w-full text-center"
              >
                Copy link
              </button>
            )}

            <Link to={data.primaryTo} className="btn-primary w-full text-center">
              {data.primaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkSent;
