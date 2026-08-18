import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ArrowDownToLine, ArrowUpFromLine, Wallet } from 'lucide-react';

function buildChartData(transactions) {
  const dailyMap = {};
  const credits = transactions.filter(tx => tx.entry_type === 'CREDIT');

  credits.forEach(tx => {
    const date = new Date(tx.created_at);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const dayLabel = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

    if (!dailyMap[key]) {
      dailyMap[key] = { name: dayLabel, amount: 0, timestamp: date.getTime() };
    }
    dailyMap[key].amount += Number(tx.amount);
  });

  return Object.values(dailyMap).sort((a, b) => a.timestamp - b.timestamp);
}

function computeSummary(transactions) {
  let totalReceived = 0;
  let totalSent = 0;

  transactions.forEach(tx => {
    const amount = Number(tx.amount);
    if (tx.entry_type === 'CREDIT') totalReceived += amount;
    else if (tx.entry_type === 'DEBIT') totalSent += amount;
  });

  return { totalReceived, totalSent, netBalance: totalReceived - totalSent };
}

function formatCurrency(value) {
  return `₹ ${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

const STATS = [
  {
    key: 'totalReceived',
    label: 'Total Received',
    icon: ArrowDownToLine,
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
    valueColor: '#16A34A',
  },
  {
    key: 'totalSent',
    label: 'Total Sent',
    icon: ArrowUpFromLine,
    iconBg: '#FDE4E4',
    iconColor: '#E14545',
    valueColor: '#E14545',
  },
  {
    key: 'netBalance',
    label: 'Net Balance',
    icon: Wallet,
    iconBg: '#EFEAFB',
    iconColor: '#6C4CE0',
    valueColor: '#6C4CE0',
  },
];

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 4px 16px rgba(17,12,46,0.12)',
        border: '1px solid #EDEBF7',
      }}
    >
      <p className="text-sm font-semibold" style={{ color: '#1E1B2E' }}>
        ₹{Number(payload[0].value).toLocaleString('en-IN')}
      </p>
    </div>
  );
}

export default function MonthlySummary({ transactions }) {
  const chartData = useMemo(() => buildChartData(transactions), [transactions]);
  const summary = useMemo(() => computeSummary(transactions), [transactions]);

  return (
    <div className="card h-full">
      <h3 className="text-base font-semibold mb-5" style={{ color: '#1E1B2E' }}>Monthly Summary</h3>

      <div className="flex gap-6 flex-col xl:flex-row">
        <div className="flex-1 min-w-0" style={{ height: 200 }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6C4CE0" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#6C4CE0" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDEBF7" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#9B98A8', fontFamily: 'Poppins' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#9B98A8', fontFamily: 'Poppins' }}
                  tickFormatter={(v) => v >= 1000 ? `₹${v / 1000}k` : `₹${v}`}
                  width={50}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#6C4CE0"
                  strokeWidth={2.5}
                  fill="url(#purpleGradient)"
                  dot={{ r: 4, fill: '#6C4CE0', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#6C4CE0', strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-sm" style={{ color: '#9B98A8' }}>No data available</p>
            </div>
          )}
        </div>

        <div className="flex xl:flex-col gap-4" style={{ minWidth: 160 }}>
          {STATS.map(({ key, label, icon: Icon, iconBg, iconColor, valueColor }) => (
            <div key={key} className="flex-1 xl:flex-none">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                style={{ background: iconBg }}
              >
                <Icon className="w-5 h-5" style={{ color: iconColor }} />
              </div>
              <p className="text-xs" style={{ color: '#9B98A8' }}>{label}</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: valueColor }}>
                {formatCurrency(summary[key])}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
