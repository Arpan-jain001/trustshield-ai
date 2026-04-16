import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Activity, Network, RefreshCcw, RotateCcw, ServerCog, ShieldCheck, Workflow, Siren } from "lucide-react";
import { AppShell } from "../../layouts/AppShell";
import { GlassCard } from "../../components/GlassCard";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { AccountStatusGate } from "../../components/AccountStatusGate";
import { Loader } from "../../components/Loader";

const colors = ["#76e4f7", "#ffd7a8", "#ff9478", "#b5f5c8"];

export default function PlatformOpsDashboard() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [incidentForm, setIncidentForm] = useState({ title: "", description: "", severity: "MEDIUM" });
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [training, setTraining] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [creatingIncident, setCreatingIncident] = useState(false);
  const [retryingId, setRetryingId] = useState("");
  const [replayingId, setReplayingId] = useState("");
  const [updatingIncidentId, setUpdatingIncidentId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const response = await api("/platform/dashboard", { token });
      setData(response);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load platform operations dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  const isApproved = user?.status === "ACTIVE";

  async function processQueue() {
    setProcessing(true);
    setMessage("");
    setError("");
    try {
      const response = await api("/platform/queue/process", { method: "POST", token, body: { limit: 5 } });
      setMessage(response.message);
      await load();
    } catch (err) {
      setError(err.message || "Unable to process queue");
    } finally {
      setProcessing(false);
    }
  }

  async function trainModels() {
    setTraining(true);
    setMessage("");
    setError("");
    try {
      const response = await api("/platform/models/train", { method: "POST", token });
      setMessage(response.message);
      await load();
    } catch (err) {
      setError(err.message || "Unable to queue model training");
    } finally {
      setTraining(false);
    }
  }

  async function rollbackModels() {
    setRollingBack(true);
    setMessage("");
    setError("");
    try {
      const response = await api("/platform/models/rollback", { method: "POST", token });
      setMessage(response.message);
      await load();
    } catch (err) {
      setError(err.message || "Unable to rollback model artifacts");
    } finally {
      setRollingBack(false);
    }
  }

  async function retryJob(jobId) {
    setRetryingId(jobId);
    setMessage("");
    setError("");
    try {
      const response = await api("/platform/queue/retry", { method: "POST", token, body: { jobId } });
      setMessage(response.message);
      await load();
    } catch (err) {
      setError(err.message || "Unable to retry queue job");
    } finally {
      setRetryingId("");
    }
  }

  async function replayJob(jobId) {
    setReplayingId(jobId);
    setMessage("");
    setError("");
    try {
      const response = await api("/platform/queue/replay", { method: "POST", token, body: { jobId } });
      setMessage(response.message);
      await load();
    } catch (err) {
      setError(err.message || "Unable to replay queue job");
    } finally {
      setReplayingId("");
    }
  }

  async function createIncident() {
    setCreatingIncident(true);
    setMessage("");
    setError("");
    try {
      const response = await api("/platform/incidents", { method: "POST", token, body: incidentForm });
      setMessage(response.message);
      setIncidentForm({ title: "", description: "", severity: "MEDIUM" });
      await load();
    } catch (err) {
      setError(err.message || "Unable to create incident");
    } finally {
      setCreatingIncident(false);
    }
  }

  async function updateIncident(incidentId, status) {
    setUpdatingIncidentId(incidentId);
    setMessage("");
    setError("");
    try {
      const response = await api(`/platform/incidents/${incidentId}`, { method: "PUT", token, body: { status } });
      setMessage(response.message);
      await load();
    } catch (err) {
      setError(err.message || "Unable to update incident");
    } finally {
      setUpdatingIncidentId("");
    }
  }

  const queuePressure = useMemo(
    () =>
      (data?.featureSnapshots || []).slice().reverse().map((snapshot, index) => ({
        name: `S${index + 1}`,
        integrity: snapshot.derivedFeatures?.integrityScore || 0,
        spoof: snapshot.derivedFeatures?.spoofRisk || 0
      })),
    [data]
  );

  const notificationSeverity = useMemo(
    () =>
      (data?.notifications || []).slice(0, 6).map((item, index) => ({
        name: `A${index + 1}`,
        value: item.severity === "CRITICAL" ? 3 : item.severity === "WARN" ? 2 : 1
      })),
    [data]
  );

  const queueMix = useMemo(
    () => [
      { name: "Pending", value: data?.summary?.queuePending || 0 },
      { name: "Failed", value: data?.summary?.queueFailed || 0 },
      { name: "Incidents", value: data?.summary?.openIncidents || 0 }
    ],
    [data]
  );

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan">Platform / Ops dashboard</p>
            <h1 className="mt-3 font-space text-4xl font-bold">{user?.organizationName || user?.name || "Operations Surface"}</h1>
            <p className="mt-3 max-w-3xl text-white/70">Run queue operations, replay failed jobs, manage incident workflow, and monitor environment health for the TrustShield control plane.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-cyan/30" onClick={load}>
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            Refresh ops view
          </button>
        </div>

        {message || error ? (
          <div className={`mb-6 rounded-3xl border px-5 py-4 ${message ? "border-mint/30 bg-mint/10 text-mint" : "border-coral/30 bg-coral/10 text-coral"}`}>
            {message || error}
          </div>
        ) : null}

        <AccountStatusGate
          user={user}
          label="Operations approval"
          supportText="The ops dashboard is visible now, but system-level controls stay locked until admin approval is complete."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <GlassCard><p className="text-sm uppercase tracking-[0.24em] text-white/50">Feature snapshots</p><p className="mt-3 text-3xl font-bold text-cyan">{data?.summary?.featureSnapshots || 0}</p></GlassCard>
          <GlassCard><p className="text-sm uppercase tracking-[0.24em] text-white/50">Graph edges</p><p className="mt-3 text-3xl font-bold text-sand">{data?.summary?.graphEdges || 0}</p></GlassCard>
          <GlassCard><p className="text-sm uppercase tracking-[0.24em] text-white/50">Queue pending</p><p className="mt-3 text-3xl font-bold text-mint">{data?.summary?.queuePending || 0}</p></GlassCard>
          <GlassCard><p className="text-sm uppercase tracking-[0.24em] text-white/50">Queue failed</p><p className="mt-3 text-3xl font-bold text-coral">{data?.summary?.queueFailed || 0}</p></GlassCard>
          <GlassCard><p className="text-sm uppercase tracking-[0.24em] text-white/50">Open incidents</p><p className="mt-3 text-3xl font-bold text-white">{data?.summary?.openIncidents || 0}</p></GlassCard>
          <GlassCard><p className="text-sm uppercase tracking-[0.24em] text-white/50">Environment</p><p className="mt-3 text-3xl font-bold text-white">{data?.environment?.status || "N/A"}</p><p className="mt-2 text-sm text-white/60">Score {data?.environment?.postureScore || 0}</p></GlassCard>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(118,228,247,0.08),rgba(255,255,255,0.04))]">
            <div className="flex items-center gap-3">
              <ServerCog className="text-cyan" />
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan">Ops controls</p>
                <h2 className="mt-2 text-3xl font-bold">Operational actions</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-white/5 p-5">
                <Workflow className="text-cyan" />
                <p className="mt-4 text-xl font-bold">Process queue batch</p>
                <p className="mt-2 text-sm leading-7 text-white/68">Process pending signal-ingestion and model-training jobs in a controlled batch.</p>
                <div className="mt-4">{processing ? <Loader label="Processing queue..." /> : <button className="rounded-full bg-cyan px-4 py-2 font-semibold text-ink" onClick={processQueue} disabled={!isApproved}>Process queue</button>}</div>
              </div>
              <div className="rounded-3xl bg-white/5 p-5">
                <ShieldCheck className="text-mint" />
                <p className="mt-4 text-xl font-bold">Queue model training</p>
                <p className="mt-2 text-sm leading-7 text-white/68">Enqueue a fresh model-training job so the latest artifacts can be generated.</p>
                <div className="mt-4">{training ? <Loader label="Queueing model training..." /> : <button className="rounded-full border border-white/15 px-4 py-2 text-white transition hover:border-cyan/30 hover:text-cyan" onClick={trainModels} disabled={!isApproved}>Queue training job</button>}</div>
              </div>
              <div className="rounded-3xl bg-white/5 p-5">
                <RotateCcw className="text-sand" />
                <p className="mt-4 text-xl font-bold">Rollback active models</p>
                <p className="mt-2 text-sm leading-7 text-white/68">Promote the latest archived artifacts back to active status when a training cycle must be reverted.</p>
                <div className="mt-4">{rollingBack ? <Loader label="Rolling back artifacts..." /> : <button className="rounded-full border border-white/15 px-4 py-2 text-white transition hover:border-sand/30 hover:text-sand" onClick={rollbackModels} disabled={!isApproved}>Rollback models</button>}</div>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="text-2xl font-bold">Environment posture</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-3xl bg-white/5 p-4"><p className="text-sm text-white/50">Status</p><p className="mt-3 text-3xl font-bold text-white">{data?.environment?.status || "N/A"}</p></div>
              <div className="rounded-3xl bg-white/5 p-4"><p className="text-sm text-white/50">Posture score</p><p className="mt-3 text-3xl font-bold text-cyan">{data?.environment?.postureScore || 0}</p></div>
              <div className="rounded-3xl bg-white/5 p-4"><p className="text-sm text-white/50">Audit failures</p><p className="mt-3 text-3xl font-bold text-coral">{data?.environment?.auditFailures || 0}</p></div>
              <div className="rounded-3xl bg-white/5 p-4"><p className="text-sm text-white/50">Config warnings</p><p className="mt-3 text-3xl font-bold text-sand">{data?.environment?.configWarnings?.length || 0}</p></div>
            </div>
            {data?.environment?.configWarnings?.length ? (
              <div className="mt-5 rounded-3xl bg-white/5 p-4 text-sm text-white/70">
                {data.environment.configWarnings.join(" | ")}
              </div>
            ) : null}
          </GlassCard>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <GlassCard>
            <h2 className="text-2xl font-bold">Integrity vs spoof trend</h2>
            <div className="mt-5 h-72 rounded-[24px] bg-black/20 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={queuePressure}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="name" stroke="#d4e8ff" />
                  <YAxis stroke="#d4e8ff" />
                  <Tooltip />
                  <Area type="monotone" dataKey="integrity" stroke="#76e4f7" fill="rgba(118,228,247,0.24)" />
                  <Area type="monotone" dataKey="spoof" stroke="#ff9478" fill="rgba(255,148,120,0.14)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="text-2xl font-bold">Queue composition</h2>
            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={queueMix} dataKey="value" nameKey="name" outerRadius={90}>
                    {queueMix.map((entry, index) => (
                      <Cell key={entry.name} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <GlassCard>
            <div className="flex items-center gap-3">
              <Siren className="text-coral" />
              <div>
                <h2 className="text-2xl font-bold">Incident desk</h2>
                <p className="mt-2 text-sm text-white/60">Create, acknowledge, and resolve operational incidents from the same control surface.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4">
              <input className="field" placeholder="Incident title" value={incidentForm.title} onChange={(e) => setIncidentForm((current) => ({ ...current, title: e.target.value }))} />
              <select className="field" value={incidentForm.severity} onChange={(e) => setIncidentForm((current) => ({ ...current, severity: e.target.value }))}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
              <textarea className="field min-h-24" placeholder="Incident description" value={incidentForm.description} onChange={(e) => setIncidentForm((current) => ({ ...current, description: e.target.value }))} />
            </div>
            <div className="mt-5">
              {creatingIncident ? <Loader label="Creating incident..." /> : <button className="rounded-full bg-cyan px-5 py-3 font-semibold text-ink transition hover:scale-[1.02]" onClick={createIncident} disabled={!isApproved}>Create incident</button>}
            </div>
            <div className="mt-6 space-y-3">
              {(data?.incidents || []).map((incident) => (
                <div key={incident._id} className="rounded-3xl bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{incident.title}</p>
                      <p className="text-sm text-white/60">{incident.severity} severity</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">{incident.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/68">{incident.description || "No incident description provided."}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {incident.status === "OPEN" ? <button className="rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:border-sand/30 hover:text-sand" onClick={() => updateIncident(incident._id, "ACKNOWLEDGED")} disabled={!isApproved || updatingIncidentId === incident._id}>Acknowledge</button> : null}
                    {incident.status !== "RESOLVED" ? <button className="rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:border-cyan/30 hover:text-cyan" onClick={() => updateIncident(incident._id, "RESOLVED")} disabled={!isApproved || updatingIncidentId === incident._id}>Resolve</button> : null}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="text-2xl font-bold">Alert intensity</h2>
            <div className="mt-5 h-72 rounded-[24px] bg-black/20 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={notificationSeverity}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="name" stroke="#d4e8ff" />
                  <YAxis stroke="#d4e8ff" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ffd7a8" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <GlassCard>
            <h2 className="text-2xl font-bold">Queue jobs</h2>
            <div className="mt-5 space-y-3">
              {(data?.queueJobs || []).map((job) => (
                <div key={job._id} className="rounded-3xl bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{job.type}</p>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">{job.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/68">Attempts {job.attempts} | Created {new Date(job.createdAt).toLocaleString()}</p>
                  {job.lastError ? <p className="mt-2 text-sm text-coral">{job.lastError}</p> : null}
                  {job.result?.trainedArtifacts?.length ? <p className="mt-2 text-sm text-white/55">Artifacts: {job.result.trainedArtifacts.map((artifact) => `${artifact.name} v${artifact.version}`).join(" | ")}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {job.status === "FAILED" ? (
                      retryingId === job._id ? <Loader label="Retrying queue job..." /> : <button className="rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:border-cyan/30 hover:text-cyan" onClick={() => retryJob(job._id)} disabled={!isApproved}>Retry job</button>
                    ) : null}
                    {replayingId === job._id ? <Loader label="Replaying queue job..." /> : <button className="rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:border-sand/30 hover:text-sand" onClick={() => replayJob(job._id)} disabled={!isApproved}>Replay job</button>}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="text-2xl font-bold">Model artifacts and audit activity</h2>
            <div className="mt-5 space-y-3">
              {(data?.artifacts || []).map((artifact) => (
                <div key={artifact._id} className="rounded-3xl bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <Activity className="text-cyan" size={18} />
                    <div>
                      <p className="font-semibold">{artifact.name}</p>
                      <p className="text-sm text-white/60">Version {artifact.version} | {artifact.metadata?.status || "UNKNOWN"}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-white/68">{artifact.metadata?.notes || "No notes available"}</p>
                  <p className="mt-2 text-sm text-white/55">Window {artifact.metadata?.trainingWindow || "N/A"} | Sample {artifact.metadata?.sampleSize || 0}</p>
                </div>
              ))}
              {(data?.auditLogs || []).slice(0, 4).map((entry) => (
                <div key={entry._id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <p className="font-semibold">{entry.method} {entry.route}</p>
                  <p className="mt-2 text-sm text-white/60">Status {entry.statusCode} | Actor {entry.actorEmail || entry.actorRole}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>
    </AppShell>
  );
}
