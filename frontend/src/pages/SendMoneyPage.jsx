import { useState } from 'react';
import { Send, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';

export default function SendMoneyPage({ onSuccess }) {
  const [receiverWalletId, setReceiverWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const resetForm = () => {
    setReceiverWalletId('');
    setAmount('');
    setReference('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessData(null);
    setLoading(true);

    try {
      const data = await api.transfers.send(receiverWalletId, Number(amount));
      setSuccessData(data);
      resetForm();
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: 8, paddingBottom: 48 }}>
      <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1E1B2E', marginBottom: 24 }}>
        Send Money
      </h2>

      <div className="grid grid-cols-1 xl:grid-cols-2" style={{ gap: 24 }}>
        {/* Form Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 24,
            padding: 32,
            boxShadow: '0 2px 16px rgba(17,12,46,0.04)',
          }}
        >
          <div className="flex items-center gap-3" style={{ marginBottom: 28 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 44, height: 44, borderRadius: 14,
                background: '#EFEAFB',
              }}
            >
              <Send style={{ width: 22, height: 22, color: '#6C4CE0' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E1B2E' }}>Transfer Funds</h3>
              <p style={{ fontSize: 13, color: '#9B98A8' }}>Send money to any wallet instantly</p>
            </div>
          </div>

          {error && (
            <div
              style={{
                fontSize: 14, fontWeight: 500,
                borderRadius: 14, padding: '14px 18px',
                marginBottom: 20,
                background: '#FEF2F2', color: '#E14545',
                border: '1px solid #FDE4E4',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1E1B2E', marginBottom: 8 }}>
                Receiver Wallet ID
              </label>
              <input
                type="text"
                value={receiverWalletId}
                onChange={(e) => setReceiverWalletId(e.target.value)}
                placeholder="Enter receiver's wallet ID"
                required
                className="input-field"
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1E1B2E', marginBottom: 8 }}>
                Amount (₹)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="1"
                step="0.01"
                required
                className="input-field"
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1E1B2E', marginBottom: 8 }}>
                Reference (Optional)
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. Rent, Gift, Shopping"
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ opacity: loading ? 0.6 : 1, width: '100%' }}
            >
              <Send style={{ width: 18, height: 18 }} />
              {loading ? 'Sending...' : 'Send Money'}
              {!loading && <ArrowRight style={{ width: 18, height: 18, marginLeft: 'auto' }} />}
            </button>
          </form>
        </div>

        {/* Info / Success Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 24,
            padding: 32,
            boxShadow: '0 2px 16px rgba(17,12,46,0.04)',
          }}
        >
          {successData ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div
                className="flex items-center justify-center mx-auto"
                style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: '#DCFCE7',
                  marginBottom: 20,
                }}
              >
                <CheckCircle2 style={{ width: 36, height: 36, color: '#16A34A' }} />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#1E1B2E', marginBottom: 8 }}>
                Transfer Successful!
              </h3>
              <p style={{ fontSize: 14, color: '#9B98A8', marginBottom: 28 }}>
                Your funds have been sent successfully.
              </p>

              <div style={{ textAlign: 'left', borderRadius: 18, padding: 24, background: '#F9F8FD', border: '1px solid #F0EFFB' }}>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: '#9B98A8', marginBottom: 4 }}>Reference ID</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1E1B2E', fontFamily: 'monospace' }}>
                    {successData.referenceId}
                  </p>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: '#9B98A8', marginBottom: 4 }}>Amount Sent</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#6C4CE0' }}>
                    ₹{Number(successData.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSuccessData(null)}
                className="btn-primary"
                style={{ marginTop: 24, width: '100%' }}
              >
                Send Another
              </button>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E1B2E', marginBottom: 16 }}>
                How it works
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { step: '1', title: 'Enter Wallet ID', desc: 'Get the receiver\'s unique wallet ID from their account page.' },
                  { step: '2', title: 'Set Amount', desc: 'Enter the amount you want to transfer in INR.' },
                  { step: '3', title: 'Confirm & Send', desc: 'Double-check the details and hit send. Transfers are instant!' },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex items-start gap-4">
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 38, height: 38, borderRadius: 12,
                        background: '#F0EFFB', fontSize: 15, fontWeight: 700, color: '#6C4CE0',
                      }}
                    >
                      {step}
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#1E1B2E', marginBottom: 4 }}>{title}</p>
                      <p style={{ fontSize: 13, color: '#9B98A8', lineHeight: 1.6 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
