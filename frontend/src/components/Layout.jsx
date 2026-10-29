import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FadeIn from './FadeIn';

const iconClassName = 'w-5 h-5';

const NavIcons = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5.5 9.5V21h13V9.5" />
    </svg>
  ),
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="5" rx="2" />
      <rect x="13" y="10" width="8" height="11" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
    </svg>
  ),
  mood: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 14.5c1.3 1.4 2.3 2 3.5 2s2.2-.6 3.5-2" />
      <circle cx="9" cy="10" r=".8" fill="currentColor" />
      <circle cx="15" cy="10" r=".8" fill="currentColor" />
    </svg>
  ),
  journal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
      <path d="M6 3.5h10a2 2 0 0 1 2 2V20a.5.5 0 0 1-.8.4L14 18H6a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z" />
      <path d="M8 8h8M8 12h8" />
    </svg>
  ),
  coach: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
      <path d="M9.5 7.5A4.5 4.5 0 1 1 18 10.3c0 1.4-.6 2.4-1.5 3.4-.7.8-1.2 1.5-1.2 2.3H11c0-1.4.8-2.5 1.7-3.4.8-.8 1.2-1.3 1.2-2.2A2 2 0 0 0 10 10" />
      <path d="M10.5 19h4M10.8 21h3.4" />
      <path d="M6 14c-1.2-.6-2-1.8-2-3.3a4 4 0 0 1 4-4" />
    </svg>
  ),
  mindCare: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
      <path d="M12 21s-6.8-4.6-6.8-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.4-7 10-7 10Z" />
    </svg>
  ),
  insights: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
      <path d="M4 18l4.5-5 3.5 3 6-8" />
      <path d="M20 6v5h-5" />
      <path d="M4 21h16" />
    </svg>
  ),
  support: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
      <path d="M12 21s-6.5-4.3-6.5-9.5A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 6.5 3.5C18.5 16.7 12 21 12 21Z" />
      <path d="M10 12h4M12 10v4" />
    </svg>
  ),
  wall: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  ),
};

const Layout = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('theme');
  }, []);

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
    { path: '/', label: 'Home', icon: NavIcons.home },
    { path: '/dashboard', label: 'Dashboard', icon: NavIcons.dashboard },
    { path: '/mood', label: 'Mood', icon: NavIcons.mood },
    { path: '/journal', label: 'Journal', icon: NavIcons.journal },
    { path: '/coach', label: 'Coach', icon: NavIcons.coach },
    { path: '/mind-care', label: 'Mind Care', icon: NavIcons.mindCare },
    { path: '/insights', label: 'Insights', icon: NavIcons.insights },
    { path: '/crisis', label: 'Support', icon: NavIcons.support },
    { path: '/wall', label: 'Wall', icon: NavIcons.wall },
  ];

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated) {
    return children;
  }

  const sidebar = (
    <aside className="w-72 h-full p-4 flex flex-col bg-[#DCE1DA]/95 backdrop-blur-2xl border-r border-[#8E929B]/50 shadow-[0_0_25px_rgba(142,146,155,0.2)]">
      <Link to="/" className="block mb-5 px-2">
        <span className="text-2xl font-black tracking-tight text-black" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
          Choose Not To Stop
        </span>
      </Link>

      <div className="px-2 pb-4 border-b border-[#8E929B]/40">
        <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-black">
          Welcome back
        </p>
        <p className="text-sm mt-1 truncate font-bold text-black">
          {displayName}
        </p>
      </div>

      <nav className="mt-4 space-y-2 overflow-auto pr-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 font-bold ${
                isActive
                  ? 'text-black bg-[#ECB7B3] border border-[#8E929B] shadow-sm'
                  : 'text-black border border-transparent hover:border-[#8E929B]/50 hover:bg-[#F4DDD5] hover:translate-x-1'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-2.5 bottom-2.5 w-1.5 rounded-r-full bg-black"></span>
              )}
              <span className="opacity-95 transition-transform duration-300 group-hover:scale-110 text-black">
                {item.icon}
              </span>
              <span className="tracking-tight text-black">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="btn-secondary mt-4 w-full"
      >
        Logout
      </button>
    </aside>
  );

  return (
    <div className="min-h-screen bg-transparent">
      <button
        type="button"
        onClick={() => setIsMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 px-3 py-2 rounded-lg font-bold border shadow-sm bg-[#DCE1DA] border-[#8E929B] text-black"
      >
        Menu
      </button>

      {isMenuOpen && (
        <>
          <button
            type="button"
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
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
