import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { Bell, Moon, ChevronDown } from 'lucide-react';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/send': 'Send Money',
  '/transactions': 'Transactions',
  '/account': 'Account',
};

export default function Topbar() {
  const { user } = useAuth();
  const location = useLocation();

  const title = PAGE_TITLES[location.pathname] || 'Dashboard';

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="flex items-center justify-between" style={{ height: 72, padding: '0 4px' }}>
      <h1 className="text-xl sm:text-[22px] font-bold" style={{ color: '#1E1B2E' }}>{title}</h1>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: '#F0EFFB', border: 'none' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#EDEBF7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#F0EFFB'; }}
        >
          <Bell style={{ width: 18, height: 18, color: '#4B4B5A' }} />
        </button>

        <button
          className="hidden sm:flex w-10 h-10 rounded-xl items-center justify-center transition-colors"
          style={{ background: '#F0EFFB', border: 'none' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#EDEBF7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#F0EFFB'; }}
        >
          <Moon style={{ width: 18, height: 18, color: '#4B4B5A' }} />
        </button>

        <div className="flex items-center gap-2 ml-1 sm:ml-2">
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #6C4CE0, #5B3FD6)' }}
          >
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold" style={{ color: '#1E1B2E' }}>{user?.name || 'User'}</p>
          </div>
          <ChevronDown className="w-4 h-4 hidden md:block" style={{ color: '#9B98A8' }} />
        </div>
      </div>
    </header>
  );
}
