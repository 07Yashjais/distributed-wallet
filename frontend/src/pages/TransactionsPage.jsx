import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ArrowDownToLine, ArrowUpFromLine, Send, Loader2, Search, Filter } from 'lucide-react';

const TYPE_CONFIG = {
  DEPOSIT: { icon: ArrowDownToLine, iconBg: '#DCFCE7', iconColor: '#16A34A', label: 'Deposit' },
  WITHDRAW: { icon: ArrowUpFromLine, iconBg: '#FDE4E4', iconColor: '#E14545', label: 'Withdraw' },
  TRANSFER: { icon: Send, iconBg: '#EFEAFB', iconColor: '#6C4CE0', label: 'Transfer' },
};

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' • ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatAmount(entryType, amount) {
  const num = Number(amount);
  const formatted = `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  return entryType === 'CREDIT' ? `+ ${formatted}` : `- ${formatted}`;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.transactions.getAll();
        setTransactions(res.transactions || []);
      } catch (err) {
        console.error('Failed to load transactions', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = transactions.filter((tx) => {
    if (filter !== 'ALL' && tx.transaction_type !== filter) return false;
    if (search && !tx.reference_id?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ padding: 48 }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#6C4CE0' }} />
      </div>
    );
  }

  const filters = ['ALL', 'DEPOSIT', 'WITHDRAW', 'TRANSFER'];

  return (
    <div style={{ paddingTop: 8, paddingBottom: 48 }}>
      <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1E1B2E', marginBottom: 24 }}>
        All Transactions
      </h2>

      {/* Filters & Search */}
      <div
        className="flex flex-col md:flex-row md:items-center gap-4"
        style={{ marginBottom: 24 }}
      >
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '10px 20px',
                borderRadius: 14,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease',
                background: filter === f ? '#6C4CE0' : '#FFFFFF',
                color: filter === f ? '#FFFFFF' : '#64607D',
                boxShadow: filter === f ? '0 4px 12px rgba(108,76,224,0.3)' : '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex-1 relative" style={{ maxWidth: 320 }}>
          <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9B98A8' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference..."
            className="input-field"
            style={{ paddingLeft: 42 }}
          />
        </div>
      </div>

      {/* Transaction List */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 24,
          padding: '8px 0',
          boxShadow: '0 2px 16px rgba(17,12,46,0.04)',
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#9B98A8', fontSize: 15 }}>
            No transactions found.
          </div>
        ) : (
          filtered.map((tx, idx) => {
            const config = TYPE_CONFIG[tx.transaction_type] || TYPE_CONFIG.TRANSFER;
            const Icon = config.icon;
            const isCredit = tx.entry_type === 'CREDIT';
            const ref = tx.reference_id || '';
            const truncated = ref.length > 20 ? `${ref.slice(0, 10)}...${ref.slice(-8)}` : ref;

            return (
              <div
                key={`${tx.transaction_id}-${tx.entry_type}-${idx}`}
                className="flex items-center gap-4"
                style={{
                  padding: '18px 28px',
                  borderBottom: idx < filtered.length - 1 ? '1px solid #F5F4FC' : 'none',
                  transition: 'background 0.15s ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFE'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: 46, height: 46, borderRadius: '50%', background: config.iconBg }}
                >
                  <Icon style={{ width: 22, height: 22, color: config.iconColor }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#1E1B2E', marginBottom: 2 }}>
                    {tx.transaction_type === 'TRANSFER' ? `Transfer to ${truncated}` : config.label}
                  </p>
                  <p style={{ fontSize: 13, color: '#9B98A8' }}>{formatDate(tx.created_at)}</p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      borderRadius: 20,
                      padding: '5px 12px',
                      background: tx.status === 'COMPLETED' ? '#DCFCE7' : '#FEF2F2',
                      color: tx.status === 'COMPLETED' ? '#16A34A' : '#E14545',
                    }}
                  >
                    {tx.status}
                  </span>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: isCredit ? '#16A34A' : '#E14545',
                      minWidth: 100,
                      textAlign: 'right',
                    }}
                  >
                    {formatAmount(tx.entry_type, tx.amount)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
