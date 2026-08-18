import { ArrowDownToLine, ArrowUpFromLine, Send } from 'lucide-react';

const ACTIONS = [
  {
    key: 'deposit',
    icon: ArrowDownToLine,
    label: 'Deposit',
    caption: 'Add funds',
    iconBg: '#EFEAFB',
    iconColor: '#6C4CE0',
  },
  {
    key: 'withdraw',
    icon: ArrowUpFromLine,
    label: 'Withdraw',
    caption: 'Withdraw funds',
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
  },
  {
    key: 'send',
    icon: Send,
    label: 'Send Money',
    caption: 'Transfer to wallet',
    iconBg: '#DCEAFE',
    iconColor: '#3B82F6',
  },
];

export default function QuickActions({ activeAction, onActionClick }) {
  return (
    <div className="card h-full">
      <h3 className="text-base font-semibold mb-4" style={{ color: '#1E1B2E' }}>Quick Actions</h3>

      <div className="grid grid-cols-3 gap-3">
        {ACTIONS.map(({ key, icon: Icon, label, caption, iconBg, iconColor }) => {
          const isActive = activeAction === key;
          return (
            <button
              key={key}
              onClick={() => onActionClick(key)}
              className="flex flex-col items-center text-center rounded-2xl p-4 transition-all duration-200"
              style={{
                background: isActive ? '#EFEAFB' : '#FAFAFA',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = '#F0EFFB';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = isActive ? '#EFEAFB' : '#FAFAFA';
              }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                style={{ background: iconBg }}
              >
                <Icon className="w-6 h-6" style={{ color: iconColor }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: '#1E1B2E' }}>{label}</p>
              <p className="text-xs mt-1" style={{ color: '#9B98A8' }}>{caption}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
