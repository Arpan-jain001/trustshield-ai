import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line } from "recharts";
import { RefreshCcw, Trash2 } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { AppShell } from "../../layouts/AppShell";
import { GlassCard } from "../../components/GlassCard";
import { Loader } from "../../components/Loader";
import { withMinimumDelay } from "../../utils/withMinimumDelay";
import { frontendEnv } from "../../config/env";

const colors = ["#76e4f7", "#ffd7a8", "#ff9478", "#b5f5c8", "#8bbcff"];

export default function AdminDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});
  const [fraudResolutionMap, setFraudResolutionMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: "", email: "" });
  const [adminMessage, setAdminMessage] = useState("");
  const [adminError, setAdminError] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [deletingAdminId, setDeletingAdminId] = useState("");
  const [deleteAdminState, setDeleteAdminState] = useState({ adminId: "", reason: "" });
  const [claimReviewLoadingMap, setClaimReviewLoadingMap] = useState({});
  const [fraudLoadingMap, setFraudLoadingMap] = useState({});
  const [feedbackResolutionMap, setFeedbackResolutionMap] = useState({});
  const [feedbackLoadingMap, setFeedbackLoadingMap] = useState({});
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    severity: "INFO",
    audience: "GLOBAL",
    userId: "",
    sendEmailToUser: true
  });

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const response = await api("/admin/users", { token });
      setData(response);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  async function handleClaimReview(claimId, action) {
    setAdminError("");
    setAdminMessage("");
    const key = `${claimId}-${action}`;
    setClaimReviewLoadingMap((current) => ({ ...current, [key]: true }));
    try {
      const response = await withMinimumDelay(
        api("/admin/claims/review", {
          method: "POST",
          token,
          body: {
            claimId,
            action,
            notes: reviewNotes[claimId] || ""
          }
        })
      );
      setAdminMessage(response.message);
      setReviewNotes((current) => ({ ...current, [claimId]: "" }));
      await load();
    } catch (error) {
      setAdminError(error.message || "Unable to complete claim review");
    } finally {
      setClaimReviewLoadingMap((current) => ({ ...current, [key]: false }));
    }
  }

  async function handleResolveFraudAlert(alertId) {
    setAdminError("");
    setAdminMessage("");
    if (!fraudResolutionMap[alertId]?.trim()) {
      setAdminError("Enter a resolution note before closing the fraud alert");
      return;
    }

    setFraudLoadingMap((current) => ({ ...current, [alertId]: true }));
    try {
      const response = await withMinimumDelay(
        api("/admin/fraud-alerts/resolve", {
          method: "POST",
          token,
          body: {
            alertId,
            reason: fraudResolutionMap[alertId]
          }
        })
      );
      setAdminMessage(response.message);
      setFraudResolutionMap((current) => ({ ...current, [alertId]: "" }));
      await load();
    } catch (error) {
      setAdminError(error.message || "Unable to resolve fraud alert");
    } finally {
      setFraudLoadingMap((current) => ({ ...current, [alertId]: false }));
    }
  }

  async function handleCreateAdmin(e) {
    e.preventDefault();
    setAdminError("");
    setAdminMessage("");

    if (!adminForm.name.trim()) {
      setAdminError("Invalid admin name");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(adminForm.email)) {
      setAdminError("Invalid email");
      return;
    }

    setCreatingAdmin(true);
    try {
      const response = await withMinimumDelay(
        api("/admin/create-admin", {
          method: "POST",
          token,
          body: adminForm
        })
      );
      setAdminMessage(response.message);
      setAdminForm({ name: "", email: "" });
      await load();
    } catch (error) {
      setAdminError(error.message);
    } finally {
      setCreatingAdmin(false);
    }
  }

  async function handleDeleteAdmin(adminId) {
    if (!deleteAdminState.reason.trim() || deleteAdminState.adminId !== adminId) {
      setAdminError("Enter a reason before deleting this admin permanently");
      return;
    }

    setAdminError("");
    setAdminMessage("");
    setDeletingAdminId(adminId);
    try {
      await withMinimumDelay(
        api("/admin/delete-admin", {
          method: "POST",
          token,
          body: { adminId, reason: deleteAdminState.reason }
        })
      );
      setDeleteAdminState({ adminId: "", reason: "" });
      setAdminMessage("Admin deleted permanently");
      await load();
    } catch (error) {
      setAdminError(error.message || "Unable to delete admin");
    } finally {
      setDeletingAdminId("");
    }
  }

  async function handleSendNotification(e) {
    e.preventDefault();
    setAdminError("");
    setAdminMessage("");

    if (!notificationForm.title.trim()) {
      setAdminError("Notification title is required");
      return;
    }
    if (!notificationForm.message.trim()) {
      setAdminError("Notification message is required");
      return;
    }
    if (notificationForm.audience === "USER" && !notificationForm.userId) {
      setAdminError("Select a user for direct notification");
      return;
    }

    setNotificationLoading(true);
    try {
      const response = await withMinimumDelay(
        api("/admin/notifications", {
          method: "POST",
          token,
          body: notificationForm
        })
      );

      setAdminMessage(response.message);
      setNotificationForm({
        title: "",
        message: "",
        severity: "INFO",
        audience: "GLOBAL",
        userId: "",
        sendEmailToUser: true
      });
      await load();
    } catch (error) {
      setAdminError(error.message || "Unable to send notification");
    } finally {
      setNotificationLoading(false);
    }
  }

  async function handleFeedbackStatus(feedbackId, status) {
    setAdminError("");
    setAdminMessage("");
    setFeedbackLoadingMap((current) => ({ ...current, [feedbackId]: true }));
    try {
      const response = await withMinimumDelay(
        api("/admin/feedback/status", {
          method: "POST",
          token,
          body: {
            feedbackId,
            status,
            resolutionNote: feedbackResolutionMap[feedbackId] || ""
          }
        })
      );
      setAdminMessage(response.message);
      setFeedbackResolutionMap((current) => ({ ...current, [feedbackId]: "" }));
      await load();
    } catch (error) {
      setAdminError(error.message || "Unable to update feedback");
    } finally {
      setFeedbackLoadingMap((current) => ({ ...current, [feedbackId]: false }));
    }
  }

  async function handleDeleteFeedback(feedbackId) {
    setAdminError("");
    setAdminMessage("");
    setFeedbackLoadingMap((current) => ({ ...current, [feedbackId]: true }));
    try {
      const response = await withMinimumDelay(
        api(`/admin/feedback/${feedbackId}`, {
          method: "DELETE",
          token
        })
      );
      setAdminMessage(response.message);
      await load();
    } catch (error) {
      setAdminError(error.message || "Unable to delete feedback");
    } finally {
      setFeedbackLoadingMap((current) => ({ ...current, [feedbackId]: false }));
    }
  }

  async function handleDeleteNotification(notificationId) {
    setAdminError("");
    setAdminMessage("");
    try {
      const response = await withMinimumDelay(
        api(`/user/notifications/${notificationId}`, {
          method: "DELETE",
          token
        })
      );
      setAdminMessage(response.message);
      await load();
    } catch (error) {
      setAdminError(error.message || "Unable to delete notification");
    }
  }

  const chartData = useMemo(
    () => data?.stats?.map((item) => ({ name: item._id, value: item.total })) || [],
    [data]
  );

  const radarData = useMemo(
    () => [
      { subject: "Verification", value: data?.users?.filter((user) => user.status === "PENDING_VERIFICATION").length || 0 },
      { subject: "Fraud", value: data?.fraudAlerts?.length || 0 },
      { subject: "Claims", value: data?.claims?.length || 0 },
      { subject: "Policies", value: data?.policyCount || 0 },
      { subject: "Suspended", value: data?.users?.filter((user) => user.status === "SUSPENDED").length || 0 }
    ],
    [data]
  );

  const adminHealthData = useMemo(
    () =>
      (data?.admins || []).map((admin, index) => ({
        name: admin.name.split(" ")[0] || `A${index + 1}`,
        created: index + 1,
        active: admin.status === "ACTIVE" ? 1 : 0
      })),
    [data]
  );

  const statusBreakdown = useMemo(
    () =>
      (data?.stats || []).map((item) => ({
        name: item._id.replaceAll("_", " "),
        value: item.total
      })),
    [data]
  );

  const accountTypeBreakdown = useMemo(
    () => [
      { label: "Workers", value: data?.users?.filter((item) => item.accountType === "WORKER").length || 0, tone: "text-cyan" },
      { label: "Insurers", value: data?.users?.filter((item) => item.accountType === "INSURER").length || 0, tone: "text-sand" },
      { label: "Platform Ops", value: data?.users?.filter((item) => item.accountType === "PLATFORM").length || 0, tone: "text-mint" }
    ],
    [data]
  );

  const payoutAuditTrail = useMemo(
    () =>
      (data?.claims || [])
        .filter((claim) => (claim.payout?.total || 0) > 0 || claim.payout?.transactionId)
        .slice(0, 10),
    [data]
  );

  const getLifecycleLabel = (claim) => {
    if (!claim) return "No claim";
    if (claim.payout?.status === "SUCCESS") return "Completed payout";
    if (claim.review?.status === "PENDING" || claim.decision === "NEEDS_REVIEW") return "Waiting manual review";
    if (claim.decision === "REJECTED") return "Rejected";
    if (claim.decision === "APPROVED") return "Approved";
    return "Created";
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan">Admin control center</p>
            <h1 className="mt-3 font-space text-4xl font-bold">Verification, fraud monitoring, and live claims analytics</h1>
            <p className="mt-3 max-w-3xl text-white/68">
              Review real database-backed user states, fraud signals, moderation reasons, payout telemetry, and policy momentum from one operational dashboard.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-cyan/30"
            onClick={load}
          >
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            Refresh data
          </button>
        </div>
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(118,228,247,0.08),rgba(255,255,255,0.04))]">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan">Admin Access</p>
            <h3 className="mt-3 text-2xl font-bold">Create operator accounts</h3>
            <p className="mt-3 text-white/68">Grant new admin access with auto-generated credentials and email delivery.</p>
          </GlassCard>
          <GlassCard className="bg-[linear-gradient(145deg,rgba(255,148,120,0.08),rgba(255,255,255,0.04))]">
            <p className="text-sm uppercase tracking-[0.3em] text-coral">Moderation</p>
            <h3 className="mt-3 text-2xl font-bold">Suspend, ban, verify, reject</h3>
            <p className="mt-3 text-white/68">Run high-impact moderation actions with reason capture and traceable UI states.</p>
          </GlassCard>
          <GlassCard className="bg-[linear-gradient(145deg,rgba(181,245,200,0.08),rgba(255,255,255,0.04))]">
            <p className="text-sm uppercase tracking-[0.3em] text-mint">Quick Sync</p>
            <h3 className="mt-3 text-2xl font-bold">Refresh the command center</h3>
            <p className="mt-3 text-white/68">Pull the latest users, fraud alerts, claims, and policy telemetry instantly.</p>
            <button
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-cyan/30"
              onClick={load}
            >
              <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
              Refresh command center
            </button>
          </GlassCard>
        </div>
        {(adminMessage || adminError) ? (
          <div className={`mb-6 rounded-3xl border px-5 py-4 ${adminMessage ? "border-mint/30 bg-mint/10 text-mint" : "border-coral/30 bg-coral/10 text-coral"}`}>
            {adminMessage || adminError}
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <GlassCard><p className="text-white/50">Total users</p><p className="mt-3 text-3xl font-bold">{data?.users?.length || 0}</p></GlassCard>
          <GlassCard><p className="text-white/50">Pending verification</p><p className="mt-3 text-3xl font-bold text-sand">{data?.users?.filter((user) => user.status === "PENDING_VERIFICATION").length || 0}</p></GlassCard>
          <GlassCard><p className="text-white/50">Fraud alerts</p><p className="mt-3 text-3xl font-bold text-coral">{data?.fraudAlerts?.length || 0}</p></GlassCard>
          <GlassCard><p className="text-white/50">Manual reviews</p><p className="mt-3 text-3xl font-bold text-sand">{data?.reviewClaims?.length || 0}</p></GlassCard>
          <GlassCard><p className="text-white/50">Policies sold</p><p className="mt-3 text-3xl font-bold text-mint">{data?.policyCount || 0}</p></GlassCard>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {accountTypeBreakdown.map((item) => (
            <GlassCard key={item.label} className="bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(118,228,247,0.03))]">
              <p className="text-sm uppercase tracking-[0.24em] text-white/50">{item.label}</p>
              <p className={`mt-3 text-3xl font-bold ${item.tone}`}>{item.value}</p>
            </GlassCard>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(118,228,247,0.08),rgba(255,255,255,0.04))]">
            <h2 className="text-2xl font-bold">Create admin access</h2>
            <p className="mt-2 text-white/68">
              Grant another operator access to the admin panel. A temporary password is auto-generated and emailed with login instructions.
            </p>
            <form className="mt-6 space-y-4" onSubmit={handleCreateAdmin}>
              <input
                className="field"
                placeholder="Admin name"
                value={adminForm.name}
                onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
              />
              <input
                className="field"
                placeholder="Admin email"
                type="email"
                value={adminForm.email}
                onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
              />
              <div className="flex flex-wrap items-center gap-3">
                {creatingAdmin ? (
                  <Loader label="Creating admin operator..." />
                ) : (
                  <button className="rounded-full bg-cyan px-5 py-3 font-semibold text-ink transition hover:scale-[1.02]" type="submit">
                    Create admin
                  </button>
                )}
                <p className="text-sm text-white/55">Support contact: {frontendEnv.supportEmail}</p>
              </div>
            </form>
            <div className="mt-6 rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(118,228,247,0.03))] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-cyan">Current admin operators</p>
                  <p className="mt-2 text-sm text-white/58">Protected operators with dashboard-level access and governance capability.</p>
                </div>
                <div className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white/60">
                  {data?.admins?.length || 0} admins
                </div>
              </div>
              <div className="mt-5 h-40 rounded-[24px] bg-black/20 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={adminHealthData}>
                    <XAxis dataKey="name" stroke="#d4e8ff" />
                    <YAxis stroke="#d4e8ff" allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="active" stroke="#76e4f7" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-3">
                {data?.admins?.map((admin) => (
                  <div key={admin._id} className="rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm text-white/75 transition hover:border-cyan/20 hover:bg-black/30">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <p className="text-base font-semibold">{admin.name}</p>
                        <p className="text-white/55">{admin.email}</p>
                        <div className="mt-3 inline-flex rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-cyan">
                          Admin Access
                        </div>
                      </div>
                      <div className="grid gap-2 xl:min-w-[320px]">
                        <input
                          className="field"
                          placeholder="Reason for permanent admin deletion"
                          value={deleteAdminState.adminId === admin._id ? deleteAdminState.reason : ""}
                          onChange={(e) => setDeleteAdminState({ adminId: admin._id, reason: e.target.value })}
                        />
                        {deletingAdminId === admin._id ? (
                          <Loader label="Deleting admin..." />
                        ) : (
                          <button
                            className="w-full rounded-full border border-red-500/30 px-4 py-2 text-red-300 transition hover:bg-red-500/10"
                            onClick={() => handleDeleteAdmin(admin._id)}
                          >
                            Permanently delete admin
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
          <GlassCard>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold">User status distribution</h2>
                <p className="mt-2 max-w-xl text-white/65">Track the current account health mix, then jump straight into the moderation hub to act on pending, suspended, or blocked users.</p>
              </div>
              <Link className="inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-cyan/10 px-4 py-2 font-semibold text-cyan transition hover:border-cyan/30" to="/admin/moderation">
                Open moderation hub
              </Link>
            </div>
            <div className="mt-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="h-72 rounded-[30px] border border-white/10 bg-black/20 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={100} innerRadius={56}>
                      {chartData.map((entry, index) => (
                        <Cell key={entry.name} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {statusBreakdown.map((item, index) => (
                  <div key={item.name} className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                      <p className="text-sm uppercase tracking-[0.22em] text-white/55">{item.name}</p>
                    </div>
                    <p className="mt-4 text-3xl font-bold text-white">{item.value}</p>
                  </div>
                ))}
                <div className="rounded-[28px] border border-cyan/15 bg-cyan/10 p-5 sm:col-span-2">
                  <p className="text-sm uppercase tracking-[0.22em] text-cyan">Operational note</p>
                  <p className="mt-3 text-white/75">
                    Verification, rejection, suspension, and ban actions now run from a separate dedicated moderation page so the dashboard stays focused on analytics and system overview.
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
          <GlassCard>
            <h2 className="text-2xl font-bold">Operational pressure map</h2>
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.2)" />
                  <PolarAngleAxis dataKey="subject" stroke="#d4e8ff" />
                  <Radar dataKey="value" stroke="#76e4f7" fill="#76e4f7" fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {radarData.map((item) => (
                <div key={item.subject} className="rounded-3xl bg-white/5 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-white/50">{item.subject}</p>
                  <p className="mt-2 text-2xl font-bold text-cyan">{item.value}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(181,245,200,0.08),rgba(255,255,255,0.04))]">
            <h2 className="text-2xl font-bold">Notification broadcast center</h2>
            <p className="mt-2 text-white/68">
              Send a global operational alert or a direct message to a single worker. You can also send the same notification by email.
            </p>
            <form className="mt-6 space-y-4" onSubmit={handleSendNotification}>
              <input
                className="field"
                placeholder="Notification title"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
              />
              <textarea
                className="field min-h-28"
                placeholder="Notification message"
                value={notificationForm.message}
                onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
              />
              <div className="grid gap-4 md:grid-cols-3">
                <select className="field" value={notificationForm.audience} onChange={(e) => setNotificationForm({ ...notificationForm, audience: e.target.value })}>
                  <option value="GLOBAL">Global</option>
                  <option value="USER">Specific user</option>
                </select>
                <select className="field" value={notificationForm.severity} onChange={(e) => setNotificationForm({ ...notificationForm, severity: e.target.value })}>
                  <option value="INFO">Info</option>
                  <option value="WARN">Warn</option>
                  <option value="CRITICAL">Critical</option>
                </select>
                <label className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                  <input
                    type="checkbox"
                    checked={notificationForm.sendEmailToUser}
                    onChange={(e) => setNotificationForm({ ...notificationForm, sendEmailToUser: e.target.checked })}
                  />
                  Email delivery
                </label>
              </div>
              {notificationForm.audience === "USER" ? (
                <select className="field" value={notificationForm.userId} onChange={(e) => setNotificationForm({ ...notificationForm, userId: e.target.value })}>
                  <option value="">Select user</option>
                  {data?.users?.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} | {user.email}
                    </option>
                  ))}
                </select>
              ) : null}
              {notificationLoading ? (
                <Loader label="Sending notification..." />
              ) : (
                <button className="rounded-full bg-cyan px-5 py-3 font-semibold text-ink transition hover:scale-[1.02]" type="submit">
                  Send notification
                </button>
              )}
            </form>
            <div className="mt-6 space-y-3">
              {data?.notifications?.map((notification) => (
                <div key={notification._id} className="rounded-3xl bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold">{notification.title}</p>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">{notification.audience}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/65">{notification.message}</p>
                  <p className="mt-2 text-xs text-white/45">
                    Severity: {notification.severity} | Email: {notification.emailSent ? "Sent" : "In-app only"}
                  </p>
                    <button
                      className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/70 transition hover:border-coral/30 hover:text-coral"
                      onClick={() => handleDeleteNotification(notification._id)}
                    >
                      <Trash2 size={12} />
                      Delete notification
                    </button>
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard className="bg-[linear-gradient(145deg,rgba(118,228,247,0.08),rgba(255,255,255,0.04))]">
            <h2 className="text-2xl font-bold">Feedback inbox</h2>
            <p className="mt-2 text-white/68">Review product feedback from workers, operators, and guests. Move entries through triage without leaving the admin surface.</p>
            <div className="mt-6 space-y-3">
              {data?.feedback?.length ? data.feedback.map((item) => (
                <div key={item._id} className="rounded-3xl bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-white/55">{item.email} | {item.role} | {item.category}</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">
                      {item.status} | {item.rating}/5
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-white/68">{item.message}</p>
                  <textarea
                    className="field mt-3 min-h-20"
                    placeholder="Resolution note"
                    value={feedbackResolutionMap[item._id] || ""}
                    onChange={(e) => setFeedbackResolutionMap((current) => ({ ...current, [item._id]: e.target.value }))}
                  />
                  {feedbackLoadingMap[item._id] ? (
                    <div className="mt-3">
                      <Loader label="Updating feedback..." />
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button className="rounded-full border border-sand/30 px-4 py-2 text-sand transition hover:bg-sand/10" onClick={() => handleFeedbackStatus(item._id, "IN_REVIEW")}>
                        Mark in review
                      </button>
                      <button className="rounded-full bg-mint px-4 py-2 font-semibold text-ink transition hover:scale-[1.02]" onClick={() => handleFeedbackStatus(item._id, "RESOLVED")}>
                        Resolve feedback
                      </button>
                      <button className="rounded-full border border-coral/30 px-4 py-2 text-coral transition hover:bg-coral/10" onClick={() => handleDeleteFeedback(item._id)}>
                        Delete permanently
                      </button>
                    </div>
                  )}
                </div>
              )) : <p className="text-white/70">No feedback has been submitted yet.</p>}
            </div>
          </GlassCard>
          <GlassCard>
            <h2 className="text-2xl font-bold">Recent claim decisions</h2>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-sand">Pending claims: {data?.reviewClaims?.length || 0}</p>
            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.claims?.map((claim) => ({ name: claim.user?.name || "User", payout: claim.payout?.total || 0, fraud: claim.fraud?.score || 0, pending: claim.decision === "NEEDS_REVIEW" ? 1 : 0 })) || []}>
                  <XAxis dataKey="name" stroke="#d4e8ff" />
                  <YAxis stroke="#d4e8ff" />
                  <Tooltip />
                  <Bar dataKey="payout" fill="#76e4f7" radius={[10, 10, 0, 0]} />
                  <Bar dataKey="fraud" fill="#ff9478" radius={[10, 10, 0, 0]} />
                  <Bar dataKey="pending" fill="#ffd7a8" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
          <GlassCard className="bg-[linear-gradient(145deg,rgba(255,215,168,0.08),rgba(255,255,255,0.04))]">
            <h2 className="text-2xl font-bold">Manual review queue</h2>
            <div className="mt-6 space-y-3">
              {data?.reviewClaims?.length ? data.reviewClaims.map((claim) => (
                <div key={claim._id} className="rounded-3xl bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold">{claim.user?.name} | {claim.triggerType}</p>
                    <span className="rounded-full bg-sand/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-sand">{claim.review?.status || "PENDING"}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/70">
                    Fraud {claim.fraud?.score} | Anomaly {claim.anomaly?.score} | Spoof risk {claim.signalFusion?.spoofRisk}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em]">
                    <span className="rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1 text-cyan">
                      Provider: {claim.provider?.organizationName || claim.provider?.name || claim.providerName || "N/A"}
                    </span>
                    <span className="rounded-full border border-coral/20 bg-coral/10 px-3 py-1 text-coral">
                      IP threat: {claim.signalFusion?.details?.ipThreatScore ?? 0}
                    </span>
                    <span className="rounded-full border border-sand/20 bg-sand/10 px-3 py-1 text-sand">
                      IP city: {claim.signalFusion?.details?.ipCity || "Unknown"}
                    </span>
                  </div>
                  {claim.signalFusion?.flags?.length ? <p className="mt-2 text-sm text-white/50">{claim.signalFusion.flags.join(", ")}</p> : null}
                  <p className="mt-2 text-sm text-white/60">{claim.decisionReason}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">Source: {claim.decisionSource || "AUTO"}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">Lifecycle: {getLifecycleLabel(claim)}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">Requested by: {claim.review?.requestedBy?.name || "N/A"}</p>
                  <textarea
                    className="field mt-3 min-h-24"
                    placeholder="Review note"
                    value={reviewNotes[claim._id] || ""}
                    onChange={(e) => setReviewNotes((current) => ({ ...current, [claim._id]: e.target.value }))}
                  />
                  {claimReviewLoadingMap[`${claim._id}-APPROVE`] || claimReviewLoadingMap[`${claim._id}-REJECT`] ? (
                    <div className="mt-3">
                      <Loader label="Submitting claim review..." />
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button className="rounded-full bg-mint px-4 py-2 font-semibold text-ink transition hover:scale-[1.02]" onClick={() => handleClaimReview(claim._id, "APPROVE")}>
                        Approve claim
                      </button>
                      <button className="rounded-full border border-coral/30 px-4 py-2 text-coral transition hover:bg-coral/10" onClick={() => handleClaimReview(claim._id, "REJECT")}>
                        Reject claim
                      </button>
                    </div>
                  )}
                </div>
              )) : <p className="text-white/70">No claims are waiting for manual review.</p>}
            </div>
          </GlassCard>
          <GlassCard>
            <h2 className="text-2xl font-bold">Fraud alerts</h2>
            <div className="mt-6 space-y-3">
              {data?.fraudAlerts?.length ? data.fraudAlerts.map((alert) => (
                <div key={alert._id} className="rounded-3xl bg-white/5 p-4 transition hover:bg-white/10">
                  <p className="font-semibold">{alert.user?.name}</p>
                  <p className="mt-2 text-sm text-white/70">Fraud score: {alert.score}</p>
                  <p className="mt-2 text-sm text-white/60">{alert.flags?.join(", ")}</p>
                  <p className="mt-2 text-sm text-white/50">Linked accounts: {alert.linkedAccounts || 0} | Cluster: {alert.clusterId || "N/A"}</p>
                  {alert.claim ? (
                    <p className="mt-2 text-sm text-white/45">
                      Source: {alert.claim?.disruptionData?.source || "N/A"} | IP threat: {alert.claim?.signalFusion?.details?.ipThreatScore ?? 0}
                    </p>
                  ) : null}
                  <input
                    className="field mt-3"
                    placeholder="Resolution note"
                    value={fraudResolutionMap[alert._id] || ""}
                    onChange={(e) => setFraudResolutionMap((current) => ({ ...current, [alert._id]: e.target.value }))}
                  />
                  {fraudLoadingMap[alert._id] ? (
                    <div className="mt-3">
                      <Loader label="Resolving fraud alert..." />
                    </div>
                  ) : (
                    <button
                      className="mt-3 rounded-full border border-white/15 px-4 py-2 text-white transition hover:border-cyan/30 hover:text-cyan"
                      onClick={() => handleResolveFraudAlert(alert._id)}
                    >
                      Resolve fraud alert
                    </button>
                  )}
                </div>
              )) : <p className="text-white/70">No active fraud alerts.</p>}
            </div>
          </GlassCard>
        </div>
        <div className="mt-6">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(181,245,200,0.08),rgba(255,255,255,0.04))]">
            <h2 className="text-2xl font-bold">Payout audit history</h2>
            <p className="mt-2 text-sm text-white/60">Recent settled payouts with decision and transaction metadata for admin audit.</p>
            <div className="mt-6 space-y-3">
              {payoutAuditTrail.length ? (
                payoutAuditTrail.map((claim) => (
                  <div key={claim._id} className="rounded-3xl bg-white/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold">{claim.user?.name || "Worker"} | {claim.triggerType}</p>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">{claim.payout?.status || claim.decision}</span>
                    </div>
                    <p className="mt-2 text-sm text-mint">INR {claim.payout?.total || 0} | Txn {claim.payout?.transactionId || "N/A"} | {claim.payout?.gateway || "SIMULATOR"}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">Source: {claim.decisionSource || "AUTO"}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">Payout source: {claim.payout?.payoutSource || "N/A"}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">Lifecycle: {getLifecycleLabel(claim)}</p>
                    <p className="mt-2 text-sm text-white/60">Processed {claim.payout?.processedAt ? new Date(claim.payout.processedAt).toLocaleString() : "N/A"} | {claim.payout?.processingSeconds || 0}s</p>
                    <p className="mt-2 text-sm text-white/50">{claim.decisionReason || "No decision reason available"}</p>
                    {claim.user?._id ? (
                      <Link className="mt-3 inline-flex rounded-full border border-cyan/20 bg-cyan/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-cyan transition hover:border-cyan/30" to={`/admin/users/${claim.user._id}`}>
                        Open worker detail
                      </Link>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-white/70">No payout history available yet.</p>
              )}
            </div>
          </GlassCard>
        </div>
        <div className="mt-6">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(255,215,168,0.08),rgba(118,228,247,0.04),rgba(255,255,255,0.04))]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-sand">Moderation Workflow</p>
                <h2 className="mt-3 text-2xl font-bold">User verification and status actions now live in a dedicated page</h2>
                <p className="mt-3 max-w-3xl text-white/68">
                  Open the moderation hub to review every account, apply reasons, verify instantly, and jump into full user detail pages for deeper investigation.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link className="rounded-full bg-cyan px-5 py-3 font-semibold text-ink transition hover:scale-[1.02]" to="/admin/moderation">
                  Open moderation hub
                </Link>
                <Link className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-cyan/30" to="/admin/users">
                  Open users directory
                </Link>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>
    </AppShell>
  );
}
