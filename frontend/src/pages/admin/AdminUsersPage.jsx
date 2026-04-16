import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCcw, Search } from "lucide-react";
import { AppShell } from "../../layouts/AppShell";
import { GlassCard } from "../../components/GlassCard";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api("/admin/users", { token });
      setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.email} ${user.location} ${user.workType} ${user.customWorkType || ""}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan">Users Directory</p>
            <h1 className="mt-3 font-space text-4xl font-bold">All created user accounts in one place</h1>
            <p className="mt-3 max-w-3xl text-white/68">Open any user to inspect full profile, policy history, claims, and notification context.</p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-cyan/30"
            onClick={load}
          >
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            Refresh users
          </button>
        </div>

        <GlassCard>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/45" />
            <input className="field pl-12" placeholder="Search users by name, email, city, or work type" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </GlassCard>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {filteredUsers.map((user) => (
            <Link key={user._id} to={`/admin/users/${user._id}`}>
              <GlassCard className="h-full transition hover:border-cyan/25">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-bold">{user.name}</p>
                    <p className="mt-1 text-white/60">{user.email}</p>
                    <p className="mt-4 text-sm text-white/65">{user.location} | {user.customWorkType || user.workType}</p>
                  </div>
                  <div className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">{user.status}</div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
