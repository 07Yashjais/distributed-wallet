import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import BalanceCard from '../components/BalanceCard';
import QuickActions from '../components/QuickActions';
import SendMoneyCard from '../components/SendMoneyCard';
import RecentTransactions from '../components/RecentTransactions';
import SpendingOverview from '../components/SpendingOverview';
import MonthlySummary from '../components/MonthlySummary';
import DepositModal from '../components/DepositModal';
import WithdrawModal from '../components/WithdrawModal';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState('deposit');
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        api.wallet.get(),
        api.transactions.getAll(),
      ]);
      setWallet(walletRes.wallet);
      setTransactions(txRes.transactions);
    } catch (err) {
      if (err.message === 'Wallet not found') {
        try {
          const createRes = await api.wallet.create();
          setWallet(createRes.wallet);
        } catch {
          // wallet creation may fail silently
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleActionClick = (action) => {
    setActiveAction(action);
    if (action === 'deposit') setDepositOpen(true);
    if (action === 'withdraw') setWithdrawOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F4FC' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#6C4CE0' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F5F4FC' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-[260px] min-h-screen">
        <div style={{ padding: '0 28px' }}>
          <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

          <div
            className="grid grid-cols-1 lg:grid-cols-12"
            style={{ gap: 20, paddingBottom: 32 }}
          >
            <div className="lg:col-span-7">
              <BalanceCard wallet={wallet} />
            </div>
            <div className="lg:col-span-5">
              <QuickActions activeAction={activeAction} onActionClick={handleActionClick} />
            </div>

            <div className="lg:col-span-5">
              <SendMoneyCard onSuccess={fetchData} />
            </div>
            <div className="lg:col-span-7">
              <RecentTransactions transactions={transactions} />
            </div>

            <div className="lg:col-span-5">
              <SpendingOverview transactions={transactions} />
            </div>
            <div className="lg:col-span-7">
              <MonthlySummary transactions={transactions} />
            </div>
          </div>
        </div>
      </main>

      <DepositModal
        isOpen={depositOpen}
        onClose={() => setDepositOpen(false)}
        onSuccess={fetchData}
      />

      <WithdrawModal
        isOpen={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
