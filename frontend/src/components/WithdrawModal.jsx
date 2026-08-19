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

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="block text-[14px] font-semibold mb-2" style={{ color: '#1E1B2E' }}>Amount (₹)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium" style={{ color: '#9B98A8' }}>₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="1"
              step="0.01"
              required
              autoFocus
              className="input-field input-field-icon"
              style={{ paddingLeft: '40px', fontSize: '16px', padding: '14px 16px 14px 40px' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          <ArrowUpFromLine className="w-5 h-5" />
          {loading ? 'Processing...' : 'Withdraw Funds'}
        </button>
      </form>
    </Modal>
  );
}
