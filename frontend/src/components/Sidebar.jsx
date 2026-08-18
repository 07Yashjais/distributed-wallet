import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Wallet,
  LayoutDashboard,
  CreditCard,
  Send,
  List,
  Clock,
  UserCircle,
  Settings,
  LogOut,
  ShieldCheck,
  Lock,
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: CreditCard, label: 'Wallet', path: '/wallet' },
  { icon: Send, label: 'Send Money', path: '/send' },
  { icon: List, label: 'Transactions', path: '/transactions' },
  { icon: Clock, label: 'History', path: '/history' },
  { icon: UserCircle, label: 'Profile', path: '/profile' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.2)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          width: 260,
          background: '#FFFFFF',
          boxShadow: '4px 0 24px rgba(17, 12, 46, 0.06)',
        }}
      >
        <div className="px-6 py-6 flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6C4CE0, #5B3FD6)' }}
          >
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-bold leading-tight" style={{ color: '#1E1B2E' }}>Distributed</p>
            <p className="text-base font-bold leading-tight" style={{ color: '#1E1B2E' }}>Wallet</p>
          </div>
        </div>

        <nav className="flex-1 px-4 mt-2 overflow-y-auto">
          <ul className="flex flex-col gap-1" style={{ listStyle: 'none' }}>
            {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
              const isActive = location.pathname === path;
              return (
                <li key={path}>
                  <button
                    onClick={() => onClose?.()}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{
                      background: isActive ? '#EFEAFB' : 'transparent',
                      color: isActive ? '#6C4CE0' : '#4B4B5A',
                      fontWeight: isActive ? 600 : 500,
                      border: 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = '#F0EFFB';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-4 pb-4">
          <div className="rounded-2xl p-5 mb-4" style={{ background: '#EFEAFB' }}>
            <p className="text-sm font-bold mb-1" style={{ color: '#16A34A' }}>Secure & Fast</p>
            <p className="text-xs leading-relaxed" style={{ color: '#9B98A8' }}>
              Your transactions are secured with end-to-end encryption and recorded on a distributed ledger.
            </p>
            <div className="flex justify-center mt-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #EFEAFB, #DDD6F9)' }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6C4CE0, #5B3FD6)' }}
                >
                  <Lock className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors w-full"
            style={{ color: '#E14545', background: 'none', border: 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FDE4E4'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
