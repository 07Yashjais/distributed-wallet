import { useAuth } from '../context/AuthContext';
import { Menu, Bell, Moon, ChevronDown } from 'lucide-react';

export default function Topbar({ onMenuToggle }) {
  const { user } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="flex items-center justify-between" style={{ height: 72, padding: '0 4px' }}>
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: 'transparent', border: 'none' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#F0EFFB'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Menu className="w-6 h-6" style={{ color: '#9B98A8' }} />
        </button>
        <h1 className="text-[22px] font-bold" style={{ color: '#1E1B2E' }}>Dashboard</h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: '#F0EFFB', border: 'none' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#EDEBF7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#F0EFFB'; }}
        >
          <Bell className="w-[18px] h-[18px]" style={{ color: '#4B4B5A' }} />
        </button>

        <button
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: '#F0EFFB', border: 'none' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#EDEBF7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#F0EFFB'; }}
        >
          <Moon className="w-[18px] h-[18px]" style={{ color: '#4B4B5A' }} />
        </button>

        <div className="flex items-center gap-2.5 ml-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #6C4CE0, #5B3FD6)' }}
          >
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold" style={{ color: '#1E1B2E' }}>{user?.name || 'User'}</p>
          </div>
          <ChevronDown className="w-4 h-4 hidden sm:block" style={{ color: '#9B98A8' }} />
        </div>
      </div>
    </header>
  );
}
