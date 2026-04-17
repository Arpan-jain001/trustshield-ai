import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, Plus, Loader, ShieldCheck, Wallet } from 'lucide-react';
import PolicyCard from '../../components/PolicyCard';
import PolicySelectionModal from '../../components/PolicySelectionModal';
import PolicyRazorpayModal from '../../components/PolicyRazorpayModal';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const PoliciesPage = () => {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [activePolicy, setActivePolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [actionType, setActionType] = useState(null); // 'purchase' or 'renew'

  useEffect(() => {
    fetchPolicies();
    fetchActivePolicy();
  }, []);

  useEffect(() => {
    if (location.state?.autoOpenPurchase) {
      setActionType('purchase');
      setShowSelectionModal(true);
      navigate('/policies', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const data = await api('/policy/history', { token });
      setPolicies(data.policies || []);
    } catch (err) {
      console.error('Error fetching policies:', err);
      setError('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivePolicy = async () => {
    try {
      const data = await api('/policy/active-tier', { token });
      setActivePolicy(data.policy);
    } catch (err) {
      if (err.httpStatus !== 404) {
        console.error('Error fetching active policy:', err);
      }
      setActivePolicy(null);
    }
  };

  const handlePurchaseClick = () => {
    setActionType('purchase');
    setShowSelectionModal(true);
  };

  const handleRenewClick = (policy) => {
    setSelectedPolicy(policy);
    setActionType('renew');
    setShowSelectionModal(true);
  };

  const handleCancelClick = async (policy) => {
    if (!window.confirm('Are you sure you want to cancel this policy?')) {
      return;
    }

    try {
      const response = await api('/policy/cancel-tier', {
        method: 'POST',
        token,
        body: { policyId: policy._id }
      });

      fetchPolicies();
      fetchActivePolicy();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePolicySelected = (data) => {
    setSelectedPolicy(data.policy);
    setShowSelectionModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    fetchPolicies();
    fetchActivePolicy();
    setShowPaymentModal(false);
  };

  const activePolicies = policies.filter((policy) => policy.status === 'ACTIVE' && policy.paymentStatus === 'SUCCESS' && new Date(policy.endsAt) > new Date());
  const pendingPolicies = policies.filter((policy) => policy.status === 'PENDING_PAYMENT' || policy.paymentStatus === 'PENDING');
  const expiredPolicies = policies.filter((policy) => policy.status === 'EXPIRED' || policy.status === 'CANCELLED' || (policy.status === 'ACTIVE' && new Date(policy.endsAt) <= new Date()));
  const policySummary = useMemo(() => ({
    active: activePolicies.length,
    pending: pendingPolicies.length,
    expired: expiredPolicies.length,
    totalCoverage: activePolicies.reduce((sum, policy) => sum + Number(policy.claimCoverage || 0), 0),
    monthlySpend: activePolicies.reduce((sum, policy) => sum + Number(policy.monthlyPremium || 0), 0)
  }), [activePolicies, pendingPolicies.length, expiredPolicies.length]);

  return (
    <div className="space-y-8 animate-page-fade-up">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(145deg,rgba(8,20,32,0.96),rgba(15,34,56,0.92),rgba(8,20,32,0.98))] p-6 shadow-2xl md:p-8">
        <div className="pointer-events-none absolute -right-10 top-6 h-40 w-40 rounded-full bg-cyan/10 blur-3xl animate-float-gentle" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-sand/10 blur-3xl animate-float-gentle-delay" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-cyan/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-cyan">
              <ShieldCheck size={14} />
              Policy control center
            </div>
            <h1 className="mt-5 text-4xl font-bold text-white md:text-5xl">My Policies</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/70 md:text-lg">
              Buy, renew, and track your protection plans from one animated dashboard. Select a tier, complete Razorpay payment, and keep your claim coverage active.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition hover:border-cyan/30 hover:bg-white/10"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>
            <button
              onClick={handlePurchaseClick}
              className="inline-flex items-center gap-2 rounded-full bg-cyan px-5 py-3 font-semibold text-ink transition hover:scale-[1.02]"
            >
              <Plus size={18} />
              Buy Weekly Policy
            </button>
          </div>
        </div>

        <div className="relative mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Active policies', value: policySummary.active, tone: 'text-cyan', icon: CheckCircle2 },
            { label: 'Pending payment', value: policySummary.pending, tone: 'text-sand', icon: Clock3 },
            { label: 'Expired / closed', value: policySummary.expired, tone: 'text-coral', icon: ShieldCheck },
            { label: 'Active coverage', value: `₹${policySummary.totalCoverage}`, tone: 'text-mint', icon: Wallet }
          ].map((item) => (
            <div key={item.label} className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-cyan/20 hover:bg-white/8">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm uppercase tracking-[0.22em] text-white/50">{item.label}</p>
                <item.icon className={item.tone} size={18} />
              </div>
              <p className={`mt-4 text-3xl font-bold ${item.tone}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="rounded-[28px] border border-red-200/30 bg-red-500/10 p-4 flex items-start gap-3 backdrop-blur-sm animate-page-fade-up">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-100">{error}</p>
          </div>
        </div>
      )}

      {/* No Policy State */}
      {!activePolicy && (
        <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(83,243,255,0.06),rgba(255,255,255,0.04))] p-8 text-center shadow-2xl animate-page-fade-up">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan/20 bg-cyan/10">
            <ShieldCheck className="text-cyan" />
          </div>
          <h2 className="mt-5 text-3xl font-bold text-white">No Active Policy</h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/70">You need a protection policy to file claims and receive coverage. Choose a plan below to continue.</p>
          <button
            onClick={handlePurchaseClick}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-cyan px-8 py-3 font-semibold text-ink transition hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" />
            Purchase Policy Now
          </button>
        </div>
      )}

      {/* Active Policies */}
      {activePolicies.length > 0 && (
        <section className="animate-page-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Active Policies</h2>
            <button
              onClick={handlePurchaseClick}
              className="inline-flex items-center gap-2 rounded-full bg-cyan px-4 py-2 font-medium text-ink transition hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              Add Another
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activePolicies.map((policy) => (
              <PolicyCard
                key={policy._id}
                policy={policy}
                onRenew={handleRenewClick}
                onCancel={handleCancelClick}
              />
            ))}
          </div>
        </section>
      )}

      {/* Expired/Cancelled Policies */}
      {expiredPolicies.length > 0 && (
        <section className="animate-page-fade-up">
          <h2 className="text-xl font-bold text-white mb-4">Previous Policies</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {expiredPolicies.map((policy) => (
              <PolicyCard
                key={policy._id}
                policy={policy}
                onRenew={handleRenewClick}
              />
            ))}
          </div>
        </section>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12 animate-page-fade-up">
          <Loader className="w-8 h-8 text-cyan animate-spin" />
        </div>
      )}

      {/* Modals */}
      <PolicySelectionModal
        isOpen={showSelectionModal}
        mode={actionType || 'purchase'}
        sourcePolicyId={selectedPolicy?._id}
        onClose={() => {
          setShowSelectionModal(false);
          setActionType(null);
          setSelectedPolicy(null);
        }}
        onPolicySelected={handlePolicySelected}
      />

      {selectedPolicy && (
        <PolicyRazorpayModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPolicy(null);
          }}
          policy={selectedPolicy}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {pendingPolicies.length > 0 && (
        <section className="animate-page-fade-up">
          <h2 className="text-xl font-bold text-white mb-4">Pending Payment</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pendingPolicies.map((policy) => (
              <PolicyCard
                key={policy._id}
                policy={policy}
                onPay={() => {
                  setSelectedPolicy(policy);
                  setShowPaymentModal(true);
                }}
                onCancel={handleCancelClick}
              />
            ))}
          </div>
        </section>
      )}

      {/* Policy Information */}
      <section className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-sm animate-page-fade-up">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-cyan" />
          <div>
            <h2 className="text-xl font-bold text-white">How It Works</h2>
            <p className="text-sm text-white/60">Select, pay, and keep coverage live without leaving this page.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="w-10 h-10 rounded-full bg-cyan text-ink flex items-center justify-center font-bold mb-3">
              1
            </div>
            <h3 className="font-semibold text-white mb-2">Choose a Plan</h3>
            <p className="text-white/70 text-sm">Select from Basic (₹49), Standard (₹99), or Premium (₹149) monthly plans based on your coverage needs.</p>
          </div>
          <div>
            <div className="w-10 h-10 rounded-full bg-cyan text-ink flex items-center justify-center font-bold mb-3">
              2
            </div>
            <h3 className="font-semibold text-white mb-2">Make Payment</h3>
            <p className="text-white/70 text-sm">Complete secure payment via Razorpay. Your premium is transferred to your provider account immediately.</p>
          </div>
          <div>
            <div className="w-10 h-10 rounded-full bg-cyan text-ink flex items-center justify-center font-bold mb-3">
              3
            </div>
            <h3 className="font-semibold text-white mb-2">Get Coverage</h3>
            <p className="text-white/70 text-sm">When a disruption occurs, claims are auto-processed and payouts are sent to you via Razorpay instantly.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PoliciesPage;
