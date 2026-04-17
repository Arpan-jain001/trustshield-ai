import { useEffect, useState } from "react";
import { Bell, Mail, RefreshCcw, Trash2 } from "lucide-react";
import { AppShell } from "../../layouts/AppShell";
import { GlassCard } from "../../components/GlassCard";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

export default function NotificationsPage() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api("/user/notifications", { token });
      setNotifications(data.notifications || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteNotification(notificationId) {
    try {
      await api(`/user/notifications/${notificationId}`, {
        method: "DELETE",
        token
      });
      await load();
    } catch (err) {
      setError(err.message || "Unable to delete notification");
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan">Notifications</p>
            <h1 className="mt-3 font-space text-4xl font-bold">Admin alerts and operational updates</h1>
            <p className="mt-3 max-w-3xl text-white/68">
              View notifications sent by admins through the web app. If email delivery was enabled, the same alert also arrives in your inbox.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-cyan/30"
            onClick={load}
          >
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            Refresh notifications
          </button>
        </div>

        {error && <div className="mb-6 rounded-3xl border border-coral/30 bg-coral/10 px-5 py-4 text-coral">{error}</div>}

        <div className="grid gap-4 md:grid-cols-3">
          <GlassCard>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan">Total notifications</p>
            <p className="mt-3 text-3xl font-bold">{notifications.length}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm uppercase tracking-[0.25em] text-sand">Global alerts</p>
            <p className="mt-3 text-3xl font-bold">{notifications.filter((item) => item.audience === "GLOBAL").length}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-sm uppercase tracking-[0.25em] text-mint">Email-enabled</p>
            <p className="mt-3 text-3xl font-bold">{notifications.filter((item) => item.emailSent).length}</p>
          </GlassCard>
        </div>

        <div className="mt-6 space-y-4">
          {notifications.map((item) => (
            <GlassCard key={item._id} className="bg-[linear-gradient(145deg,rgba(118,228,247,0.06),rgba(255,255,255,0.04))]">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-cyan/10 p-3">
                    <Bell className="text-cyan" size={18} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{item.title}</p>
                    <p className="mt-2 leading-7 text-white/70">{item.message}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em]">
                      <span className="rounded-full border border-white/10 px-3 py-1 text-white/70">{item.audience}</span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-white/70">{item.severity}</span>
                      {item.emailSent ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1 text-cyan">
                          <Mail size={12} />
                          Email sent
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3 text-sm text-white/55">
                  <div>{new Date(item.createdAt).toLocaleString()}</div>
                  <button
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/70 transition hover:border-coral/30 hover:text-coral"
                    onClick={() => deleteNotification(item._id)}
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
