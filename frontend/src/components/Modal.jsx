import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 100 }}>
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        className="relative w-full"
        style={{
          maxWidth: 420,
          background: '#FFFFFF',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 20px 60px rgba(17,12,46,0.15)',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold" style={{ color: '#1E1B2E' }}>{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'transparent', border: 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F0EFFB'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <X className="w-5 h-5" style={{ color: '#9B98A8' }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
