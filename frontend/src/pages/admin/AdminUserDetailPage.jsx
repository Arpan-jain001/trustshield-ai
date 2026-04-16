import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppShell } from "../../layouts/AppShell";
import { GlassCard } from "../../components/GlassCard";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

export default function AdminUserDetailPage() {
  const { userId } = useParams();
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      if (!token) return;
      const response = await api(`/admin/users/${userId}`, { token });
      setData(response);
    }
    load();
  }, [token, userId]);

  const user = data?.user;

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan">User Detail</p>
          <h1 className="mt-3 font-space text-4xl font-bold">{user?.name || "User profile"}</h1>
          <p className="mt-3 max-w-3xl text-white/68">Full account visibility for admin review, moderation, and support context.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <GlassCard>
            <h2 className="text-2xl font-bold">Profile data</h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-3xl bg-white/5 p-4">Email: {user?.email}</div>
              <div className="rounded-3xl bg-white/5 p-4">Secondary email: {user?.secondaryEmail?.email || "Not added"}</div>
              <div className="rounded-3xl bg-white/5 p-4">Status: {user?.status}</div>
              <div className="rounded-3xl bg-white/5 p-4">Location: {user?.location}</div>
              <div className="rounded-3xl bg-white/5 p-4">Address: {user?.address || "Not added"}</div>
              <div className="rounded-3xl bg-white/5 p-4">Mobile: {user?.mobileNumber || "Not added"}</div>
              <div className="rounded-3xl bg-white/5 p-4">Work type: {user?.workType}</div>
              <div className="rounded-3xl bg-white/5 p-4">Hourly rate: INR {user?.hourlyRate || 0}</div>
            </div>
          </GlassCard>

          <div className="space-y-6">
            <GlassCard>
              <h2 className="text-2xl font-bold">Policies</h2>
              <div className="mt-5 space-y-3">
                {data?.policies?.map((policy) => (
                  <div key={policy._id} className="rounded-3xl bg-white/5 p-4">
                    INR {policy.weeklyPremium} | {policy.status} | {new Date(policy.startsAt).toLocaleDateString()}
                  </div>
                ))}
              </div>
            </GlassCard>
            <GlassCard>
              <h2 className="text-2xl font-bold">Claims</h2>
              <div className="mt-5 space-y-3">
                {data?.claims?.map((claim) => (
                  <div key={claim._id} className="rounded-3xl bg-white/5 p-4">
                    <p>{claim.triggerType} | {claim.decision} | Fraud {claim.fraud?.score} | INR {claim.payout?.total}</p>
                    <p className="mt-2 text-sm text-white/65">
                      Integrity {claim.signalFusion?.integrityScore ?? 0} | Spoof {claim.signalFusion?.spoofRisk ?? 0} | Anomaly {claim.anomaly?.verdict || "N/A"}
                    </p>
                    <p className="mt-2 text-sm text-white/50">
                      Provider {claim.disruptionData?.source || "N/A"} | IP threat {claim.signalFusion?.details?.ipThreatScore ?? 0} | IP city {claim.signalFusion?.details?.ipCity || "Unknown"}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>
            <GlassCard>
              <h2 className="text-2xl font-bold">Feature store</h2>
              <div className="mt-5 space-y-3">
                {data?.featureSnapshots?.map((snapshot) => (
                  <div key={snapshot._id} className="rounded-3xl bg-white/5 p-4">
                    <p>{snapshot.source} | Integrity {snapshot.derivedFeatures?.integrityScore} | Spoof {snapshot.derivedFeatures?.spoofRisk}</p>
                    <p className="mt-2 text-sm text-white/65">{snapshot.derivedFeatures?.flags?.join(", ") || "No flags"}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
            <GlassCard>
              <h2 className="text-2xl font-bold">Graph edges</h2>
              <div className="mt-5 space-y-3">
                {data?.graphEdges?.map((edge) => (
                  <div key={edge._id} className="rounded-3xl bg-white/5 p-4">
                    {edge.edgeType} | {edge.value} | Weight {edge.weight}
                  </div>
                ))}
              </div>
            </GlassCard>
            <GlassCard>
              <h2 className="text-2xl font-bold">Alerts</h2>
              <div className="mt-5 space-y-3">
                {data?.alerts?.map((alert) => (
                  <div key={alert._id} className="rounded-3xl bg-white/5 p-4">
                    {alert.title} | {alert.severity}
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
