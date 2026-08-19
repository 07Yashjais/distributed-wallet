import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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

  const activeIndex = TABS.findIndex((t) => t.path === location.pathname);
  const safeIndex = activeIndex === -1 ? 0 : activeIndex;

  return (
    <>
      {/* Spacer */}
      <div className="lg:hidden" style={{ height: 100 }} />

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        style={{ padding: '0 12px 10px 12px' }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            height: 72,
            borderRadius: 32,
            padding: '0 6px',
            /* Liquid glass effect */
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.45)',
            boxShadow: `
              0 -2px 40px rgba(108, 76, 224, 0.08),
              0 8px 32px rgba(17, 12, 46, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.6),
              inset 0 -1px 0 rgba(0, 0, 0, 0.03)
            `,
          }}
        >
          {/* === SLIDING PILL === */}
          <motion.div
            layout
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 25,
              mass: 0.8,
            }}
            style={{
              position: 'absolute',
              top: 6,
              bottom: 6,
              left: `calc(${safeIndex * 25}% + 6px)`,
              width: 'calc(25% - 12px)',
              borderRadius: 24,
              background: 'linear-gradient(135deg, #6C4CE0, #5B3FD6)',
              boxShadow: `
                0 6px 20px rgba(108, 76, 224, 0.4),
                0 2px 8px rgba(108, 76, 224, 0.2),
                inset 0 1px 1px rgba(255, 255, 255, 0.15)
              `,
              zIndex: 0,
            }}
          />

          {/* === TAB BUTTONS === */}
          {TABS.map(({ icon: Icon, label, path }, idx) => {
            const isActive = idx === safeIndex;

            return (
              <motion.button
                key={path}
                onClick={() => navigate(path)}
                whileTap={{ scale: 0.88 }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 20,
                  mass: 0.6,
                }}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  padding: '6px 0',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    y: isActive ? -1 : 0,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 18,
                    mass: 0.5,
                  }}
                >
                  <Icon
                    style={{
                      width: 22,
                      height: 22,
                      color: isActive ? '#FFFFFF' : '#9B98A8',
                      transition: 'color 0.2s ease',
                    }}
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                </motion.div>

                <motion.span
                  animate={{
                    opacity: isActive ? 1 : 0.7,
                    y: isActive ? 0 : 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                  }}
                  style={{
                    fontSize: 10,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#FFFFFF' : '#9B98A8',
                    letterSpacing: '0.02em',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {label}
                </motion.span>
              </motion.button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
