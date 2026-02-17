import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Clock, Activity, Menu, X } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Discover', Icon: Search },
  { to: '/history', label: 'History', Icon: Clock },
  { to: '/status', label: 'Status', Icon: Activity },
];

export default function Header() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-transparent">
        <div
          className="relative max-w-5xl mx-auto px-5 h-14 flex items-center justify-between
                     bg-white border-b border-x border-ink-200 rounded-b-2xl"
          style={{ boxShadow: '0 6px 28px rgba(0,0,0,0.06)' }}
        >
          <Link to="/" className="flex-shrink-0 flex items-center gap-2">
            <img
            src="/vendor-lens-logo-sm.png"
            alt=""
            width="42" height="33"
            className="h-8 w-auto"
            fetchPriority="high"
          />
            <span className="font-bold text-ink-950 tracking-tight text-[15px]">VendorLens</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-2">
            {NAV.map(({ to, label, Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors
                    ${active
                      ? 'bg-ink-950 text-white'
                      : 'text-ink-500 hover:text-ink-900 hover:bg-ink-100'
                    }`}
                >
                  <Icon size={13} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <button
            className="sm:hidden p-2 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={19} />
          </button>
        </div>
      </header>
      <div
        className={`fixed inset-0 bg-black/40 z-[60] sm:hidden transition-opacity duration-300
          ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMenuOpen(false)}
      />
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white z-[70] flex flex-col sm:hidden
          transition-transform duration-300 ease-in-out
          ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ boxShadow: menuOpen ? '-8px 0 40px rgba(0,0,0,0.15)' : 'none' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <div className="flex items-center gap-2">
            <img src="/vendor-lens-logo-sm.png" alt="" width="38" height="29" className="h-7 w-auto" />
            <span className="font-bold text-ink-950 text-[14px]">VendorLens</span>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-400 hover:text-ink-800 transition-colors"
            aria-label="Close menu"
          >
            <X size={17} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label, Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-colors
                  ${active
                    ? 'bg-ink-950 text-white'
                    : 'text-ink-700 hover:bg-ink-100 hover:text-ink-950'
                  }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
