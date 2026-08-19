import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Loader2, Copy, CheckCircle2, Wallet, Calendar, Banknote } from 'lucide-react';

export default function AccountPage() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await api.wallet.get();
        setWallet(res.wallet);
      } catch (err) {
        console.error("Failed to fetch wallet for account page", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  const copyToClipboard = () => {
    if (wallet?.id) {
      navigator.clipboard.writeText(wallet.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ padding: 48 }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#6C4CE0' }} />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="flex-1 text-center" style={{ padding: 48, color: '#9B98A8' }}>
        Could not load account details.
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 8, paddingBottom: 48 }}>
      <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1E1B2E', marginBottom: 28 }}>
        Account Settings
      </h2>
      
      {/* Wallet ID Card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 24,
          padding: 32,
          boxShadow: '0 2px 16px rgba(17,12,46,0.04)',
          marginBottom: 24,
        }}
      >
        <h3 style={{ fontSize: 13, fontWeight: 600, color: '#9B98A8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>
          Wallet Information
        </h3>
        
        {/* Wallet ID Row */}
        <div
          className="flex flex-col md:flex-row md:items-center justify-between"
          style={{
            padding: 24,
            borderRadius: 18,
            background: '#F9F8FD',
            border: '1px solid #F0EFFB',
            marginBottom: 28,
          }}
        >
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#9B98A8', marginBottom: 6 }}>
              Unique Wallet ID
            </p>
            <p style={{ fontFamily: 'monospace', fontSize: 17, fontWeight: 700, color: '#1E1B2E', letterSpacing: '0.01em' }}>
              {wallet.id}
            </p>
          </div>
          
          <button 
            onClick={copyToClipboard}
            className="flex items-center justify-center gap-2"
            style={{ 
              marginTop: typeof window !== 'undefined' && window.innerWidth < 768 ? 16 : 0,
              padding: '12px 22px',
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: copied ? '#E8F5E9' : '#FFFFFF', 
              color: copied ? '#16A34A' : '#6C4CE0',
              border: copied ? '1.5px solid #C8E6C9' : '1.5px solid #EFEAFB',
              boxShadow: '0 2px 8px rgba(108,76,224,0.06)',
            }}
          >
            {copied ? (
              <>
                <CheckCircle2 style={{ width: 16, height: 16 }} />
                Copied!
              </>
            ) : (
              <>
                <Copy style={{ width: 16, height: 16 }} />
                Copy ID
              </>
            )}
          </button>
        </div>
        
        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 20 }}>
          <div
            className="flex items-start gap-4"
            style={{
              padding: 24,
              borderRadius: 18,
              background: '#FFFFFF',
              border: '1.5px solid #F5F4FC',
            }}
          >
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: '#F0EFFB',
              }}
            >
              <Banknote style={{ width: 22, height: 22, color: '#6C4CE0' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#9B98A8', marginBottom: 4 }}>Currency</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#1E1B2E' }}>{wallet.currency}</p>
            </div>
          </div>

          <div
            className="flex items-start gap-4"
            style={{
              padding: 24,
              borderRadius: 18,
              background: '#FFFFFF',
              border: '1.5px solid #F5F4FC',
            }}
          >
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: '#E8F5E9',
              }}
            >
              <Calendar style={{ width: 22, height: 22, color: '#16A34A' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#9B98A8', marginBottom: 4 }}>Created</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#1E1B2E' }}>
                {new Date(wallet.created_at).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div
            className="flex items-start gap-4"
            style={{
              padding: 24,
              borderRadius: 18,
              background: '#FFFFFF',
              border: '1.5px solid #F5F4FC',
            }}
          >
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: '#FEF2F2',
              }}
            >
              <Wallet style={{ width: 22, height: 22, color: '#E14545' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#9B98A8', marginBottom: 4 }}>User ID</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1E1B2E', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {wallet.user_id?.slice(0, 12)}...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
