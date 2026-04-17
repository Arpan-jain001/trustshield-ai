import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, Clock, DollarSign, Loader as LoaderIcon, RefreshCcw, TrendingUp } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { AppShell } from "../../layouts/AppShell";
import { GlassCard } from "../../components/GlassCard";
import { Loader } from "../../components/Loader";
import { withMinimumDelay } from "../../utils/withMinimumDelay";

function WithdrawalCard({ amount, status, date, claimCount }) {
  const statusConfig = {
    INITIATED: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "Processing" },
    COMPLETED: { bg: "bg-green-500/20", text: "text-green-400", label: "Completed" },
    FAILED: { bg: "bg-red-500/20", text: "text-red-400", label: "Failed" },
    CANCELLED: { bg: "bg-gray-500/20", text: "text-gray-400", label: "Cancelled" }
  };

  const config = statusConfig[status] || statusConfig.INITIATED;

  return (
    <GlassCard className={`${config.bg} border-l-4`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm uppercase tracking-[0.25em] text-white/50">Amount Withdrawn</p>
          <p className="mt-3 text-3xl font-bold text-white">₹{amount.toLocaleString()}</p>
          <p className={`mt-2 text-sm font-semibold ${config.text}`}>{config.label}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ArrowDown className={`w-8 h-8 ${config.text}`} />
          <span className="text-xs text-white/60">{new Date(date).toLocaleDateString()}</span>
        </div>
      </div>
      {claimCount && (
        <p className="mt-4 text-xs text-white/60">From {claimCount} claim(s)</p>
      )}
    </GlassCard>
  );
}

function StatCard({ label, value, icon: Icon, color = "text-mint" }) {
  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-white/50">{label}</p>
          <p className="mt-3 text-2xl font-bold text-white">{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </GlassCard>
  );
}

export default function WithdrawalPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(0);
  const [settledClaims, setSettledClaims] = useState([]);
  const [history, setHistory] = useState([]);
  const [withdrawing, setWithdrawing] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch available withdrawal amount
  const fetchAvailable = withMinimumDelay(async () => {
    try {
      const response = await api.get("/user/withdrawal/available");
      setAvailable(response.data.available || 0);
      setSettledClaims(response.data.claims || []);
      setError("");
    } catch (err) {
      setError("Failed to fetch withdrawal balance");
      console.error(err);
    }
  });

  // Fetch withdrawal history
  const fetchHistory = withMinimumDelay(async () => {
    try {
      const response = await api.get("/user/withdrawal/history");
      setHistory(response.data.withdrawals || []);
    } catch (err) {
      console.error("Failed to fetch withdrawal history:", err);
    }
  }, 1000);

  useEffect(() => {
    if (!user) {
      navigate("/auth/login");
      return;
    }

    const load = async () => {
      await Promise.all([fetchAvailable(), fetchHistory()]);
      setLoading(false);
    };

    load();
  }, [user, navigate]);

  // Handle withdrawal
  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (parseFloat(amount) > available) {
      setError(`Insufficient balance. Available: ₹${available.toLocaleString()}`);
      return;
    }

    setWithdrawing(true);

    try {
      const initiateResponse = await api.post("/user/withdrawal/initiate", {
        amount: parseFloat(amount)
      });

      const { withdrawalId, transferReference, paymentMethod, completedAt } = initiateResponse.data;

      setSuccess(
        `Withdrawal of ₹${Number(amount).toLocaleString()} completed successfully via ${paymentMethod || "BANK_TRANSFER"}${transferReference ? ` | Ref ${transferReference}` : ""}.`
      );
      setAmount("");
      if (withdrawalId) {
        console.log("Withdrawal ID:", withdrawalId, "completedAt:", completedAt);
      }
      setTimeout(() => {
        fetchAvailable();
        fetchHistory();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to request payout");
      setWithdrawing(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  const stats = {
    totalWithdrawn: history
      .filter(w => w.status === "COMPLETED")
      .reduce((sum, w) => sum + w.amount, 0),
    completedCount: history.filter(w => w.status === "COMPLETED").length,
    pendingCount: history.filter(w => w.status === "INITIATED").length,
    settledClaimsCount: settledClaims.length,
    settledClaimsAmount: settledClaims.reduce((sum, claim) => sum + (claim.amount || 0), 0)
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(118,228,247,0.16),transparent_28%),linear-gradient(135deg,#07111d_0%,#0b1a2b_52%,#07111d_100%)] p-6">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan">Worker wallet</p>
              <h1 className="mt-3 font-space text-4xl font-bold text-white sm:text-5xl">Settlement Wallet</h1>
              <p className="mt-3 max-w-3xl text-white/65">View your claim wallet balance, inspect settled claim credits, and request a withdrawal to your bank account.</p>
            </div>
            <button
              onClick={() => {
                fetchAvailable();
                fetchHistory();
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-cyan/30 disabled:opacity-60"
            >
              <RefreshCcw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh wallet
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">
            <GlassCard className="border border-cyan/20 bg-[linear-gradient(145deg,rgba(118,228,247,0.12),rgba(255,255,255,0.05))]">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan">Wallet balance</p>
              <p className="mt-3 text-4xl font-bold text-white">₹{available.toLocaleString()}</p>
              <p className="mt-2 text-sm text-white/65">Ready for direct payout</p>
            </GlassCard>
            <StatCard label="Settled claims" value={stats.settledClaimsCount} icon={TrendingUp} color="text-mint" />
            <StatCard label="Wallet credited" value={`₹${stats.settledClaimsAmount.toLocaleString()}`} icon={DollarSign} color="text-sand" />
            <StatCard label="Withdrawn history" value={stats.completedCount} icon={ArrowDown} color="text-green-400" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div className="space-y-6">
              <GlassCard>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-mint" />
                  Request Payout
                </h2>

                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Amount (₹)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      disabled={withdrawing || available === 0}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-mint disabled:opacity-50"
                    />
                  </div>

                  <div className="flex gap-2 text-xs text-white/60">
                    <button
                      type="button"
                      onClick={() => setAmount(available.toString())}
                      disabled={withdrawing}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded border border-white/20 transition disabled:opacity-50"
                    >
                      Max: ₹{available.toLocaleString()}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={withdrawing || !amount || available === 0}
                    className="w-full py-3 bg-mint text-slate-950 font-semibold rounded-lg hover:bg-mint/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {withdrawing ? (
                      <>
                        <LoaderIcon className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ArrowDown className="w-4 h-4" />
                        Withdraw Now
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-xs text-white/50">💡 This is a simulated direct payout from your claim wallet. No deposit or payment gateway action is required.</p>
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-white/50">Claim wallet</p>
                    <h2 className="mt-2 text-2xl font-bold text-white">Settled claim credits</h2>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">{settledClaims.length} entries</span>
                </div>

                <div className="mt-5 space-y-3 max-h-[26rem] overflow-y-auto pr-1">
                  {settledClaims.length ? (
                    settledClaims.map((claim) => (
                      <div key={claim.claimId} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">₹{(claim.amount || 0).toLocaleString()}</p>
                            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Claim {claim.claimId?.toString().slice(-6) || "N/A"}</p>
                          </div>
                          <span className="rounded-full bg-mint/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-mint">Available</span>
                        </div>
                        <p className="mt-3 text-sm text-white/60">
                          Total credited: ₹{(claim.total || 0).toLocaleString()} | Withdrawn: ₹{(claim.withdrawnAmount || 0).toLocaleString()}
                        </p>
                        <p className="mt-2 text-xs text-white/45">Approved on {claim.approvedAt ? new Date(claim.approvedAt).toLocaleString() : "N/A"}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
                      No settled claim credits are available yet.
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>

            <div>
              <GlassCard>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-mint" />
                    Withdrawn history
                  </h2>
                  <button
                    onClick={() => fetchHistory()}
                    disabled={loading}
                    className="p-2 hover:bg-white/10 rounded-lg transition disabled:opacity-50"
                    title="Refresh"
                  >
                    <RefreshCcw className="w-4 h-4 text-white/60 hover:text-white" />
                  </button>
                </div>

                {history.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-white/60">No withdrawal history yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[38rem] overflow-y-auto pr-1">
                    {history.map((item) => {
                      const statusConfig = {
                        INITIATED: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "Processing" },
                        COMPLETED: { bg: "bg-green-500/10", text: "text-green-400", label: "Completed" },
                        FAILED: { bg: "bg-red-500/10", text: "text-red-400", label: "Failed" },
                        CANCELLED: { bg: "bg-gray-500/10", text: "text-gray-400", label: "Cancelled" }
                      };
                      const config = statusConfig[item.status] || statusConfig.INITIATED;

                      return (
                        <div key={item._id} className={`p-4 rounded-lg border border-white/10 ${config.bg}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-white">₹{item.amount.toLocaleString()}</p>
                              <p className="text-xs text-white/60 mt-1">{item.paymentMethod || "BANK_TRANSFER"} | {new Date(item.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`text-xs font-semibold px-3 py-1 rounded ${config.bg} ${config.text}`}>
                              {config.label}
                            </span>
                          </div>
                          {item.transferReference ? (
                            <p className="text-xs text-white/60 mt-2">Ref {item.transferReference}</p>
                          ) : null}
                          {item.completedAt && (
                            <p className="text-xs text-white/60 mt-2">
                              Completed: {new Date(item.completedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
