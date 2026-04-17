import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const PolicyRazorpayModal = ({ isOpen, onClose, policy, onPaymentSuccess }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'processing', 'success', 'failed'

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setPaymentStatus(null);
    }
  }, [isOpen]);

  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Razorpay script'));
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      setPaymentStatus('processing');

      // Load Razorpay script
      await loadRazorpayScript();

      // Fetch payment config
      const configData = await api('/claim/payment/config', { token });

      if (!configData.razorpay?.enabled || !configData.razorpay?.keyId) {
        setError('Payment gateway not configured. Please contact support.');
        setPaymentStatus('failed');
        return;
      }

      // Create Razorpay order
      const orderData = await api('/orders', {
        method: 'POST',
        token,
        body: {
          amount: policy.monthlyPremium,
          currency: 'INR',
          description: `${policy.tier} Policy - Monthly Premium`,
          policyId: policy._id
        }
      });
      const razorpayOrderId = orderData.id;

      // Initialize Razorpay payment
      const options = {
        key: configData.razorpay.keyId,
        amount: policy.monthlyPremium * 100,
        currency: 'INR',
        name: 'TrustShield AI',
        description: `${policy.tier} Policy Payment`,
        order_id: razorpayOrderId,
        handler: async (response) => {
          await handlePaymentSuccess(response, razorpayOrderId);
        },
        prefill: {
          email: 'user@trustshield.ai',
          contact: '+919999999999'
        },
        theme: {
          color: '#2563eb'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message || 'Payment initiation failed. Please try again.');
      setPaymentStatus('failed');
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (response, razorpayOrderId) => {
    try {
      setPaymentStatus('processing');

      // Verify payment
      const verifyResponse = await api('/policy/verify-payment', {
        method: 'POST',
        token,
        body: {
          policyId: policy._id,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        }
      });

      setPaymentStatus('success');
      setTimeout(() => {
        onPaymentSuccess?.(response);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Payment verification failed');
      setPaymentStatus('failed');
      console.error('Verification error:', err);
    }
  };

  if (!isOpen || !policy) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <h2 className="text-xl font-bold">Complete Payment</h2>
          <p className="mt-1 text-blue-100">Secure payment via Razorpay</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Plan:</span>
              <span className="font-semibold">{policy.tier}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Coverage:</span>
              <span className="font-semibold">₹{policy.claimCoverage}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-center">
              <span className="text-lg font-bold">Amount Due:</span>
              <span className="text-2xl font-bold text-blue-600">₹{policy.monthlyPremium}</span>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Payment Failed</p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900">Payment Successful!</p>
                <p className="text-xs text-green-700 mt-1">Your policy is now active. Redirecting...</p>
              </div>
            </div>
          )}

          {paymentStatus === 'processing' && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Loader className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Processing Payment</p>
                <p className="text-xs text-blue-700 mt-1">Please wait while we process your payment...</p>
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-700">
              <span className="font-semibold">🔒 Secure Payment:</span> Your payment is processed securely through Razorpay. 
              Money will be transferred to your connected provider account.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading || paymentStatus === 'processing'}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={loading || paymentStatus === 'processing' || paymentStatus === 'success'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {paymentStatus === 'success' ? 'Payment Complete' : 'Pay ₹' + policy.monthlyPremium}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyRazorpayModal;
