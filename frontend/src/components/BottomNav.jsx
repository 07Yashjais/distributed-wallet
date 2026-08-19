import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  Send,
  ArrowLeftRight,
  UserCircle,
} from 'lucide-react';

const TABS = [
  { icon: LayoutDashboard, label: 'Home', path: '/' },
  { icon: Send, label: 'Send', path: '/send' },
  { icon: ArrowLeftRight, label: 'History', path: '/transactions' },
  { icon: UserCircle, label: 'Account', path: '/account' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tapped, setTapped] = useState(null);

  const handleTap = (path, idx) => {
    setTapped(idx);
    navigate(path);
    setTimeout(() => setTapped(null), 400);
  };

  return (
    <>
      {/* Spacer so content doesn't hide behind the nav */}
      <div className="lg:hidden" style={{ height: 88 }} />

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        style={{ padding: '0 16px 12px 16px' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            height: 68,
            borderRadius: 28,
            background: '#FFFFFF',
            boxShadow: '0 -4px 32px rgba(17,12,46,0.10), 0 0 0 1px rgba(240,239,251,0.6)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {TABS.map(({ icon: Icon, label, path }, idx) => {
            const isActive = location.pathname === path;
            const isBouncing = tapped === idx;

            return (
              <button
                key={path}
                onClick={() => handleTap(path, idx)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  padding: '8px 0',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  flex: 1,
                  transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: isBouncing
                    ? 'scale(0.85)'
                    : isActive
                    ? 'scale(1.08)'
                    : 'scale(1)',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    background: isActive ? '#6C4CE0' : 'transparent',
                    boxShadow: isActive ? '0 4px 14px rgba(108,76,224,0.35)' : 'none',
                  }}
                >
                  <Icon
                    style={{
                      width: 22,
                      height: 22,
                      color: isActive ? '#FFFFFF' : '#9B98A8',
                      transition: 'color 0.25s ease',
                    }}
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#6C4CE0' : '#9B98A8',
                    transition: 'all 0.25s ease',
                    letterSpacing: '0.01em',
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
