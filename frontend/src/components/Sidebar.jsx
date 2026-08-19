import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Wallet,
  LayoutDashboard,
  UserCircle,
  Send,
  ArrowLeftRight,
  LogOut,
  ShieldCheck,
  Lock,
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Send, label: 'Send Money', path: '/send' },
  { icon: ArrowLeftRight, label: 'Transactions', path: '/transactions' },
  { icon: UserCircle, label: 'Account', path: '/account' },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-40"
      style={{
        width: 260,
        background: '#FFFFFF',
        borderRight: '1px solid #F0EFFB',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '32px 28px 24px 28px' }}>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #6C4CE0, #5B3FD6)',
              boxShadow: '0 4px 14px rgba(108, 76, 224, 0.3)',
            }}
          >
            <Wallet className="text-white" style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div className="font-bold" style={{ fontSize: 18, color: '#1E1B2E', lineHeight: 1.2 }}>Distributed</div>
            <div className="font-bold" style={{ fontSize: 18, color: '#1E1B2E', lineHeight: 1.2 }}>Wallet</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: '8px 16px 0 16px' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            return (
              <li key={path} style={{ marginBottom: 6 }}>
                <button
                  onClick={() => navigate(path)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 20px',
                    borderRadius: 14,
                    fontSize: 15,
                    fontWeight: isActive ? 600 : 500,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: isActive ? '#F0EFFB' : 'transparent',
                    color: isActive ? '#6C4CE0' : '#64607D',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#F9F8FD';
                      e.currentTarget.style.color = '#1E1B2E';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#64607D';
                    }
                  }}
                >
                  <Icon style={{ width: 22, height: 22, flexShrink: 0 }} strokeWidth={isActive ? 2.2 : 1.8} />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div style={{ padding: '0 16px 24px 16px' }}>
        <div
          style={{
            borderRadius: 20,
            padding: '24px 20px',
            marginBottom: 16,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            background: '#F9F8FD',
          }}
        >
          <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.04, pointerEvents: 'none' }}>
            <ShieldCheck style={{ width: 120, height: 120, color: '#6C4CE0' }} />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B2E', marginBottom: 6, position: 'relative', zIndex: 1 }}>
            Secure & Fast
          </h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#9B98A8', marginBottom: 20, position: 'relative', zIndex: 1 }}>
            End-to-end encrypted transactions on a distributed ledger.
          </p>
          <div className="flex justify-center" style={{ position: 'relative', zIndex: 1 }}>
            <div
              className="flex items-center justify-center"
              style={{ width: 56, height: 56, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 2px 12px rgba(108,76,224,0.08)' }}
            >
              <div
                className="flex items-center justify-center"
                style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #EFEAFB, #E0D9FA)' }}
              >
                <Lock style={{ width: 20, height: 20, color: '#6C4CE0' }} />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 20px',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: 'transparent',
            color: '#E14545',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut style={{ width: 22, height: 22 }} />
          Logout
        </button>
      </div>
    </aside>
  );
}
