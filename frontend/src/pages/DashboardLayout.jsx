import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api/client';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import BalanceCard from '../components/BalanceCard';
import QuickActions from '../components/QuickActions';
import SendMoneyCard from '../components/SendMoneyCard';
import RecentTransactions from '../components/RecentTransactions';
import SpendingOverview from '../components/SpendingOverview';
import MonthlySummary from '../components/MonthlySummary';
import DepositModal from '../components/DepositModal';
import WithdrawModal from '../components/WithdrawModal';
import AccountPage from './AccountPage';
import TransactionsPage from './TransactionsPage';
import SendMoneyPage from './SendMoneyPage';
import { Loader2 } from 'lucide-react';

const SIDEBAR_WIDTH = 260;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isDesktop;
}

export default function DashboardLayout() {
  const location = useLocation();
  const currentPath = location.pathname;
  const isDesktop = useIsDesktop();

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
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#6C4CE0' }} />
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPath) {
      case '/account':
        return <AccountPage />;
      case '/transactions':
        return <TransactionsPage />;
      case '/send':
        return <SendMoneyPage onSuccess={fetchData} />;
      default:
        return (
          <div
            className="grid grid-cols-1 xl:grid-cols-12"
            style={{ gap: 20, paddingTop: 8, paddingBottom: 48 }}
          >
            <div className="xl:col-span-8">
              <BalanceCard wallet={wallet} />
            </div>
            <div className="xl:col-span-4">
              <QuickActions activeAction={activeAction} onActionClick={handleActionClick} />
            </div>
            <div className="xl:col-span-4">
              <SendMoneyCard onSuccess={fetchData} />
            </div>
            <div className="xl:col-span-8">
              <RecentTransactions transactions={transactions} />
            </div>
            <div className="xl:col-span-4">
              <SpendingOverview transactions={transactions} />
            </div>
            <div className="xl:col-span-8">
              <MonthlySummary transactions={transactions} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#F5F4FC' }}>
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div
        className="min-h-screen flex flex-col"
        style={{ marginLeft: isDesktop ? SIDEBAR_WIDTH : 0 }}
      >
        <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: '0 16px' }}>
          {/* Responsive padding */}
          <div className="sm:px-2 lg:px-4">
            <Topbar />
            {renderPage()}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav />

      {/* Modals */}
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
