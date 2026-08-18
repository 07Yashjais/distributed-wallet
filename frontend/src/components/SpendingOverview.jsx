import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';

const CATEGORIES = [
  { key: 'TRANSFER', label: 'Transfers', color: '#3B82F6' },
  { key: 'WITHDRAW', label: 'Withdrawals', color: '#E14545' },
  { key: 'OTHER', label: 'Others', color: '#F5B942' },
];

function computeSpending(transactions) {
  const debits = transactions.filter(tx => tx.entry_type === 'DEBIT');
  const totals = { TRANSFER: 0, WITHDRAW: 0, OTHER: 0 };

  debits.forEach(tx => {
    const type = tx.transaction_type;
    const amount = Number(tx.amount);
    if (type === 'TRANSFER') totals.TRANSFER += amount;
    else if (type === 'WITHDRAW') totals.WITHDRAW += amount;
    else totals.OTHER += amount;
  });

  return CATEGORIES.map(cat => ({ ...cat, value: totals[cat.key] })).filter(d => d.value > 0);
}

export default function SpendingOverview({ transactions }) {
  const data = useMemo(() => computeSpending(transactions), [transactions]);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const hasData = data.length > 0;

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold" style={{ color: '#1E1B2E' }}>Spending Overview</h3>
        <button
          className="text-[13px] rounded-full px-3 py-1.5 flex items-center gap-1 transition-colors"
          style={{ background: '#F0EFFB', color: '#4B4B5A', border: 'none' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#EDEBF7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#F0EFFB'; }}
        >
          This Month
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-8">
        <div className="relative flex-shrink-0" style={{ width: 150, height: 150 }}>
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  dataKey="value"
                  strokeWidth={0}
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full rounded-full" style={{ border: '20px solid #F0EFFB' }} />
          )}

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[11px]" style={{ color: '#9B98A8' }}>Total Spent</span>
            <span className="text-lg font-bold" style={{ color: '#1E1B2E' }}>
              ₹ {total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 flex-1">
          {(hasData ? data : CATEGORIES.map(c => ({ ...c, value: 0 }))).map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm" style={{ color: '#4B4B5A' }}>{item.label}</span>
              </div>
              <span className="text-sm font-bold" style={{ color: '#1E1B2E' }}>
                ₹ {item.value.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
