import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BrainCircuit, Building2, RefreshCcw, Save, ShieldCheck, Wallet } from "lucide-react";
import { AppShell } from "../../layouts/AppShell";
import { GlassCard } from "../../components/GlassCard";
import { Loader } from "../../components/Loader";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { AccountStatusGate } from "../../components/AccountStatusGate";

const colors = ["#76e4f7", "#ffd7a8", "#ff9478"];

const defaultProductForm = {
  name: "",
  description: "",
  weeklyBasePremium: 149,
  coverageHours: 24,
  riskMultiplier: 1,
  maxPayout: 3000,
  eligibilityTags: "",
  isDefault: true
};

export default function InsurerDashboard() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [profileForm, setProfileForm] = useState({
    underwritingMode: "BALANCED",
    reservePool: 250000,
    maxPayoutPerClaim: 3000,
    autoApprovalThreshold: 35,
    reviewThreshold: 70,
    targetLossRatio: 58,
    focusRegions: "",
    notes: ""
  });
  const [productForm, setProductForm] = useState(defaultProductForm);
  const [liquidityForm, setLiquidityForm] = useState({ entryType: "ADD", amount: 25000, note: "" });
  const [simulationForm, setSimulationForm] = useState({
    location: "Delhi",
    claimCount: 1,
    hourlyRate: 120,
    productId: ""
  });
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [adjustingLiquidity, setAdjustingLiquidity] = useState(false);
  const [toppingUpLiquidity, setToppingUpLiquidity] = useState(false);
  const [reviewingClaimId, setReviewingClaimId] = useState("");
  const [escalatingClaimId, setEscalatingClaimId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const response = await api("/provider/dashboard", { token });
      setData(response);
      setProfileForm({
        underwritingMode: response.providerProfile?.underwritingMode || "BALANCED",
        reservePool: response.providerProfile?.reservePool || 250000,
        maxPayoutPerClaim: response.providerProfile?.maxPayoutPerClaim || 3000,
        autoApprovalThreshold: response.providerProfile?.autoApprovalThreshold || 35,
        reviewThreshold: response.providerProfile?.reviewThreshold || 70,
        targetLossRatio: response.providerProfile?.targetLossRatio || 58,
        focusRegions: (response.providerProfile?.focusRegions || []).join(", "),
        notes: response.providerProfile?.notes || ""
      });
      setSimulationForm((current) => ({
        ...current,
        productId: current.productId || response.products?.find((product) => product.isDefault)?._id || response.products?.[0]?._id || ""
      }));
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load provider dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  const currentUser = user;
  const isApproved = currentUser?.status === "ACTIVE";

  async function saveProfile() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await api("/provider/profile", {
        method: "PUT",
        token,
        body: {
          ...profileForm,
          focusRegions: profileForm.focusRegions.split(",").map((item) => item.trim()).filter(Boolean)
        }
      });
      setMessage(response.message);
      await load();
    } catch (err) {
      setError(err.message || "Unable to update provider profile");
    } finally {
      setSaving(false);
    }
  }

  async function runSimulation() {
    setSimulating(true);
    setMessage("");
    setError("");
    try {
      const response = await api("/provider/simulate-pricing", {
        method: "POST",
        token,
        body: simulationForm
      });
      setSimulation(response.simulation);
      setMessage(response.message);
    } catch (err) {
      setError(err.message || "Unable to run pricing simulation");
    } finally {
      setSimulating(false);
    }
  }

  async function loadRazorpayScript() {
    if (window.Razorpay) return true;

    const existing = document.getElementById("razorpay-checkout-script");
    if (existing) {
      return new Promise((resolve) => {
        existing.addEventListener("load", () => resolve(true), { once: true });
        existing.addEventListener("error", () => resolve(false), { once: true });
      });
    }

    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.id = "razorpay-checkout-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function createProduct() {
    setCreatingProduct(true);
    setMessage("");
    setError("");
    try {
      const response = await api("/provider/products", {
        method: "POST",
        token,
        body: {
          ...productForm,
          eligibilityTags: productForm.eligibilityTags.split(",").map((item) => item.trim()).filter(Boolean)
        }
      });
      setMessage(response.message);
      setProductForm(defaultProductForm);
      await load();
    } catch (err) {
      setError(err.message || "Unable to create provider product");
    } finally {
      setCreatingProduct(false);
    }
  }

  async function toggleProduct(product, status) {
    setMessage("");
    setError("");
    try {
      const response = await api(`/provider/products/${product._id}`, {
        method: "PUT",
        token,
        body: { status, isDefault: status === "ACTIVE" ? true : product.isDefault }
      });
      setMessage(response.message);
      await load();
    } catch (err) {
      setError(err.message || "Unable to update provider product");
    }
  }

  async function adjustLiquidity() {
    if (liquidityForm.entryType === "ADD") {
      setToppingUpLiquidity(true);
      setMessage("");
      setError("");
      try {
        const orderResponse = await api("/provider/liquidity/top-up", {
          method: "POST",
          token,
          body: {
            amount: liquidityForm.amount,
            note: liquidityForm.note || "Provider reserve top-up"
          }
        });

        const scriptReady = await loadRazorpayScript();
        if (!scriptReady || !orderResponse.enabled || !orderResponse.keyId || !window.Razorpay) {
          throw new Error("Razorpay checkout is not available for provider top-up");
        }

        const handler = async (response) => {
          try {
            const verifyResponse = await api("/provider/liquidity/top-up/verify", {
              method: "POST",
              token,
              body: {
                amount: liquidityForm.amount,
                note: liquidityForm.note,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }
            });
            setMessage(verifyResponse.message || "Provider reserve topped up successfully.");
            setLiquidityForm((current) => ({ ...current, note: "" }));
            await load();
          } catch (err) {
            setError(err.message || "Unable to verify provider top-up");
          } finally {
            setToppingUpLiquidity(false);
          }
        };

        const options = {
          key: orderResponse.keyId,
          amount: Math.round(Number(liquidityForm.amount) * 100),
          currency: orderResponse.currency || "INR",
          name: "TrustShield AI",
          description: "Provider reserve top-up",
          order_id: orderResponse.orderId,
          handler,
          theme: { color: "#22d3ee" },
          modal: {
            ondismiss: () => setToppingUpLiquidity(false)
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } catch (err) {
        setError(err.message || "Unable to start Razorpay top-up");
        setToppingUpLiquidity(false);
      }
      return;
    }

    setAdjustingLiquidity(true);
    setMessage("");
    setError("");
    try {
      const response = await api("/provider/liquidity", {
        method: "POST",
        token,
        body: liquidityForm
      });
      setMessage(response.message);
      setLiquidityForm((current) => ({ ...current, note: "" }));
      await load();
    } catch (err) {
      setError(err.message || "Unable to adjust liquidity");
    } finally {
      setAdjustingLiquidity(false);
    }
  }

  async function reviewClaim(claimId, decision) {
    setReviewingClaimId(claimId);
    setMessage("");
    setError("");
    try {
      const response = await api("/provider/claims/review", {
        method: "POST",
        token,
        body: {
          claimId,
          decision,
          notes: decision === "APPROVED" ? "Approved by provider operations review" : "Rejected by provider operations review"
        }
      });
      setMessage(response.message);
      await load();
    } catch (err) {
      setError(err.message || "Unable to review provider claim");
    } finally {
      setReviewingClaimId("");
    }
  }

  async function escalateClaim(claimId) {
    setEscalatingClaimId(claimId);
    setMessage("");
    setError("");
    try {
      const response = await api("/provider/claims/escalate", {
        method: "POST",
        token,
        body: {
          claimId,
          notes: "Provider escalated this claim for admin review"
        }
      });
      setMessage(response.message);
      await load();
    } catch (err) {
      setError(err.message || "Unable to escalate claim to admin review");
    } finally {
      setEscalatingClaimId("");
    }
  }

  const mixData = useMemo(
    () => [
      { name: "Approved", value: data?.portfolio?.claimMix?.approved || 0 },
      { name: "Review", value: data?.portfolio?.claimMix?.review || 0 },
      { name: "Rejected", value: data?.portfolio?.claimMix?.rejected || 0 }
    ],
    [data]
  );

  const trendData = useMemo(
    () =>
      (data?.claims || []).slice().reverse().map((claim, index) => ({
        name: `C${index + 1}`,
        payout: claim.payout?.total || 0,
        risk: claim.aiRisk?.score || 0
      })),
    [data]
  );

  const workforce = data?.workers || [];
  const products = data?.products || [];
  const pendingClaims = (data?.claims || []).filter((claim) => claim.decision === "NEEDS_REVIEW");
  const settledPayouts = (data?.claims || [])
    .filter((claim) => (claim.payout?.total || 0) > 0 || claim.payout?.transactionId)
    .slice(0, 8);
  const premiumCredits = (data?.reserveEntries || []).filter((entry) => entry.entryType === "ADD");
  const payoutSettlements = (data?.reserveEntries || []).filter((entry) => entry.entryType === "PAYOUT_SETTLED");
  const activeWorkers = workforce.filter((worker) => worker.status === "ACTIVE").length;
  const pendingWorkers = workforce.filter((worker) => worker.status === "PENDING_VERIFICATION").length;
  const formatDecisionSource = (claim) => {
    const source = claim?.decisionSource || "AUTO";
    if (source === "ADMIN_REVIEW") {
      return `Admin review${claim?.review?.reviewedBy?.name ? ` by ${claim.review.reviewedBy.name}` : ""}`;
    }
    if (source === "PROVIDER_REVIEW") {
      return `Provider review${claim?.review?.reviewedBy?.name ? ` by ${claim.review.reviewedBy.name}` : ""}`;
    }
    if (source === "MANUAL") {
      return `Manual request${claim?.review?.requestedBy?.name ? ` by ${claim.review.requestedBy.name}` : ""}`;
    }
    return "Automatic decision";
  };

  const getLifecycleLabel = (claim) => {
    if (!claim) return "No claim";
    if (claim.payout?.status === "WITHDRAWN") return "Approved and withdrawn";
    if (claim.payout?.status === "SUCCESS") return "Completed payout";
    if (claim.review?.status === "PENDING" || claim.decision === "NEEDS_REVIEW") return "Waiting manual review";
    if (claim.decision === "REJECTED") return "Rejected";
    if (claim.decision === "APPROVED") return claim.payout?.status === "PENDING" ? "Approved - settlement queued" : "Approved and settled";
    return "Created";
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan">Insurer / Provider dashboard</p>
            <h1 className="mt-3 font-space text-4xl font-bold">{currentUser?.organizationName || currentUser?.name || "Provider Control Room"}</h1>
            <p className="mt-3 max-w-3xl text-white/70">
              Manage underwriting rules, publish worker-facing policy products, review only your organization&apos;s claims, and operate liquidity with provider-scoped visibility.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-cyan/30" onClick={load}>
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            Refresh provider view
          </button>
        </div>

        {message || error ? (
          <div className={`mb-6 rounded-3xl border px-5 py-4 ${message ? "border-mint/30 bg-mint/10 text-mint" : "border-coral/30 bg-coral/10 text-coral"}`}>
            {message || error}
          </div>
        ) : null}

        <AccountStatusGate
          user={currentUser}
          label="Provider approval"
          supportText="This dashboard is visible before approval, but provider underwriting and review actions stay locked until admin activation."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <GlassCard><p className="text-sm uppercase tracking-[0.24em] text-white/50">Policies tracked</p><p className="mt-3 text-3xl font-bold text-cyan">{data?.portfolio?.totalPolicies || 0}</p></GlassCard>
          <GlassCard><p className="text-sm uppercase tracking-[0.24em] text-white/50">Active policies</p><p className="mt-3 text-3xl font-bold text-mint">{data?.portfolio?.activePolicies || 0}</p></GlassCard>
          <GlassCard><p className="text-sm uppercase tracking-[0.24em] text-white/50">Open reviews</p><p className="mt-3 text-3xl font-bold text-sand">{data?.portfolio?.openReviewClaims || 0}</p></GlassCard>
          <GlassCard><p className="text-sm uppercase tracking-[0.24em] text-white/50">Premium inflow</p><p className="mt-3 text-3xl font-bold text-white">INR {data?.portfolio?.totalPremium || 0}</p></GlassCard>
          <GlassCard><p className="text-sm uppercase tracking-[0.24em] text-white/50">Available liquidity</p><p className="mt-3 text-3xl font-bold text-mint">INR {data?.providerProfile?.availableLiquidity || 0}</p></GlassCard>
          <GlassCard><p className="text-sm uppercase tracking-[0.24em] text-white/50">Published products</p><p className="mt-3 text-3xl font-bold text-coral">{products.length}</p><p className="mt-2 text-sm text-white/60">{activeWorkers} active workers | {pendingWorkers} pending</p></GlassCard>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(118,228,247,0.08),rgba(255,255,255,0.04))]">
            <p className="text-sm uppercase tracking-[0.24em] text-cyan">Loss ratio</p>
            <p className="mt-3 text-3xl font-bold text-cyan">{data?.portfolio?.lossRatio || 0}%</p>
            <p className="mt-2 text-sm text-white/65">Total payout / total premium</p>
          </GlassCard>
          <GlassCard className="bg-[linear-gradient(145deg,rgba(255,215,168,0.08),rgba(255,255,255,0.04))]">
            <p className="text-sm uppercase tracking-[0.24em] text-sand">Next week risk</p>
            <p className="mt-3 text-3xl font-bold text-sand">{data?.intelligence?.nextWeekRisk?.band || "N/A"}</p>
            <p className="mt-2 text-sm text-white/65">{data?.intelligence?.nextWeekRisk?.forecast || "Forecast data not available"}</p>
          </GlassCard>
          <GlassCard className="bg-[linear-gradient(145deg,rgba(181,245,200,0.08),rgba(255,255,255,0.04))]">
            <p className="text-sm uppercase tracking-[0.24em] text-mint">Instant payout SLA</p>
            <p className="mt-3 text-3xl font-bold text-mint">{data?.intelligence?.payout?.avgProcessingSeconds || 0}s</p>
            <p className="mt-2 text-sm text-white/65">{data?.intelligence?.payout?.underThirtySecondsRate || 0}% settled under 30s</p>
          </GlassCard>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(118,228,247,0.08),rgba(255,255,255,0.04))]">
            <div className="flex items-center gap-3">
              <Building2 className="text-cyan" />
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan">Underwriting profile</p>
                <h2 className="mt-2 text-3xl font-bold">Rule lifecycle and reserve posture</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <select className="field" value={profileForm.underwritingMode} onChange={(e) => setProfileForm((current) => ({ ...current, underwritingMode: e.target.value }))}>
                <option value="BALANCED">Balanced</option>
                <option value="GROWTH">Growth</option>
                <option value="DEFENSIVE">Defensive</option>
              </select>
              <input className="field" type="number" placeholder="Reserve pool" value={profileForm.reservePool} onChange={(e) => setProfileForm((current) => ({ ...current, reservePool: Number(e.target.value) }))} />
              <input className="field" type="number" placeholder="Max payout per claim" value={profileForm.maxPayoutPerClaim} onChange={(e) => setProfileForm((current) => ({ ...current, maxPayoutPerClaim: Number(e.target.value) }))} />
              <input className="field" type="number" placeholder="Auto approval threshold" value={profileForm.autoApprovalThreshold} onChange={(e) => setProfileForm((current) => ({ ...current, autoApprovalThreshold: Number(e.target.value) }))} />
              <input className="field" type="number" placeholder="Review threshold" value={profileForm.reviewThreshold} onChange={(e) => setProfileForm((current) => ({ ...current, reviewThreshold: Number(e.target.value) }))} />
              <input className="field" type="number" placeholder="Target loss ratio" value={profileForm.targetLossRatio} onChange={(e) => setProfileForm((current) => ({ ...current, targetLossRatio: Number(e.target.value) }))} />
              <input className="field md:col-span-2" placeholder="Focus regions, comma separated" value={profileForm.focusRegions} onChange={(e) => setProfileForm((current) => ({ ...current, focusRegions: e.target.value }))} />
              <textarea className="field min-h-28 md:col-span-2" placeholder="Provider notes" value={profileForm.notes} onChange={(e) => setProfileForm((current) => ({ ...current, notes: e.target.value }))} />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {saving ? <Loader label="Saving provider profile..." /> : <button className="inline-flex items-center gap-2 rounded-full bg-cyan px-5 py-3 font-semibold text-ink transition hover:scale-[1.02]" onClick={saveProfile} disabled={!isApproved}><Save size={16} />Save rule version</button>}
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/70">Rule v{data?.providerProfile?.activeRuleVersion || 1}</span>
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/70">Locked INR {data?.providerProfile?.lockedLiquidity || 0}</span>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-3">
              <BrainCircuit className="text-sand" />
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-sand">Pricing studio</p>
                <h2 className="mt-2 text-3xl font-bold">Preview provider pricing</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-4">
              <input className="field" placeholder="Location" value={simulationForm.location} onChange={(e) => setSimulationForm((current) => ({ ...current, location: e.target.value }))} />
              <select className="field" value={simulationForm.productId} onChange={(e) => setSimulationForm((current) => ({ ...current, productId: e.target.value }))}>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>{product.name}</option>
                ))}
              </select>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="field" type="number" placeholder="Claim count" value={simulationForm.claimCount} onChange={(e) => setSimulationForm((current) => ({ ...current, claimCount: Number(e.target.value) }))} />
                <input className="field" type="number" placeholder="Hourly rate" value={simulationForm.hourlyRate} onChange={(e) => setSimulationForm((current) => ({ ...current, hourlyRate: Number(e.target.value) }))} />
              </div>
              {simulating ? <Loader label="Calculating pricing..." /> : <button className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-cyan/30 hover:text-cyan" onClick={runSimulation} disabled={!isApproved}>Preview pricing</button>}
            </div>
            {simulation ? (
              <div className="mt-5 rounded-3xl bg-white/5 p-4">
                <p className="font-semibold">{simulation.product?.name || "Provider pricing preview"} for {simulation.location}</p>
                <p className="mt-2 text-sm text-white/68">Premium INR {simulation.pricingBreakdown.total} | Coverage {simulation.coverageHours} hrs | Risk {simulation.risk.score}</p>
                <p className="mt-2 text-sm text-white/60">{simulation.risk.explanation}</p>
              </div>
            ) : null}
          </GlassCard>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <GlassCard>
            <h2 className="text-2xl font-bold">Claim decision mix</h2>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-sand">Pending claims: {pendingClaims.length}</p>
            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={mixData} dataKey="value" nameKey="name" outerRadius={90}>
                    {mixData.map((entry, index) => (
                      <Cell key={entry.name} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="text-2xl font-bold">Payout and risk trend</h2>
            <div className="mt-5 h-72 rounded-[24px] bg-black/20 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="name" stroke="#d4e8ff" />
                  <YAxis stroke="#d4e8ff" />
                  <Tooltip />
                  <Area type="monotone" dataKey="payout" stroke="#76e4f7" fill="rgba(118,228,247,0.24)" />
                  <Area type="monotone" dataKey="risk" stroke="#ffd7a8" fill="rgba(255,215,168,0.14)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <GlassCard>
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-mint" />
              <div>
                <h2 className="text-2xl font-bold">Policy product catalog</h2>
                <p className="mt-2 text-sm text-white/60">Workers linked to this provider can buy only the active products published here.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input className="field" placeholder="Product name" value={productForm.name} onChange={(e) => setProductForm((current) => ({ ...current, name: e.target.value }))} />
              <input className="field" type="number" placeholder="Weekly base premium" value={productForm.weeklyBasePremium} onChange={(e) => setProductForm((current) => ({ ...current, weeklyBasePremium: Number(e.target.value) }))} />
              <input className="field" type="number" placeholder="Coverage hours" value={productForm.coverageHours} onChange={(e) => setProductForm((current) => ({ ...current, coverageHours: Number(e.target.value) }))} />
              <input className="field" type="number" step="0.1" placeholder="Risk multiplier" value={productForm.riskMultiplier} onChange={(e) => setProductForm((current) => ({ ...current, riskMultiplier: Number(e.target.value) }))} />
              <input className="field" type="number" placeholder="Max payout" value={productForm.maxPayout} onChange={(e) => setProductForm((current) => ({ ...current, maxPayout: Number(e.target.value) }))} />
              <input className="field" placeholder="Eligibility tags" value={productForm.eligibilityTags} onChange={(e) => setProductForm((current) => ({ ...current, eligibilityTags: e.target.value }))} />
              <textarea className="field min-h-24 md:col-span-2" placeholder="Product description" value={productForm.description} onChange={(e) => setProductForm((current) => ({ ...current, description: e.target.value }))} />
            </div>
            <div className="mt-5">
              {creatingProduct ? <Loader label="Publishing product..." /> : <button className="rounded-full bg-cyan px-5 py-3 font-semibold text-ink transition hover:scale-[1.02]" onClick={createProduct} disabled={!isApproved}>Publish provider product</button>}
            </div>
            <div className="mt-6 space-y-3">
              {products.map((product) => (
                <div key={product._id} className="rounded-3xl bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-white/60">{product.description || "No description provided"}</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">{product.status}{product.isDefault ? " | default" : ""}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/68">Premium INR {product.weeklyBasePremium} | Coverage {product.coverageHours} hrs | Max payout INR {product.maxPayout}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.status !== "ACTIVE" ? <button className="rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:border-cyan/30 hover:text-cyan" onClick={() => toggleProduct(product, "ACTIVE")} disabled={!isApproved}>Activate</button> : null}
                    {product.status === "ACTIVE" ? <button className="rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:border-sand/30 hover:text-sand" onClick={() => toggleProduct(product, "PAUSED")} disabled={!isApproved}>Pause</button> : null}
                    {product.status !== "RETIRED" ? <button className="rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:border-coral/30 hover:text-coral" onClick={() => toggleProduct(product, "RETIRED")} disabled={!isApproved}>Retire</button> : null}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-3">
              <Wallet className="text-sand" />
              <div>
                <h2 className="text-2xl font-bold">Liquidity desk</h2>
                <p className="mt-2 text-sm text-white/60">Track reserve pool, available cash, and payout impact for this provider.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl bg-white/5 p-4"><p className="text-sm text-white/50">Reserve pool</p><p className="mt-3 text-3xl font-bold text-white">INR {data?.providerProfile?.reservePool || 0}</p></div>
              <div className="rounded-3xl bg-white/5 p-4"><p className="text-sm text-white/50">Available</p><p className="mt-3 text-3xl font-bold text-mint">INR {data?.providerProfile?.availableLiquidity || 0}</p></div>
              <div className="rounded-3xl bg-white/5 p-4"><p className="text-sm text-white/50">Locked</p><p className="mt-3 text-3xl font-bold text-sand">INR {data?.providerProfile?.lockedLiquidity || 0}</p></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em]">
              <span className="rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1 text-cyan">Premium credits: {premiumCredits.length}</span>
              <span className="rounded-full border border-coral/20 bg-coral/10 px-3 py-1 text-coral">Payout settlements: {payoutSettlements.length}</span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-[0.8fr_1fr_1.2fr]">
              <select className="field" value={liquidityForm.entryType} onChange={(e) => setLiquidityForm((current) => ({ ...current, entryType: e.target.value }))}>
                <option value="ADD">Add</option>
                <option value="WITHDRAW">Withdraw</option>
              </select>
              <input className="field" type="number" placeholder="Amount" value={liquidityForm.amount} onChange={(e) => setLiquidityForm((current) => ({ ...current, amount: Number(e.target.value) }))} />
              <input className="field" placeholder="Reason" value={liquidityForm.note} onChange={(e) => setLiquidityForm((current) => ({ ...current, note: e.target.value }))} />
            </div>
            <div className="mt-5">
              {adjustingLiquidity || toppingUpLiquidity ? <Loader label={liquidityForm.entryType === "ADD" ? "Opening Razorpay top-up..." : "Updating liquidity..."} /> : <button className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-cyan/30 hover:text-cyan" onClick={adjustLiquidity} disabled={!isApproved}>Post liquidity action</button>}
            </div>
            <div className="mt-6 space-y-3">
              {(data?.reserveEntries || []).map((entry) => (
                <div key={entry._id} className="rounded-3xl bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{entry.entryType}</p>
                    <p className="text-sm text-white/60">Balance INR {entry.balanceAfter}</p>
                  </div>
                  <p className="mt-2 text-sm text-white/68">Amount INR {entry.amount} | {new Date(entry.createdAt).toLocaleString()}</p>
                  <p className="mt-2 text-sm text-white/55">{entry.note || "No note provided"}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <GlassCard>
            <h2 className="text-2xl font-bold">Pending provider reviews</h2>
            <p className="mt-2 text-sm text-white/60">Only claims issued by this provider can be decided here.</p>
            <div className="mt-5 space-y-3">
              {pendingClaims.map((claim) => (
                <div key={claim._id} className="rounded-3xl bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{claim.triggerType}</p>
                      <p className="text-sm text-white/60">{claim.user?.name || "Worker not found"}</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">{claim.decision}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/68">Payout INR {claim.payout?.total || 0} | Fraud {claim.fraud?.score || 0} | Risk {claim.aiRisk?.score || 0}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/50">Source: {formatDecisionSource(claim)}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">Payout source: {claim.payout?.payoutSource || "N/A"}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">Lifecycle: {getLifecycleLabel(claim)}</p>
                  {claim.payout?.transactionId ? (
                    <p className="mt-2 text-sm text-mint">
                      Txn {claim.payout.transactionId} | {claim.payout.gateway || "SIMULATOR"} | {claim.payout.processingSeconds || 0}s
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {reviewingClaimId === claim._id ? (
                      <Loader label="Reviewing claim..." />
                    ) : (
                      <>
                        <button className="rounded-full bg-cyan px-4 py-2 text-sm font-semibold text-ink" onClick={() => reviewClaim(claim._id, "APPROVED")} disabled={!isApproved}>Approve</button>
                        <button className="rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:border-coral/30 hover:text-coral" onClick={() => reviewClaim(claim._id, "REJECTED")} disabled={!isApproved}>Reject</button>
                        <button className="rounded-full border border-sand/30 px-4 py-2 text-sm text-sand transition hover:bg-sand/10" onClick={() => escalateClaim(claim._id)} disabled={!isApproved || escalatingClaimId === claim._id}>
                          {escalatingClaimId === claim._id ? "Escalating..." : "Escalate to admin"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {!pendingClaims.length ? <div className="rounded-3xl bg-white/5 p-4 text-sm text-white/60">No claim is waiting for provider review right now.</div> : null}
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="text-2xl font-bold">Rule history and linked workers</h2>
            <div className="mt-5 space-y-3">
              {(data?.providerProfile?.underwritingHistory || []).map((item) => (
                <div key={`${item.version}-${item.savedAt}`} className="rounded-3xl bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">Rule v{item.version}</p>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">{item.underwritingMode}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/68">Auto approve &lt; {item.autoApprovalThreshold} | Review from {item.reviewThreshold} | Max payout INR {item.maxPayoutPerClaim}</p>
                  <p className="mt-2 text-sm text-white/55">{item.notes || "No notes"}</p>
                </div>
              ))}
              {workforce.slice(0, 5).map((worker) => (
                <div key={worker._id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <p className="font-semibold">{worker.name}</p>
                  <p className="mt-2 text-sm text-white/60">{worker.email} | {worker.location || "N/A"}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="mt-6">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(181,245,200,0.08),rgba(255,255,255,0.04))]">
            <h2 className="text-2xl font-bold">Settled payout history</h2>
            <p className="mt-2 text-sm text-white/60">Provider-side payout ledger view for recent worker settlements and payment trace.</p>
            <div className="mt-5 space-y-3">
              {settledPayouts.length ? (
                settledPayouts.map((claim) => (
                  <div key={claim._id} className="rounded-3xl bg-white/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold">{claim.user?.name || "Worker"} | {claim.triggerType}</p>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">{claim.decision === "APPROVED" ? "APPROVED" : (claim.payout?.status || claim.decision)}</span>
                    </div>
                    <p className="mt-2 text-sm text-mint">INR {claim.payout?.total || 0} | Txn {claim.payout?.transactionId || "N/A"} | {claim.payout?.gateway || "SIMULATOR"}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/50">Source: {formatDecisionSource(claim)}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">Payout source: {claim.payout?.payoutSource || "N/A"}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">Lifecycle: {getLifecycleLabel(claim)}</p>
                    {claim.decision === "APPROVED" && claim.payout?.status === "PENDING" ? (
                      <p className="mt-2 rounded-2xl border border-sand/20 bg-sand/10 px-4 py-2 text-sm text-sand">
                        Settlement has been approved and is being credited from provider liquidity. No worker action is required.
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm text-white/60">Processed {claim.payout?.processedAt ? new Date(claim.payout.processedAt).toLocaleString() : "N/A"} | {claim.payout?.processingSeconds || 0}s</p>
                    <p className="mt-2 text-sm text-white/50">{claim.decisionReason || "No decision reason available"}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl bg-white/5 p-4 text-sm text-white/60">No settled payout found yet for this provider portfolio.</div>
              )}
            </div>
          </GlassCard>
        </div>
      </section>
    </AppShell>
  );
}
