import { useState } from 'react';
import { Eye, EyeOff, Wallet, Sparkles } from 'lucide-react';

export default function BalanceCard({ wallet }) {
  const [visible, setVisible] = useState(true);

  const balance = wallet ? Number(wallet.balance) : 0;
  const formatted = `₹ ${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const hidden = '₹ •••••••';

  return (
    <div className="card flex items-center justify-between overflow-hidden relative" style={{ minHeight: 160 }}>
      <div className="flex-1 relative z-10">
        <p className="text-[13px] font-medium mb-1" style={{ color: '#9B98A8' }}>Total Wallet Balance</p>

        <div className="flex items-center gap-3 mb-4">
          <span className="font-bold" style={{ fontSize: 34, color: '#1E1B2E' }}>
            {visible ? formatted : hidden}
          </span>
          <button
            onClick={() => setVisible(!visible)}
            className="transition-colors"
            style={{ color: '#9B98A8', background: 'none', border: 'none' }}
          >
            {visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>

        <div>
          <span className="text-[13px]" style={{ color: '#9B98A8' }}>Available Balance</span>
          <p className="text-lg font-bold" style={{ color: '#6C4CE0' }}>
            {visible ? formatted : hidden}
          </p>
        </div>
      </div>

      <div className="hidden md:flex flex-col items-center justify-center relative" style={{ width: 140, height: 140 }}>
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center relative"
          style={{ background: '#EFEAFB', animation: 'float 3s ease-in-out infinite' }}
        >
          <Wallet className="w-12 h-12" style={{ color: '#6C4CE0' }} />
          <div
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #F5B942, #E5A830)', boxShadow: '0 2px 8px rgba(245,185,66,0.4)' }}
          >
            <span className="text-white text-sm font-bold">₹</span>
          </div>
        </div>
        <Sparkles className="w-5 h-5 absolute top-0 right-2" style={{ color: 'rgba(108,76,224,0.25)' }} />
        <Sparkles className="w-4 h-4 absolute bottom-2 left-0" style={{ color: 'rgba(245,185,66,0.35)' }} />
      </div>
    </div>
  );
}
