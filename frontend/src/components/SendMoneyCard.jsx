import { useState } from 'react';
import { Send } from 'lucide-react';
import { api } from '../api/client';

export default function SendMoneyCard({ onSuccess }) {
  const [receiverWalletId, setReceiverWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetForm = () => {
    setReceiverWalletId('');
    setAmount('');
    setReference('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await api.transfers.send(receiverWalletId, Number(amount));
      setSuccess(`Transfer successful! Ref: ${data.referenceId}`);
      resetForm();
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card h-full">
      <div className="flex items-center gap-2 mb-5">
        <Send className="w-5 h-5" style={{ color: '#6C4CE0' }} />
        <h3 className="text-base font-semibold" style={{ color: '#1E1B2E' }}>Send Money</h3>
      </div>

      {error && (
        <div className="text-sm rounded-xl px-4 py-3 mb-4 font-medium" style={{ background: '#FDE4E4', color: '#E14545' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm rounded-xl px-4 py-3 mb-4 font-medium" style={{ background: '#DCFCE7', color: '#16A34A' }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-[13px] font-medium mb-1.5" style={{ color: '#1E1B2E' }}>
            Receiver Wallet ID
          </label>
          <input
            type="text"
            value={receiverWalletId}
            onChange={(e) => setReceiverWalletId(e.target.value)}
            placeholder="Enter receiver wallet ID"
            required
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium mb-1.5" style={{ color: '#1E1B2E' }}>
            Amount (₹)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="1"
            step="0.01"
            required
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium mb-1.5" style={{ color: '#1E1B2E' }}>
            Reference (Optional)
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="E.g. Rent, Gift, Shopping"
            className="input-field"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-1"
        >
          <Send className="w-4 h-4" />
          {loading ? 'Sending...' : 'Send Money'}
        </button>
      </form>
    </div>
  );
}
