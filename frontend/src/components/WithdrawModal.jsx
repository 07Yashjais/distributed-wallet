import { useState } from 'react';
import { ArrowUpFromLine } from 'lucide-react';
import { api } from '../api/client';
import Modal from './Modal';

export default function WithdrawModal({ isOpen, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.wallet.withdraw(Number(amount));
      setAmount('');
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Withdraw Funds">
      {error && (
        <div className="text-sm rounded-xl px-4 py-3 mb-4 font-medium" style={{ background: '#FDE4E4', color: '#E14545' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-[13px] font-medium mb-1.5" style={{ color: '#1E1B2E' }}>Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter withdrawal amount"
            min="1"
            step="0.01"
            required
            autoFocus
            className="input-field"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full font-semibold rounded-xl px-5 py-3.5 flex items-center justify-center gap-2 transition-all"
          style={{
            background: '#E14545',
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 12px rgba(225,69,69,0.3)',
            opacity: loading ? 0.6 : 1,
          }}
        >
          <ArrowUpFromLine className="w-4 h-4" />
          {loading ? 'Processing...' : 'Withdraw'}
        </button>
      </form>
    </Modal>
  );
}
