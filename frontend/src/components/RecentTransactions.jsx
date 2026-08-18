import { ArrowDownToLine, ArrowUpFromLine, Send, ChevronRight } from 'lucide-react';

const TYPE_CONFIG = {
  DEPOSIT: {
    icon: ArrowDownToLine,
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
    label: 'Deposit',
  },
  WITHDRAW: {
    icon: ArrowUpFromLine,
    iconBg: '#FDE4E4',
    iconColor: '#E14545',
    label: 'Withdraw',
  },
  TRANSFER: {
    icon: Send,
    iconBg: '#EFEAFB',
    iconColor: '#6C4CE0',
    label: 'Transfer',
  },
};

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ' • ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatAmount(entryType, amount) {
  const num = Number(amount);
  const formatted = `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  return entryType === 'CREDIT' ? `+ ${formatted}` : `- ${formatted}`;
}

function TransactionRow({ transaction }) {
  const config = TYPE_CONFIG[transaction.transaction_type] || TYPE_CONFIG.TRANSFER;
  const Icon = config.icon;
  const isCredit = transaction.entry_type === 'CREDIT';

  const ref = transaction.reference_id || '';
  const truncated = ref.length > 16 ? `${ref.slice(0, 8)}...${ref.slice(-6)}` : ref;

  const displayLabel = transaction.transaction_type === 'TRANSFER'
    ? `Transfer to ${truncated}`
    : config.label;

  return (
    <div
      className="flex items-center gap-3"
      style={{ padding: '14px 0', borderBottom: '1px solid #EDEBF7' }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: config.iconBg }}
      >
        <Icon className="w-5 h-5" style={{ color: config.iconColor }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: '#1E1B2E' }}>{displayLabel}</p>
        <p className="text-xs mt-0.5" style={{ color: '#9B98A8' }}>{formatDate(transaction.created_at)}</p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <span
          className="text-[11px] font-semibold uppercase tracking-wide rounded-full px-2.5 py-1"
          style={{ background: '#DCFCE7', color: '#16A34A', letterSpacing: '0.03em' }}
        >
          {transaction.status}
        </span>
        <span
          className="text-sm font-bold"
          style={{ color: isCredit ? '#16A34A' : '#E14545', minWidth: 90, textAlign: 'right' }}
        >
          {formatAmount(transaction.entry_type, transaction.amount)}
        </span>
      </div>
    </div>
  );
}

export default function RecentTransactions({ transactions }) {
  const recent = transactions.slice(0, 5);

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold" style={{ color: '#1E1B2E' }}>Recent Transactions</h3>
        <button
          className="text-[13px] rounded-full px-3 py-1.5 transition-colors"
          style={{ background: '#F0EFFB', color: '#4B4B5A', border: 'none' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#EDEBF7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#F0EFFB'; }}
        >
          View All
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: '#9B98A8' }}>No transactions yet</p>
        </div>
      ) : (
        <div>
          {recent.map((tx) => (
            <TransactionRow key={`${tx.transaction_id}-${tx.entry_type}`} transaction={tx} />
          ))}
        </div>
      )}

      {transactions.length > 5 && (
        <button
          className="w-full text-center text-sm font-medium mt-4 flex items-center justify-center gap-1 hover:underline"
          style={{ color: '#6C4CE0', background: 'none', border: 'none' }}
        >
          View All Transactions
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
