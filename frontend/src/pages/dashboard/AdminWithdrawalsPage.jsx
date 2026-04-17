import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, Calendar, DollarSign, Filter, Loader as LoaderIcon, RefreshCcw, TrendingUp, User } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { AppShell } from "../../layouts/AppShell";
import { GlassCard } from "../../components/GlassCard";
import { Loader } from "../../components/Loader";
import { withMinimumDelay } from "../../utils/withMinimumDelay";

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

export default function AdminWithdrawalsPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch withdrawals
  const fetchWithdrawals = withMinimumDelay(async () => {
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", 20);
      if (statusFilter) params.append("status", statusFilter);

      const response = await api.get(`/admin/withdrawals?${params}`);
      setWithdrawals(response.data.withdrawals || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (err) {
      console.error("Failed to fetch withdrawals:", err);
    }
  });

  // Fetch statistics
  const fetchStats = withMinimumDelay(async () => {
    setLoadingStats(true);
    try {
      const response = await api.get("/admin/withdrawals/stats");
      setStats(response.data);
      setRecentTransactions(response.data.recentTransactions || []);
    } catch (err) {
      console.error("Failed to fetch withdrawal stats:", err);
    } finally {
      setLoadingStats(false);
    }
  });

  useEffect(() => {
    if (!user || user.accountType !== "ADMIN") {
      navigate("/auth/login");
      return;
    }

    const load = async () => {
      await Promise.all([fetchStats(), fetchWithdrawals()]);
      setLoading(false);
    };

    load();
  }, [user, navigate]);

  useEffect(() => {
    setPage(1);
    fetchWithdrawals();
  }, [statusFilter]);

  useEffect(() => {
    fetchWithdrawals();
  }, [page]);

  const handleViewDetails = async (withdrawalId) => {
    try {
      const response = await api.get(`/admin/withdrawals/${withdrawalId}`);
      setSelectedWithdrawal(response.data);
      setShowDetails(true);
    } catch (err) {
      console.error("Failed to fetch withdrawal details:", err);
    }
  };

  if (loading) {
    return <Loader />;
  }

  const byStatus = stats?.byStatus || [];
  const overall = stats?.overall?.[0] || {};

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Worker Withdrawals</h1>
            <p className="text-white/60">Monitor all worker payout withdrawals and transactions</p>
          </div>

          {/* Statistics Grid */}
          {loadingStats ? (
            <div className="mb-8 flex justify-center">
              <LoaderIcon className="w-6 h-6 text-mint animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Withdrawals" value={overall.totalWithdrawals || 0} icon={ArrowDown} color="text-blue-400" />
              <StatCard label="Total Amount" value={`₹${(overall.totalAmount || 0).toLocaleString()}`} icon={TrendingUp} color="text-green-400" />
              <StatCard label="Completed" value={`${overall.completedCount || 0} / ₹${(overall.completedAmount || 0).toLocaleString()}`} icon={DollarSign} color="text-mint" />
              <StatCard label="Pending" value={overall.pendingCount || 0} icon={RefreshCcw} color="text-yellow-400" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Filters & Recent Transactions */}
            <div className="lg:col-span-1 space-y-6">
              {/* Status Filter */}
              <GlassCard>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-mint" />
                  Filter
                </h3>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-mint"
                >
                  <option value="">All Status</option>
                  <option value="INITIATED">Processing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </GlassCard>

              {/* Status Breakdown */}
              {byStatus.length > 0 && (
                <GlassCard>
                  <h3 className="text-lg font-semibold text-white mb-4">Status Breakdown</h3>
                  <div className="space-y-2">
                    {byStatus.map((item) => {
                      const statusColor = {
                        INITIATED: "text-yellow-400",
                        COMPLETED: "text-green-400",
                        FAILED: "text-red-400",
                        CANCELLED: "text-gray-400"
                      };
                      return (
                        <div key={item._id} className="flex items-center justify-between p-2 rounded hover:bg-white/5">
                          <span className="text-sm text-white/70">{item._id || "Unknown"}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${statusColor[item._id] || "text-white"}`}>
                              {item.count}
                            </span>
                            <span className="text-xs text-white/60">₹{item.total.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              )}
            </div>

            {/* Recent Transactions & Withdrawals List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Transactions */}
              {recentTransactions.length > 0 && (
                <GlassCard>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-mint" />
                    Recent Transactions
                  </h3>
                  <div className="space-y-2">
                    {recentTransactions.map((item) => {
                      const statusConfig = {
                        INITIATED: { bg: "bg-yellow-500/10", text: "text-yellow-400" },
                        COMPLETED: { bg: "bg-green-500/10", text: "text-green-400" },
                        FAILED: { bg: "bg-red-500/10", text: "text-red-400" },
                        CANCELLED: { bg: "bg-gray-500/10", text: "text-gray-400" }
                      };
                      const config = statusConfig[item.status] || statusConfig.INITIATED;

                      return (
                        <div key={item._id} className={`p-3 rounded-lg border border-white/10 ${config.bg}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-white flex items-center gap-2">
                                <User className="w-4 h-4 text-mint" />
                                {item.userName}
                              </p>
                              <p className="text-xs text-white/60 mt-1">{item.userEmail}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-white">₹{item.amount.toLocaleString()}</p>
                              <p className={`text-xs font-semibold ${config.text}`}>
                                {item.status === "INITIATED" ? "Processing" : item.status}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              )}

              {/* All Withdrawals */}
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-mint" />
                    All Withdrawals
                  </h3>
                  <button
                    onClick={() => fetchWithdrawals()}
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                    title="Refresh"
                  >
                    <RefreshCcw className="w-4 h-4 text-white/60 hover:text-white" />
                  </button>
                </div>

                {withdrawals.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-white/60">No withdrawals found</p>
                  </div>
                ) : (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-3 px-3 text-white/70 font-semibold">User</th>
                            <th className="text-right py-3 px-3 text-white/70 font-semibold">Amount</th>
                            <th className="text-center py-3 px-3 text-white/70 font-semibold">Status</th>
                            <th className="text-left py-3 px-3 text-white/70 font-semibold">Date</th>
                            <th className="text-center py-3 px-3 text-white/70 font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {withdrawals.map((item) => {
                            const statusConfig = {
                              INITIATED: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "Processing" },
                              COMPLETED: { bg: "bg-green-500/10", text: "text-green-400", label: "Completed" },
                              FAILED: { bg: "bg-red-500/10", text: "text-red-400", label: "Failed" },
                              CANCELLED: { bg: "bg-gray-500/10", text: "text-gray-400", label: "Cancelled" }
                            };
                            const config = statusConfig[item.status] || statusConfig.INITIATED;

                            return (
                              <tr key={item._id} className="border-b border-white/5 hover:bg-white/5 transition">
                                <td className="py-3 px-3">
                                  <div>
                                    <p className="text-white font-medium">{item.user.name}</p>
                                    <p className="text-xs text-white/60">{item.user.email}</p>
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-right font-semibold text-white">
                                  ₹{item.amount.toLocaleString()}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span className={`text-xs font-semibold px-2 py-1 rounded ${config.bg} ${config.text}`}>
                                    {config.label}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-white/60">
                                  {new Date(item.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <button
                                    onClick={() => handleViewDetails(item._id)}
                                    className="text-mint hover:text-mint/80 text-sm font-semibold transition"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-6 flex items-center justify-center gap-2">
                        <button
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition disabled:opacity-50 text-white"
                        >
                          Previous
                        </button>
                        <span className="text-white/60">
                          Page {page} of {totalPages}
                        </span>
                        <button
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          disabled={page === totalPages}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition disabled:opacity-50 text-white"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </GlassCard>
            </div>
          </div>

          {/* Details Modal */}
          {showDetails && selectedWithdrawal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <GlassCard className="max-w-md w-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Withdrawal Details</h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-white/60 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-white/60">User</p>
                    <p className="text-white font-semibold">{selectedWithdrawal.user.name}</p>
                    <p className="text-xs text-white/60">{selectedWithdrawal.user.email}</p>
                  </div>

                  <div>
                    <p className="text-sm text-white/60">Amount</p>
                    <p className="text-2xl font-bold text-mint">₹{selectedWithdrawal.amount.toLocaleString()}</p>
                  </div>

                  <div>
                    <p className="text-sm text-white/60">Status</p>
                    <p className="text-white font-semibold capitalize">{selectedWithdrawal.status}</p>
                  </div>

                  <div>
                    <p className="text-sm text-white/60">Requested</p>
                    <p className="text-white">{new Date(selectedWithdrawal.createdAt).toLocaleString()}</p>
                  </div>

                  {selectedWithdrawal.completedAt && (
                    <div>
                      <p className="text-sm text-white/60">Completed</p>
                      <p className="text-white">{new Date(selectedWithdrawal.completedAt).toLocaleString()}</p>
                    </div>
                  )}

                  {selectedWithdrawal.razorpayDetails?.paymentId && (
                    <div>
                      <p className="text-sm text-white/60">Payment ID</p>
                      <p className="text-xs text-white/80 font-mono break-all">{selectedWithdrawal.razorpayDetails.paymentId}</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
