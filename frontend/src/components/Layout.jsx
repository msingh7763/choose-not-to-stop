import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FadeIn from './FadeIn';

const Layout = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = (user?.name || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/mood', label: 'Mood', icon: '😊' },
    { path: '/journal', label: 'Journal', icon: '📝' },
    { path: '/coach', label: 'Coach', icon: '🧠' },
    { path: '/mind-care', label: 'Mind Care', icon: '✨' },
    { path: '/insights', label: 'Insights', icon: '💡' },
    { path: '/crisis', label: 'Support', icon: '💙' },
    { path: '/wall', label: 'Wall', icon: '🌐' },
  ];

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated) {
    return children;
  }

  const sidebar = (
    <aside className="w-72 h-full glass-strong border-r border-white/10 p-4 flex flex-col">
      <Link to="/" className="block mb-5 px-2">
        <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-electric-300 to-emerald-300 bg-clip-text text-transparent">
          Choose Not To Stop
        </span>
      </Link>

      <div className="px-2 pb-4 border-b border-white/10">
        <p className="text-xs text-gray-400 uppercase tracking-[0.16em]">Welcome back</p>
        <p className="text-sm mt-1 truncate font-semibold bg-gradient-to-r from-cyan-300 via-electric-300 to-emerald-300 bg-clip-text text-transparent">
          {displayName}
        </p>
      </div>

      <nav className="mt-4 space-y-1 overflow-auto pr-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
              location.pathname === item.path
                ? 'bg-electric-500 text-white shadow-lg'
                : 'text-gray-300 hover:bg-navy-700/70'
            }`}
          >
            <span className="opacity-95">{item.icon}</span>
            <span className="font-medium tracking-tight">{item.label}</span>
          </Link>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="btn-secondary mt-4"
      >
        Logout
      </button>
    </aside>
  );

  return (
    <div className="min-h-screen bg-navy-900">
      <button
        type="button"
        onClick={() => setIsMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 bg-navy-700/90 border border-navy-500 text-white px-3 py-2 rounded-lg"
      >
        Menu
      </button>

      {isMenuOpen && (
        <>
          <button
            type="button"
            className="lg:hidden fixed inset-0 bg-black/60 z-40"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          ></button>
          <div className="lg:hidden fixed inset-y-0 left-0 z-50">
            {sidebar}
          </div>
        </>
      )}

      <div className="flex min-h-screen">
        <div className="hidden lg:block">{sidebar}</div>

        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-20 lg:py-8 overflow-x-hidden relative">
          <FadeIn key={location.pathname} className="h-full">
            {children}
          </FadeIn>
        </main>
      </div>
    </div>
  );
};

export default Layout;

