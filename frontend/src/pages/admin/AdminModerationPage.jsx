import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCcw, Search, ShieldCheck } from "lucide-react";
import { AppShell } from "../../layouts/AppShell";
import { GlassCard } from "../../components/GlassCard";
import { Loader } from "../../components/Loader";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { withMinimumDelay } from "../../utils/withMinimumDelay";

export default function AdminModerationPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [reasonMap, setReasonMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [actionLoadingMap, setActionLoadingMap] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api("/admin/users", { token });
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || "Unable to load moderation queue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  async function handleAction(path, userId, reason) {
    const key = `${path}-${userId}`;
    setMessage("");
    setError("");
    setActionLoadingMap((current) => ({ ...current, [key]: true }));
    try {
      await withMinimumDelay(api(`/admin/${path}`, { method: "POST", token, body: { userId, reason } }));
      setMessage(`User ${path} action completed successfully. Email notification has been sent to the user.`);
      await load();
    } catch (err) {
      setError(err.message || "Unable to update user status");
    } finally {
      setActionLoadingMap((current) => ({ ...current, [key]: false }));
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesQuery = `${user.name} ${user.email} ${user.location} ${user.workType} ${user.customWorkType || ""} ${user.status} ${user.accountType || ""} ${user.organizationName || ""}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus = statusFilter === "ALL" ? true : user.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter, users]);

  const statusSummary = useMemo(
    () => [
      { label: "All Accounts", value: users.length, filter: "ALL" },
      { label: "Pending", value: users.filter((user) => user.status === "PENDING_VERIFICATION").length, filter: "PENDING_VERIFICATION" },
      { label: "Active", value: users.filter((user) => user.status === "ACTIVE").length, filter: "ACTIVE" },
      { label: "Suspended", value: users.filter((user) => user.status === "SUSPENDED").length, filter: "SUSPENDED" },
      { label: "Banned", value: users.filter((user) => user.status === "BANNED").length, filter: "BANNED" }
    ],
    [users]
  );

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan">Moderation Hub</p>
            <h1 className="mt-3 font-space text-4xl font-bold">Verification queue, user actions, and account control</h1>
            <p className="mt-3 max-w-3xl text-white/68">
              Review every worker account from one place, run status actions with reasons, and notify the user by email whenever admin approval, suspension, ban, or rejection is applied.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-cyan/30"
            onClick={load}
          >
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            Refresh moderation queue
          </button>
        </div>

        {(message || error) ? (
          <div className={`mb-6 rounded-3xl border px-5 py-4 ${message ? "border-mint/30 bg-mint/10 text-mint" : "border-coral/30 bg-coral/10 text-coral"}`}>
            {message || error}
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {statusSummary.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`rounded-[30px] border p-5 text-left transition ${
                statusFilter === item.filter ? "border-cyan/30 bg-cyan/10" : "border-white/10 bg-white/5 hover:border-cyan/20"
              }`}
              onClick={() => setStatusFilter(item.filter)}
            >
              <p className="text-sm uppercase tracking-[0.22em] text-white/55">{item.label}</p>
              <p className="mt-3 text-3xl font-bold text-white">{item.value}</p>
            </button>
          ))}
        </div>

        <GlassCard>
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/45" />
              <input
                className="field pl-12"
                placeholder="Search by name, email, city, work type, or status"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/65">
              Showing {filteredUsers.length} of {users.length} accounts
            </div>
          </div>
        </GlassCard>

        <div className="mt-6 space-y-4">
          {filteredUsers.map((user) => {
            const isActionLoading =
              actionLoadingMap[`verify-${user._id}`] ||
              actionLoadingMap[`reject-${user._id}`] ||
              actionLoadingMap[`suspend-${user._id}`] ||
              actionLoadingMap[`ban-${user._id}`];

            return (
              <GlassCard key={user._id} className="bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(118,228,247,0.03))]">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold">{user.name}</h2>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">{user.status}</span>
                      <span className="rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan">{user.accountType || "WORKER"}</span>
                    </div>
                    <p className="mt-2 text-white/60">{user.email}</p>
                    <p className="mt-4 text-sm text-white/65">
                      {user.location} | {user.organizationName || user.customWorkType || user.workType} | Created {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                    {user.statusReason ? (
                      <div className="mt-4 rounded-3xl border border-coral/20 bg-coral/10 px-4 py-3 text-sm text-coral">
                        Existing reason: {user.statusReason}
                      </div>
                    ) : null}
                  </div>

                  <div className="w-full xl:max-w-xl">
                    <input
                      className="field"
                      placeholder="Reason for verify, reject, suspend, or ban"
                      value={reasonMap[user._id] || ""}
                      onChange={(e) => setReasonMap((current) => ({ ...current, [user._id]: e.target.value }))}
                    />
                    <div className="mt-4 flex flex-wrap gap-2">
                      {isActionLoading ? (
                        <Loader label="Updating user status..." />
                      ) : (
                        <>
                          <button className="rounded-full bg-mint px-4 py-2 font-semibold text-ink transition hover:scale-[1.02]" onClick={() => handleAction("verify", user._id)}>
                            Verify
                          </button>
                          <button className="rounded-full border border-sand/30 px-4 py-2 text-sand transition hover:bg-sand/10" onClick={() => handleAction("reject", user._id, reasonMap[user._id])}>
                            Reject
                          </button>
                          <button className="rounded-full border border-coral/30 px-4 py-2 text-coral transition hover:bg-coral/10" onClick={() => handleAction("suspend", user._id, reasonMap[user._id])}>
                            Suspend
                          </button>
                          <button className="rounded-full border border-red-500/30 px-4 py-2 text-red-300 transition hover:bg-red-500/10" onClick={() => handleAction("ban", user._id, reasonMap[user._id])}>
                            Ban
                          </button>
                        </>
                      )}
                      <Link
                        className="inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-cyan/10 px-4 py-2 font-semibold text-cyan transition hover:border-cyan/30"
                        to={`/admin/users/${user._id}`}
                      >
                        <ShieldCheck size={16} />
                        Open full detail
                      </Link>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
