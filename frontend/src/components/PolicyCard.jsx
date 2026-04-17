import React from 'react';
import { AlertCircle, Zap, Calendar, CreditCard } from 'lucide-react';

const PolicyCard = ({ policy, onRenew, onCancel, onPay }) => {
  const getTierLabel = (tier) => {
    const labels = {
      BASIC: 'Basic Protection',
      STANDARD: 'Standard Protection',
      PREMIUM: 'Premium Protection'
    };
    return labels[tier] || tier;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING_PAYMENT':
        return 'bg-amber-100 text-amber-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const daysUntilExpiry = Math.ceil((new Date(policy.endsAt) - new Date()) / (1000 * 60 * 60 * 24));
  const isExpiring = daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry <= 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{getTierLabel(policy.tier)}</h3>
            <p className="text-sm text-gray-600 mt-1">Subscription-based policy</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(policy.status)}`}>
            {policy.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-4">
        {/* Premium and Coverage */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-gray-600">Monthly Premium</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">₹{policy.monthlyPremium}</p>
          </div>

          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-gray-600">Claim Coverage</span>
            </div>
            <p className="text-2xl font-bold text-green-600">₹{policy.claimCoverage}</p>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-semibold text-gray-600">Validity Period</span>
          </div>
          <div className="space-y-1 mt-2">
            <p className="text-sm text-gray-700">
              Started: <span className="font-semibold">{new Date(policy.startsAt).toLocaleDateString()}</span>
            </p>
            <p className="text-sm text-gray-700">
              Expires: <span className="font-semibold">{new Date(policy.endsAt).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {isExpired && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">Policy Expired</p>
              <p className="text-xs text-red-700 mt-1">Your policy has expired. Please renew to continue coverage.</p>
            </div>
          </div>
        )}

        {isExpiring && !isExpired && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Expiring Soon</p>
              <p className="text-xs text-amber-700 mt-1">Your policy expires in {daysUntilExpiry} days. Renew now to avoid coverage gap.</p>
            </div>
          </div>
        )}

        {policy.status === 'ACTIVE' && !isExpired && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-3">
            <Zap className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-900">Policy Active</p>
              <p className="text-xs text-green-700 mt-1">You're covered! Claims are automatically processed.</p>
            </div>
          </div>
        )}

        {/* Payment Status */}
        {policy.paymentStatus && (
          <div className="text-xs text-gray-600">
            <p>Payment Status: <span className="font-semibold">{policy.paymentStatus}</span></p>
            {policy.transactionId && (
              <p>Transaction ID: <span className="font-mono text-xs">{policy.transactionId.slice(0, 12)}...</span></p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex justify-end gap-3">
        {policy.status === 'PENDING_PAYMENT' && (
          <button
            onClick={() => onPay?.(policy)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Complete Payment
          </button>
        )}
        {policy.status === 'ACTIVE' && (
          <>
            <button
              onClick={() => onRenew?.(policy)}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Renew Policy
            </button>
            <button
              onClick={() => onCancel?.(policy)}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </>
        )}
        {isExpired && (
          <button
            onClick={() => onRenew?.(policy)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Renew Now
          </button>
        )}
      </div>
    </div>
  );
};

export default PolicyCard;
