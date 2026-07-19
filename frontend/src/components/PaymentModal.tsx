import React, { useState, useEffect } from 'react';
import { X, Crown, Check, Loader2, AlertCircle } from 'lucide-react';

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  apiKeyId: number;
  userEmail?: string;
  userName?: string;
  onSuccess?: () => void;
}

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentModal({
  isOpen, onClose, apiKeyId, userEmail, userName, onSuccess
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setError(null);
    setLoading(true);

    try {
      // Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load Razorpay. Check your internet connection.');

      // Step 1: Create order from backend
      const orderRes = await fetch(`${baseUrl}/api/v1/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'pro' }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.detail || 'Failed to create payment order');
      }

      const order = await orderRes.json();

      // Step 2: Open Razorpay checkout
      const options = {
        key: order.key_id,
        subscription_id: order.subscription_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Runwall',
        description: order.description,
        image: '/logo.svg',
        prefill: {
          email: userEmail || '',
          name: userName || '',
        },
        theme: {
          color: '#FFDA62',
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
          razorpay_signature: string;
        }) => {
          // Step 3: Verify payment on backend
          try {
            const verifyRes = await fetch(`${baseUrl}/api/v1/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
                api_key_id: apiKeyId,
              }),
            });

            if (!verifyRes.ok) {
              const err = await verifyRes.json();
              throw new Error(err.detail || 'Payment verification failed');
            }

            const result = await verifyRes.json();
            if (result.success) {
              setSuccess(true);
              setLoading(false);
              onSuccess?.();
            } else {
              throw new Error('Payment verification returned failure');
            }
          } catch (e: any) {
            setError(e.message);
            setLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();

    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        {/* Close button */}
        <button onClick={onClose} style={closeBtnStyle}>
          <X size={18} />
        </button>

        {success ? (
          /* ── Success state ── */
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(255,218,98,0.12)',
              border: '2px solid var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Check size={24} style={{ color: 'var(--accent)' }} />
            </div>
            <h2 style={{ color: 'var(--heading)', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
              Welcome to Pro! 🎉
            </h2>
            <p style={{ color: 'var(--body)', fontSize: 14, marginBottom: 20 }}>
              Your subscription is now active. You have <strong style={{ color: 'var(--accent)' }}>2,000 requests/month</strong>.
            </p>
            <button onClick={onClose} style={primaryBtnStyle}>
              Continue to Dashboard
            </button>
          </div>
        ) : (
          /* ── Default state ── */
          <>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'rgba(255,218,98,0.12)',
                  border: '1px solid rgba(255,218,98,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Crown size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <h2 style={{ color: 'var(--heading)', fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>
                    Upgrade to Pro
                  </h2>
                  <p style={{ color: 'var(--muted)', fontSize: 12 }}>Monthly subscription • Auto-renews</p>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div style={{
              background: 'rgba(255,218,98,0.05)',
              border: '1px solid rgba(255,218,98,0.15)',
              borderRadius: 10, padding: '14px 16px', marginBottom: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <span style={{ color: 'var(--heading)', fontWeight: 800, fontSize: 28 }}>$7</span>
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}> / month (approx. ₹674)</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>2,000 requests</div>
                  <div style={{ color: 'var(--muted)', fontSize: 11 }}>per month</div>
                </div>
              </div>
            </div>

            {/* Feature list */}
            <ul style={{ listStyle: 'none', marginBottom: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                '2,000 API requests per month',
                'Priority rate limit: 500 req/min',
                'Auto-renews monthly',
                'Cancel anytime',
                'Razorpay secure checkout',
              ].map((feat) => (
                <li key={feat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--body)', fontSize: 13 }}>{feat}</span>
                </li>
              ))}
            </ul>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '10px 12px', marginBottom: 14,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 8, color: 'var(--destructive)', fontSize: 12,
              }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleUpgrade}
              disabled={loading}
              style={{ ...primaryBtnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? (
                <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
              ) : (
                <><Crown size={14} /> Pay $7 with Razorpay</>
              )}
            </button>

            <p style={{ color: 'var(--muted)', fontSize: 11, textAlign: 'center', marginTop: 10 }}>
              Secured by Razorpay · PCI-DSS compliant
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.75)',
  backdropFilter: 'blur(6px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 16,
};

const modalStyle: React.CSSProperties = {
  position: 'relative',
  background: 'var(--card-bg)',
  border: '1px solid var(--border-bright)',
  borderRadius: 16,
  padding: '28px 28px 24px',
  width: '100%', maxWidth: 420,
  boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
};

const closeBtnStyle: React.CSSProperties = {
  position: 'absolute', top: 16, right: 16,
  background: 'none', border: 'none',
  color: 'var(--muted)', cursor: 'pointer',
  display: 'flex', padding: 4, borderRadius: 6,
  transition: 'color 0.15s',
};

const primaryBtnStyle: React.CSSProperties = {
  width: '100%', padding: '11px 0',
  background: 'var(--accent)', color: '#000',
  border: 'none', borderRadius: 8,
  fontWeight: 700, fontSize: 14,
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  transition: 'opacity 0.2s',
};
