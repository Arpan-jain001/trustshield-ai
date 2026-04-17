import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const PolicySelectionModal = ({ isOpen, onClose, onPolicySelected, mode = 'purchase', sourcePolicyId }) => {
  const { token } = useAuth();
  const [tiers, setTiers] = useState([]);
  const [selectedTier, setSelectedTier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchPolicyTiers();
    }
  }, [isOpen]);

  const fetchPolicyTiers = async () => {
    try {
      setLoading(true);
      const data = await api('/policy/tiers');
      setTiers(data.tiers || []);
      setError(null);
    } catch (err) {
      setError('Failed to load policy tiers. Please try again.');
      console.error('Error fetching tiers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTier = (tier) => {
    setSelectedTier(tier);
  };

  const handleContinue = async () => {
    if (!selectedTier) return;
    if (mode === 'renew' && !sourcePolicyId) {
      setError('No policy selected for renewal.');
      return;
    }
    
    try {
      setLoading(true);
      const endpoint = mode === 'renew' ? '/policy/renew-tier' : '/policy/purchase-tier';
      const response = await api(endpoint, {
        method: 'POST',
        token,
        body: mode === 'renew'
          ? { policyId: sourcePolicyId, tier: selectedTier.tier }
          : { tier: selectedTier.tier }
      });

      onPolicySelected(response);
    } catch (err) {
      setError('Failed to purchase policy. Please try again.');
      console.error('Error purchasing policy:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <h2 className="text-2xl font-bold">{mode === 'renew' ? 'Renew Your Protection Plan' : 'Choose Your Protection Plan'}</h2>
          <p className="mt-2 text-blue-100">{mode === 'renew' ? 'Select a new tier and continue coverage' : 'Select a plan that works best for you'}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading && tiers.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {tiers.map((tier) => (
                  <div
                    key={tier.tier}
                    onClick={() => handleSelectTier(tier)}
                    className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                      selectedTier?.tier === tier.tier
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{tier.displayName}</h3>
                        <p className="text-sm text-gray-600">{tier.description}</p>
                      </div>
                      {selectedTier?.tier === tier.tier && (
                        <CheckCircle2 className="w-6 h-6 text-blue-600" />
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="text-3xl font-bold text-blue-600">
                        ₹{tier.monthlyPremium}
                        <span className="text-lg text-gray-600 font-normal">/month</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">₹{tier.claimCoverage} claim coverage</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">Instant claim payouts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">24/7 support</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">30-day auto renewal</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">What you get:</span> When a disruption is detected (rain, pollution, curfew), we automatically 
                  process your claim and transfer the coverage amount to your account via Razorpay. No paperwork needed!
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedTier || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicySelectionModal;
