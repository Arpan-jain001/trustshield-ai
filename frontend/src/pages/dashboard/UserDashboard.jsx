import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Activity,
  CloudRain,
  Fingerprint,
  MapPinned,
  Network,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Siren,
  TimerReset,
  Waypoints
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { AppShell } from "../../layouts/AppShell";
import { GlassCard } from "../../components/GlassCard";
import { ChatbotPanel } from "../../components/ChatbotPanel";
import { Loader } from "../../components/Loader";
import { withMinimumDelay } from "../../utils/withMinimumDelay";
import { AccountStatusGate } from "../../components/AccountStatusGate";
import { AnimatedNoticeDialog } from "../../components/AnimatedNoticeDialog";
import { PreTriggerFraudDialog } from "../../components/PreTriggerFraudDialog";

function Metric({ label, value, tone = "text-white", hint }) {
  return (
    <GlassCard>
      <p className="text-sm uppercase tracking-[0.25em] text-white/50">{label}</p>
      <p className={`mt-3 text-3xl font-bold ${tone}`}>{value}</p>
      {hint ? <p className="mt-2 text-sm text-white/55">{hint}</p> : null}
    </GlassCard>
  );
}

const claimStatusColors = {
  APPROVED: "#76e4f7",
  REJECTED: "#ff9478",
  NEEDS_REVIEW: "#ffd7a8"
};

const scenarioPresets = {
  trusted: { networkLatencyMs: 85, speedKph: 22, sensorMotion: "NORMAL_MOTION", trafficContext: "NORMAL_FLOW" },
  disruption: { networkLatencyMs: 165, speedKph: 12, sensorMotion: "LOW_MOTION", trafficContext: "DISRUPTED" },
  spoof: { networkLatencyMs: 345, speedKph: 84, sensorMotion: "LOW_MOTION", trafficContext: "FAST_MOVING" },
  cluster: { networkLatencyMs: 280, speedKph: 66, sensorMotion: "NORMAL_MOTION", trafficContext: "DISRUPTED" }
};

const statusContent = {
  PENDING_VERIFICATION: {
    title: "Email verification complete, admin review pending",
    detail: "Your account is in trust review. Read-only dashboard access is available until approval is complete.",
    tone: "text-sand"
  },
  REJECTED: {
    title: "Account verification was not approved",
    detail: "Support can help you update details and request a fresh admin review.",
    tone: "text-coral"
  },
  SUSPENDED: {
    title: "Account temporarily suspended",
    detail: "Policy and claim actions are paused until admin reactivation.",
    tone: "text-coral"
  },
  BANNED: {
    title: "Account restricted",
    detail: "This account is blocked due to governance policy. Contact support for escalation.",
    tone: "text-coral"
  }
};

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function getDecisionBand(score) {
  if (score >= 70) return { label: "High risk", action: "Manual review", tone: "text-coral" };
  if (score >= 40) return { label: "Medium risk", action: "Soft verification", tone: "text-sand" };
  return { label: "Low risk", action: "Instant payout", tone: "text-mint" };
}

export default function UserDashboard() {
  const { token, user, setUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [signalForm, setSignalForm] = useState(scenarioPresets.trusted);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [signalLoading, setSignalLoading] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);
  const [liveContext, setLiveContext] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [liveCoordinates, setLiveCoordinates] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [paymentLoadingClaimId, setPaymentLoadingClaimId] = useState("");
  const [policyPromptOpen, setPolicyPromptOpen] = useState(false);
  const [claimNotice, setClaimNotice] = useState(null);
  const [preTriggerClaim, setPreTriggerClaim] = useState(null);
  const [showPreTriggerDialog, setShowPreTriggerDialog] = useState(false);
  const [lockTick, setLockTick] = useState(Date.now());

  useEffect(() => {
    if (!claimNotice?.lockUntil) {
      return undefined;
    }

    setLockTick(Date.now());
    const timer = window.setInterval(() => setLockTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [claimNotice?.lockUntil]);

  const claimLockCountdown = useMemo(() => {
    if (!claimNotice?.lockUntil) {
      return null;
    }

    const lockUntil = new Date(claimNotice.lockUntil).getTime();
    const remainingMs = Math.max(0, lockUntil - lockTick);
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      remainingMs,
      label: `${hours > 0 ? `${hours}h ` : ""}${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`,
      expired: remainingMs <= 0
    };
  }, [claimNotice?.lockUntil, lockTick]);

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const profileData = await api("/user/profile", { token });
      const claimsData =
        profileData.user?.status === "ACTIVE"
          ? await api("/claim/history", { token })
          : { claims: profileData.claims || [] };
      const paymentData =
        profileData.user?.status === "ACTIVE"
          ? await api("/claim/payment/config", { token }).catch(() => null)
          : null;
      setProfile({ ...profileData, claims: claimsData.claims || [] });
      setPaymentConfig(paymentData);
      setSelectedProductId((current) => current || profileData.availableProducts?.find((product) => product.isDefault)?._id || profileData.availableProducts?.[0]?._id || "");
      setUser(profileData.user);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  async function loadLiveContext(coordsOverride) {
    const coords = coordsOverride || liveCoordinates;
    if (!token || !coords?.latitude || !coords?.longitude) return;
    setLocationLoading(true);
    try {
      const data = await withMinimumDelay(api("/user/live-context", { method: "POST", token, body: coords }), 1200);
      setLiveContext(data);
    } catch (err) {
      setError(err.message || "Unable to load live location context");
    } finally {
      setLocationLoading(false);
    }
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6))
        };
        setLiveCoordinates(coords);
        loadLiveContext(coords);
      },
      () => {
        setLocationLoading(false);
        setError("Unable to capture live device location");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function createOrRenewPolicy() {
    if (!isApproved) {
      setError("Admin approval is required before policy activation.");
      return;
    }
    navigate("/policies", { state: { autoOpenPurchase: true } });
  }

  async function triggerClaim() {
    if (!isApproved) {
      setError("Admin approval is required before claim actions.");
      return;
    }

    // Check if location is captured
    if (!liveCoordinates) {
      setShowPreTriggerDialog(true);
      setPreTriggerClaim(null);
      setError("Location capture required");
      return;
    }

    if (!hasActivePolicy) {
      const policyMessage = "First, you need to buy your policy before triggering a claim.";
      setPolicyPromptOpen(true);
      setError(policyMessage);
      return;
    }

    setTriggerLoading(true);
    setError("");
    setMessage("");
    
    try {
      const signalPayload = {
        networkLatencyMs: signalForm.networkLatencyMs,
        speedKph: signalForm.speedKph,
        sensorMotion: signalForm.sensorMotion,
        trafficContext: signalForm.trafficContext,
        ...(liveCoordinates ? { gpsCoordinates: liveCoordinates } : {})
      };
      
      // Pre-trigger call to get fraud analysis without creating claim
      const preAnalysisData = await api("/claim/pre-trigger-analysis", { 
        method: "POST", 
        token, 
        body: { signalPayload } 
      });
      
      // Show pre-trigger dialog with fraud analysis
      setPreTriggerClaim(preAnalysisData);
      setShowPreTriggerDialog(true);
      setTriggerLoading(false);
    } catch (err) {
      // If pre-analysis fails, show error but don't block - might not have endpoint
      console.error("Pre-analysis error (non-blocking):", err);
      // Proceed directly to claim creation
      confirmClaimTrigger();
    }
  }

  async function confirmClaimTrigger() {
    if (!hasActivePolicy) {
      const policyMessage = "First, you need to buy your policy before triggering a claim.";
      setPolicyPromptOpen(true);
      setError(policyMessage);
      return;
    }

    setTriggerLoading(true);
    setError("");
    setMessage("");
    
    try {
      const signalPayload = {
        networkLatencyMs: signalForm.networkLatencyMs,
        speedKph: signalForm.speedKph,
        sensorMotion: signalForm.sensorMotion,
        trafficContext: signalForm.trafficContext,
        ...(liveCoordinates ? { gpsCoordinates: liveCoordinates } : {})
      };
      const data = await withMinimumDelay(api("/claim/create", { method: "POST", token, body: { signalPayload } }));
      const payoutText = data.claim?.payout?.transactionId
        ? ` Txn ${data.claim.payout.transactionId} settled in ${data.claim.payout.processingSeconds || 0}s.`
        : "";
      setMessage(`Claim submitted with ${data.claim.decision} status.${payoutText}`);
      setClaimNotice({
        title: "Claim submitted successfully",
        description: `${data.claim.decisionReason || "Your claim moved through the trust pipeline."} Decision: ${data.claim.decision}. ${payoutText || "The system will keep the claim visible in your dashboard."}`.trim()
      });
      setShowPreTriggerDialog(false);
      await load();
      if (liveCoordinates) {
        await loadLiveContext(liveCoordinates);
      }
    } catch (err) {
      if ((err.message || "").toLowerCase().includes("no active policy")) {
        setPolicyPromptOpen(true);
      }
      if (err.code === "CLAIM_LOCKED_WINDOW" || err.httpStatus === 429) {
        const lockUntil = err.lockUntil || new Date(Date.now() + (Number(err.remainingMinutes) || 300) * 60 * 1000).toISOString();
        const remainingMinutes = Number(err.remainingMinutes) || 300;
        const hours = Math.floor(remainingMinutes / 60);
        const minutes = remainingMinutes % 60;
        setClaimNotice({
          title: "Claim trigger locked",
          description: `Kindly wait for ${hours > 0 ? `${hours} hour${hours > 1 ? "s" : ""}` : ""}${hours > 0 && minutes > 0 ? " and " : ""}${minutes > 0 ? `${minutes} minute${minutes > 1 ? "s" : ""}` : ""} before triggering this same disruption again. The system keeps one trigger active per disruption window to prevent duplicate claims.`.trim(),
          lockUntil
        });
        setShowPreTriggerDialog(false);
        setError("");
      } else {
        setError(err.message);
      }
    } finally {
      setTriggerLoading(false);
    }
  }

  async function ingestSignals() {
    if (!isApproved) {
      setError("Admin approval is required before signal ingestion.");
      return;
    }
    setSignalLoading(true);
    setError("");
    setMessage("");
    try {
      const body = { ...signalForm, ...(liveCoordinates ? { gpsCoordinates: liveCoordinates } : {}) };
      const data = await withMinimumDelay(api("/user/signals/ingest", { method: "POST", token, body }));
      setMessage(`Signal ingestion completed. Integrity ${data.signalFusion.integrityScore}, anomaly ${data.anomaly.verdict}.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSignalLoading(false);
    }
  }

  async function enqueueSignals() {
    if (!isApproved) {
      setError("Admin approval is required before queueing stream events.");
      return;
    }
    setQueueLoading(true);
    setError("");
    setMessage("");
    try {
      const body = { ...signalForm, ...(liveCoordinates ? { gpsCoordinates: liveCoordinates } : {}) };
      const data = await withMinimumDelay(api("/user/signals/queue", { method: "POST", token, body }), 800);
      setMessage(`${data.message}. Job ${data.job?._id || "created"} is now waiting for stream processing.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setQueueLoading(false);
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

  async function openRazorpayCheckout(claim) {
    if (!token || !claim?._id) return;

    if (!paymentConfig?.razorpay?.enabled || !paymentConfig?.razorpay?.keyId) {
      setError("Razorpay checkout is not enabled. Configure payment keys and gateway first.");
      return;
    }

    if (!claim?.payout?.orderId) {
      setError("No Razorpay order found for this claim payout.");
      return;
    }

    setError("");
    setMessage("");
    setPaymentLoadingClaimId(claim._id);

    const scriptReady = await loadRazorpayScript();
    if (!scriptReady || !window.Razorpay) {
      setPaymentLoadingClaimId("");
      setError("Razorpay SDK failed to load. Check network and try again.");
      return;
    }

    const options = {
      key: paymentConfig.razorpay.keyId,
      amount: Math.round((claim.payout?.total || 0) * 100),
      currency: claim.payout?.currency || "INR",
      name: "TrustShield AI",
      description: `Claim payout for ${claim.triggerType}`,
      order_id: claim.payout.orderId,
      prefill: {
        name: profile?.user?.name || user?.name || "Worker",
        email: profile?.user?.email || user?.email || ""
      },
      notes: {
        claimId: claim._id
      },
      theme: {
        color: "#22d3ee"
      },
      handler: async (response) => {
        try {
          const verifyResponse = await api("/claim/payment/verify", {
            method: "POST",
            token,
            body: {
              claimId: claim._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }
          });
          setMessage(verifyResponse.message || "Payment verified successfully.");
          await load();
        } catch (err) {
          setError(err.message || "Payment verification failed");
        } finally {
          setPaymentLoadingClaimId("");
        }
      },
      modal: {
        ondismiss: () => {
          setPaymentLoadingClaimId("");
          setMessage("Razorpay checkout closed before payment confirmation.");
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  }

  async function requestManualReview(claimId) {
    if (!claimId) return;

    setError("");
    setMessage("");

    try {
      const response = await api("/claim/manual-review", {
        method: "POST",
        token,
        body: {
          claimId,
          reason: "Worker requested a manual review after the AI decision"
        }
      });
      setMessage(response.message || "Manual review requested successfully.");
      await load();
    } catch (err) {
      setError(err.message || "Unable to request manual review");
    }
  }

  const activePolicy = profile?.policy;
  const currentStatus = profile?.user?.status || user?.status || "PENDING_VERIFICATION";
  const isApproved = currentStatus === "ACTIVE";
  const hasActivePolicy = Boolean(activePolicy);
  const policyActionLabel = hasActivePolicy ? "Renew weekly policy" : "Buy weekly policy";
  const issuingProviderName =
    activePolicy?.provider?.organizationName ||
    activePolicy?.provider?.name ||
    activePolicy?.providerName ||
    profile?.user?.linkedProviderName ||
    "Provider not assigned";
  const latestClaim = profile?.claims?.[0];
  const latestSnapshot = profile?.featureSnapshots?.[0];
  const latestAlert = profile?.alerts?.[0];
  const latestSignal = latestClaim?.signalFusion || latestSnapshot?.derivedFeatures || {};
  const availableProducts = profile?.availableProducts || [];
  const selectedProduct = availableProducts.find((product) => product._id === selectedProductId) || availableProducts[0];
  const canUseRazorpayCheckout = Boolean(paymentConfig?.razorpay?.enabled && paymentConfig?.razorpay?.keyId);
  const activePolicyPremium = activePolicy?.weeklyPremium ?? activePolicy?.monthlyPremium ?? 0;
  const activePolicyCoverage = activePolicy?.coverageHours ?? activePolicy?.claimCoverage ?? 0;
  const activePolicyTotal = activePolicy?.pricingBreakdown?.total ?? activePolicyPremium;

  const chartData = useMemo(
    () =>
      (profile?.claims || [])
        .slice()
        .reverse()
        .map((claim, index) => ({ name: `C${index + 1}`, payout: claim.payout?.total || 0, fraud: claim.fraud?.score || 0, risk: claim.aiRisk?.score || 0 })),
    [profile]
  );

  const statusChartData = useMemo(
    () => [
      { name: "Approved", value: profile?.summary?.approvedClaims || 0, color: claimStatusColors.APPROVED },
      { name: "Rejected", value: profile?.summary?.rejectedClaims || 0, color: claimStatusColors.REJECTED },
      { name: "Review", value: profile?.summary?.reviewClaims || 0, color: claimStatusColors.NEEDS_REVIEW }
    ],
    [profile]
  );
  const pendingClaimCount = profile?.summary?.reviewClaims || 0;

  const payoutHistory = useMemo(
    () =>
      (profile?.claims || [])
        .filter((claim) => (claim.payout?.total || 0) > 0 || claim.payout?.transactionId)
        .map((claim) => ({
          id: claim._id,
          triggerType: claim.triggerType,
          amount: claim.payout?.total || 0,
          status: claim.payout?.status || "PENDING",
          gateway: claim.payout?.gateway || "SIMULATOR",
          transactionId: claim.payout?.transactionId || "N/A",
          orderId: claim.payout?.orderId || "N/A",
          seconds: claim.payout?.processingSeconds || 0,
          processedAt: claim.payout?.processedAt || claim.createdAt,
          decision: claim.decision,
          decisionReason: claim.decisionReason
        })),
    [profile]
  );

  const riskWorkbench = useMemo(() => {
    const locationRisk = clampScore(100 - (latestClaim?.signalFusion?.locationConfidence ?? latestSnapshot?.derivedFeatures?.locationConfidence ?? 72));
    const deviceRisk = clampScore(100 - (latestClaim?.signalFusion?.deviceConfidence ?? latestSnapshot?.derivedFeatures?.deviceConfidence ?? 88));
    const behaviorRisk = clampScore(latestClaim?.anomaly?.score ?? latestSnapshot?.derivedFeatures?.anomalyScore ?? 18);
    const networkRisk = clampScore(100 - (latestClaim?.signalFusion?.networkConfidence ?? latestSnapshot?.derivedFeatures?.networkConfidence ?? 74));
    const clusterRisk = clampScore(latestClaim?.fraud?.score ?? Math.min(90, (profile?.graphEdges?.length || 0) * 12));
    const composite = clampScore(locationRisk * 0.24 + deviceRisk * 0.16 + behaviorRisk * 0.22 + networkRisk * 0.18 + clusterRisk * 0.2);

    return {
      rows: [
        { label: "Location", value: locationRisk, detail: "Triangulation mismatch, GPS drift, and geofence pressure" },
        { label: "Device", value: deviceRisk, detail: "Fingerprint trust, integrity state, and hardware reuse" },
        { label: "Behavior", value: behaviorRisk, detail: "Motion consistency, anomaly score, and repeat patterns" },
        { label: "Network", value: networkRisk, detail: "Latency, IP threat score, and network anomalies" },
        { label: "Cluster", value: clusterRisk, detail: "Graph edges, shared infrastructure, and synchronized claims" }
      ],
      composite
    };
  }, [latestClaim, latestSnapshot, profile?.graphEdges?.length]);

  const decisionBand = getDecisionBand(riskWorkbench.composite);
  const getDecisionSourceLabel = (claim) => {
    const source = claim?.decisionSource || "AUTO";
    if (source === "MANUAL") return "Worker requested manual review";
    if (source === "PROVIDER_REVIEW") return `Provider final decision${claim?.review?.reviewedBy?.name ? ` by ${claim.review.reviewedBy.name}` : ""}`;
    if (source === "ADMIN_REVIEW") return `Admin final decision${claim?.review?.reviewedBy?.name ? ` by ${claim.review.reviewedBy.name}` : ""}`;
    return "AI / automatic decision";
  };

  const getLifecycleLabel = (claim) => {
    if (!claim) return "No claim created";
    if (claim.payout?.status === "SUCCESS") return "Completed payout";
    if (claim.review?.status === "PENDING" || claim.decision === "NEEDS_REVIEW") return "Waiting manual review";
    if (claim.decision === "REJECTED") return "Rejected by risk/review";
    if (claim.decision === "APPROVED") return "Approved, payout in progress";
    return "Created";
  };

  const pipelineStages = useMemo(
    () => [
      { title: "Ingestion", status: latestSnapshot ? "Active" : "Pending", detail: latestSnapshot ? `${latestSnapshot.source} snapshot captured` : "Run signal ingestion to populate the feature store" },
      { title: "Signal fusion", status: latestSignal.integrityScore >= 70 ? "Healthy" : latestSignal.integrityScore ? "Watch" : "Pending", detail: latestSignal.integrityScore ? `Integrity ${latestSignal.integrityScore} / Spoof risk ${latestSignal.spoofRisk || 0}` : "Waiting for verification signals" },
      { title: "Graph intelligence", status: (profile?.graphEdges?.length || 0) >= 3 ? "Active" : "Learning", detail: `${profile?.graphEdges?.length || 0} graph links available for cluster analysis` },
      { title: "Decision", status: latestClaim?.decision || "Pending", detail: latestClaim?.decisionReason || "Create or submit a claim to see routing output" }
    ],
    [latestSnapshot, latestSignal, profile?.graphEdges?.length, latestClaim]
  );

  const trustLayers = [
    "Multi-modal trust architecture",
    "AI-driven fraud detection",
    "Graph intelligence for coordinated attacks",
    "Real-time decision system (< 2-5 seconds)",
    "Fair and user-centric design",
    "Human-in-the-loop review",
    "Fraud prevention at scale",
    "Instant support for genuine users"
  ];

  const scenarioCards = [
    { key: "trusted", title: "Trusted rider", text: "Balanced telemetry and normal route behavior for low-friction claim handling." },
    { key: "disruption", title: "Severe weather", text: "Lower speed, disrupted traffic, and moderate latency for realistic external disruption." },
    { key: "spoof", title: "GPS spoof pressure", text: "High speed, weak motion signal, and abnormal latency to stress the anti-spoofing layer." },
    { key: "cluster", title: "Coordinated cluster", text: "Suspicious but plausible signals to test fraud-ring escalation and graph pressure." }
  ];

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan">Worker command center</p>
            <h1 className="mt-3 font-space text-4xl font-bold">{user?.name || "TrustShield AI"}</h1>
            <p className="mt-3 max-w-3xl text-white/70">
              This workspace upgrades the worker dashboard into a live resilience console with policy control, signal ingestion, claim routing, composite risk scoring, and payout-ready claim intelligence.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-cyan/30" onClick={load}>
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            Refresh dashboard
          </button>
        </div>

        {message || error ? (
          <div className={`mb-6 rounded-3xl border px-5 py-4 ${message ? "border-mint/30 bg-mint/10 text-mint" : "border-coral/30 bg-coral/10 text-coral"}`}>
            {message || error}
          </div>
        ) : null}

        {!isApproved ? (
          <GlassCard className="mb-6 bg-[linear-gradient(145deg,rgba(255,215,168,0.08),rgba(255,148,120,0.08),rgba(255,255,255,0.04))]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  <ShieldAlert size={18} className={statusContent[currentStatus]?.tone || "text-sand"} />
                  <span className="text-sm uppercase tracking-[0.24em] text-white/70">Account status</span>
                </div>
                <h2 className="mt-5 text-3xl font-bold">{statusContent[currentStatus]?.title || "Restricted access"}</h2>
                <p className="mt-4 text-lg leading-8 text-white/72">{statusContent[currentStatus]?.detail}</p>
                <p className="mt-4 text-sm text-white/55">
                  Aap dashboard open kar sakte ho, lekin policy purchase, signal ingestion, claim actions, aur full analytics admin approval ke baad hi unlock honge.
                </p>
              </div>
              <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-black/20 p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-cyan">Verification tracker</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-3xl bg-white/5 p-4">
                    <p className="font-semibold">Email verification</p>
                    <p className="mt-2 text-sm text-mint">{profile?.user?.emailVerificationVerified ? "Completed" : "Pending"}</p>
                  </div>
                  <div className="rounded-3xl bg-white/5 p-4">
                    <p className="font-semibold">Admin review</p>
                    <p className={`mt-2 text-sm ${statusContent[currentStatus]?.tone || "text-sand"}`}>{currentStatus}</p>
                  </div>
                  <div className="rounded-3xl bg-white/5 p-4">
                    <p className="font-semibold">Support path</p>
                    <p className="mt-2 text-sm text-white/65">Check your email for admin updates. You will receive a mail when admin verifies or changes your account status.</p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        ) : null}

        <AnimatedNoticeDialog
          open={policyPromptOpen}
          title="Buy your policy first"
          description="You need an active policy before you can trigger a claim. Choose a tier, complete Razorpay payment, and then claim payouts will be available."
          primaryLabel="Buy Policy Now"
          secondaryLabel="Not now"
          onPrimary={() => {
            setPolicyPromptOpen(false);
            navigate('/policies', { state: { autoOpenPurchase: true } });
          }}
          onSecondary={() => setPolicyPromptOpen(false)}
          onClose={() => setPolicyPromptOpen(false)}
        />

        <AnimatedNoticeDialog
          open={Boolean(claimNotice)}
          title={claimNotice?.title || "Claim submitted successfully"}
          description={
            claimNotice?.lockUntil
              ? `${claimNotice.description} ${claimLockCountdown ? `Live timer: ${claimLockCountdown.expired ? "Unlocked now" : claimLockCountdown.label}.` : ""}`.trim()
              : claimNotice?.description || "Your claim has been processed and is visible in the dashboard."
          }
          primaryLabel={claimNotice?.lockUntil ? (claimLockCountdown?.expired ? "Try again now" : "Understood") : "View latest claim"}
          onPrimary={() => {
            setClaimNotice(null);
            load();
          }}
          onClose={() => setClaimNotice(null)}
        />

        {showPreTriggerDialog && (
          <PreTriggerFraudDialog
            claim={preTriggerClaim}
            hasLocation={Boolean(liveCoordinates)}
            loading={triggerLoading}
            onConfirm={() => confirmClaimTrigger()}
            onCancel={() => {
              setShowPreTriggerDialog(false);
              setPreTriggerClaim(null);
            }}
          />
        )}

        <div className="mb-6 grid gap-4 lg:grid-cols-4">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(118,228,247,0.08),rgba(255,255,255,0.04))]">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan">Composite risk</p>
            <h3 className="mt-3 text-4xl font-bold">{riskWorkbench.composite}</h3>
            <p className={`mt-3 text-sm font-semibold uppercase tracking-[0.24em] ${decisionBand.tone}`}>{decisionBand.label}</p>
            <p className="mt-2 text-white/68">{decisionBand.action} based on the latest available telemetry and fraud evidence.</p>
          </GlassCard>

          <GlassCard className="bg-[linear-gradient(145deg,rgba(255,215,168,0.08),rgba(255,255,255,0.04))]">
            <p className="text-sm uppercase tracking-[0.3em] text-sand">Weekly policy</p>
            <h3 className="mt-3 text-2xl font-bold">{hasActivePolicy ? "Coverage active" : "Coverage inactive"}</h3>
            <p className="mt-3 text-white/68">
              {hasActivePolicy
                ? `Current protection expires on ${new Date(activePolicy.endsAt).toLocaleDateString()} and is issued by ${issuingProviderName}.`
                : "Activate coverage to unlock disruption-led claims and pricing intelligence through your linked insurer/provider organization."}
            </p>
            {availableProducts.length ? (
              <div className="mt-4 space-y-3">
                <select className="field" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} disabled={!isApproved}>
                  {availableProducts.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name} | INR {product.weeklyBasePremium} | {product.coverageHours} hrs
                    </option>
                  ))}
                </select>
                {selectedProduct ? (
                  <p className="text-sm text-white/60">
                    {selectedProduct.description || "Provider-issued cover"} | Max payout INR {selectedProduct.maxPayout || 0}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-sand">Your linked insurer has not published an active policy product yet.</p>
            )}
            <div className="mt-4 inline-flex rounded-full border border-sand/20 bg-sand/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-sand">
              Issuing provider: {issuingProviderName}
            </div>
            <div className="mt-5">
              {policyLoading ? (
                <Loader label="Processing weekly policy..." />
              ) : (
                <button
                  className={`rounded-full px-5 py-3 font-semibold transition ${isApproved ? "bg-cyan text-ink hover:scale-[1.02]" : "cursor-not-allowed bg-white/10 text-white/45"}`}
                  onClick={createOrRenewPolicy}
                  disabled={!isApproved}
                >
                  {isApproved ? policyActionLabel : "Admin approval required"}
                </button>
              )}
            </div>
          </GlassCard>

          <GlassCard className="bg-[linear-gradient(145deg,rgba(181,245,200,0.08),rgba(255,255,255,0.04))]">
            <p className="text-sm uppercase tracking-[0.3em] text-mint">Latest decision</p>
            <h3 className="mt-3 text-2xl font-bold">{latestClaim?.decision || "No claim yet"}</h3>
            <p className="mt-3 text-white/68">{latestClaim?.decisionReason || "Submit a claim to see routing output here."}</p>
            {latestClaim?.payout?.status === "SUCCESS" || latestClaim?.payout?.status === "WITHDRAWN" ? (
              <div className="mt-4 space-y-2 rounded-3xl border border-mint/25 bg-mint/10 p-4 text-sm text-mint">
                <p className="font-semibold">INR {latestClaim?.payout?.total || 0} credited</p>
                <p>Txn {latestClaim?.payout?.transactionId || "N/A"} via {latestClaim?.payout?.gateway || "SIMULATOR"}</p>
                <p>{latestClaim?.payout?.processingSeconds || 0}s payout {latestClaim?.payout?.processingSeconds <= 30 ? "(< 30s)" : ""}</p>
              </div>
            ) : null}
            {latestClaim?.payout?.status === "PENDING" ? (
              <div className="mt-4 rounded-3xl border border-sand/25 bg-sand/10 p-4 text-sm text-sand">
                <p className="font-semibold">Payout settlement is being processed</p>
                <p className="mt-1">The insurer-approved payout is queued from provider liquidity to your account. No worker payment action is required.</p>
              </div>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm">{profile?.summary?.totalClaims || 0} claims</span>
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm">INR {profile?.summary?.totalPayout || 0} payout</span>
            </div>
          </GlassCard>

          <GlassCard className="bg-[linear-gradient(145deg,rgba(255,148,120,0.08),rgba(255,255,255,0.04))]">
            <p className="text-sm uppercase tracking-[0.3em] text-coral">Graph pressure</p>
            <h3 className="mt-3 text-2xl font-bold">{profile?.graphEdges?.length || 0} links</h3>
            <p className="mt-3 text-white/68">Shared device, IP, location-cluster, and claim-cluster edges feed the fraud-ring defense layer.</p>
            <div className="mt-5 rounded-3xl bg-white/5 p-4 text-sm text-white/70">Linked accounts: {latestClaim?.fraud?.linkedAccounts || 0} | Cluster risk: {riskWorkbench.rows[4].value}</div>
          </GlassCard>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <Link className="rounded-full bg-cyan px-5 py-3 font-semibold text-ink transition hover:scale-[1.02]" to="/policies">
            Open policy center
          </Link>
          <Link className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-cyan/30" to="/notifications">
            View notifications
          </Link>
          <Link className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-cyan/30" to="/feedback">
            Send feedback
          </Link>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(118,228,247,0.06),rgba(255,215,168,0.05))]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-sand" />
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-sand">Policy issuer and access control</p>
                <h3 className="mt-1 text-2xl font-bold">Your worker account is attached to one insurer/provider organization</h3>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-white/50">Selected provider</p>
                <p className="mt-3 text-2xl font-bold text-cyan">{profile?.user?.linkedProviderName || "Not linked yet"}</p>
                <p className="mt-3 text-sm leading-7 text-white/68">
                  Signup ke time jo insurer/provider choose kiya gaya tha, wahi organization aapki weekly policy issue karti hai aur wahi portfolio dashboard me aapka policy and claim data dekh sakti hai.
                </p>
              </div>
              <div className="rounded-3xl bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-white/50">Visibility boundary</p>
                <p className="mt-3 text-lg font-semibold text-mint">Only your linked provider and admin can access this worker record.</p>
                <p className="mt-3 text-sm leading-7 text-white/68">
                  Dusre insurers aapka dashboard, policy history, claim trail, ya fraud telemetry nahi dekh sakte. Yeh data isolation provider-linked ownership ke through enforce hota hai.
                </p>
              </div>
              <div className="rounded-3xl bg-white/5 p-5 md:col-span-2">
                <p className="text-sm uppercase tracking-[0.2em] text-white/50">Latest admin update</p>
                <p className="mt-3 text-lg font-semibold text-sand">{latestAlert?.title || "No recent notification"}</p>
                <p className="mt-2 text-sm leading-7 text-white/68">{latestAlert?.message || "Policy and claim alerts from admin or your provider appear here automatically."}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="bg-[linear-gradient(145deg,rgba(118,228,247,0.1),rgba(255,255,255,0.04))]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-cyan" />
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-cyan">Risk workbench</p>
                <h3 className="mt-1 text-2xl font-bold">Location + Device + Behavior + Network + Cluster Risk</h3>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              {riskWorkbench.rows.map((item) => (
                <div key={item.label} className="rounded-3xl bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{item.label}</p>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/70">{item.value}</span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-white/65">{item.detail}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <p className="text-sm uppercase tracking-[0.25em] text-sand">Decision pipeline</p>
            <h3 className="mt-3 text-2xl font-bold">How the latest worker state moves through the system</h3>
            <div className="mt-6 space-y-3">
              {pipelineStages.map((stage) => (
                <div key={stage.title} className="rounded-3xl bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{stage.title}</p>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">{stage.status}</span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-white/65">{stage.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-3xl border border-cyan/20 bg-cyan/10 p-4">
              <p className="text-sm uppercase tracking-[0.22em] text-cyan">Routing guidance</p>
              <p className="mt-2 text-white/80">
                Current band: <span className={`font-semibold ${decisionBand.tone}`}>{decisionBand.label}</span>. Recommended action: {decisionBand.action}.
              </p>
            </div>
          </GlassCard>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(118,228,247,0.1),rgba(255,255,255,0.04))]">
            <div className="flex items-center gap-3">
              <MapPinned className="text-cyan" />
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-cyan">Location</p>
                <h3 className="mt-1 text-2xl font-bold">Capture live coordinates from the device</h3>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/5 p-4">
                <p className="text-sm text-white/50">Latitude</p>
                <p className="mt-2 text-2xl font-bold">{liveContext?.location?.latitude ?? "--"}</p>
              </div>
              <div className="rounded-3xl bg-white/5 p-4">
                <p className="text-sm text-white/50">Longitude</p>
                <p className="mt-2 text-2xl font-bold">{liveContext?.location?.longitude ?? "--"}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-white/68">
              {liveContext?.location ? "Live location captured successfully for downstream claim context." : "Capture location to unlock live weather and stronger claim evidence."}
            </p>
            <div className="mt-5">
              {locationLoading ? (
                <Loader label="Capturing live location..." />
              ) : (
                <button
                  className={`rounded-full px-5 py-3 font-semibold transition ${isApproved ? "bg-cyan text-ink hover:scale-[1.02]" : "cursor-not-allowed bg-white/10 text-white/45"}`}
                  onClick={captureLocation}
                  disabled={!isApproved}
                >
                  {isApproved ? "Capture live location" : "Unlock after admin approval"}
                </button>
              )}
            </div>
          </GlassCard>

          <GlassCard className="bg-[linear-gradient(145deg,rgba(255,215,168,0.1),rgba(255,255,255,0.04))]">
            <div className="flex items-center gap-3">
              <CloudRain className="text-sand" />
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-sand">Disruption context</p>
                <h3 className="mt-1 text-2xl font-bold">Environmental signals around the worker</h3>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/5 p-4">
                <p className="text-sm text-white/50">Temperature</p>
                <p className="mt-2 text-2xl font-bold">{liveContext?.weather?.temperatureC?.toFixed?.(1) ?? "--"} C</p>
              </div>
              <div className="rounded-3xl bg-white/5 p-4">
                <p className="text-sm text-white/50">Condition</p>
                <p className="mt-2 text-2xl font-bold">{liveContext?.weather?.condition || "--"}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-white/68">
              Rain {liveContext?.disruption?.rainfall ?? "--"} | AQI {liveContext?.disruption?.aqi ?? "--"} | Curfew {liveContext?.disruption?.curfew ? "Yes" : "No"}
            </p>
            <p className="mt-2 text-sm text-white/55">{liveContext?.disruption?.source ? `Source ${liveContext.disruption.source}` : "Environmental details load after location capture."}</p>
          </GlassCard>

          <GlassCard className="bg-[linear-gradient(145deg,rgba(181,245,200,0.1),rgba(255,255,255,0.04))]">
            <div className="flex items-center gap-3">
              <Siren className="text-mint" />
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-mint">Claim engine</p>
                <h3 className="mt-1 text-2xl font-bold">Push a full claim through the trust pipeline</h3>
              </div>
            </div>
            <p className="mt-5 text-white/68">Use the current telemetry profile to test whether the system approves, verifies, or holds the claim.</p>
            <div className="mt-5">
              {triggerLoading ? (
                <Loader label="Submitting claim..." />
              ) : (
                <button
                  className={`rounded-full border px-5 py-3 font-semibold transition ${isApproved ? "border-white/15 text-white hover:border-cyan/30 hover:text-cyan" : "cursor-not-allowed border-white/10 text-white/40"}`}
                  onClick={triggerClaim}
                  disabled={!isApproved}
                >
                  {isApproved ? "Trigger claim" : "Admin approval required"}
                </button>
              )}
            </div>
            <div className="mt-5 rounded-3xl bg-white/5 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-white/50">Latest decision reason</p>
              <p className="mt-2 text-sm leading-7 text-white/68">{liveContext?.latestDecision?.reason || latestClaim?.decisionReason || "Latest decision details will appear here after claim submission."}</p>
            </div>
            {latestClaim ? (
              <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                <p className="uppercase tracking-[0.22em] text-white/50">Decision source</p>
                <p className="mt-2 font-semibold text-white">{getDecisionSourceLabel(latestClaim)}</p>
                {latestClaim.review?.requestedAt ? <p className="mt-2 text-white/55">Manual review requested at {new Date(latestClaim.review.requestedAt).toLocaleString()}</p> : null}
                {latestClaim.review?.reviewedBy?.name ? <p className="mt-1 text-white/55">Final reviewer: {latestClaim.review.reviewedBy.name}</p> : null}
              </div>
            ) : null}
            {latestClaim?.decisionSource === "AUTO" && latestClaim?.review?.status === "NOT_REQUIRED" ? (
              <button
                className="mt-4 rounded-full border border-coral/25 px-4 py-2 text-sm font-semibold text-coral transition hover:bg-coral/10"
                onClick={() => requestManualReview(latestClaim._id)}
              >
                Request manual review
              </button>
            ) : null}
          </GlassCard>
        </div>

        <div className="mb-6">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(255,148,120,0.08),rgba(255,255,255,0.04))]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-coral">Live claim inputs</p>
                <h3 className="mt-3 text-2xl font-bold">Model normal, disrupted, spoofed, or coordinated worker telemetry</h3>
                <p className="mt-3 max-w-3xl text-white/68">
                  These presets let you exercise the ingestion and claim pipeline without changing backend contracts. Pick a scenario, then ingest signals, queue the stream event, or trigger a full claim.
                </p>
              </div>
              {signalLoading || queueLoading ? <Loader label={signalLoading ? "Ingesting live signals..." : "Queueing stream event..."} /> : null}
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-4">
              {scenarioCards.map((scenario) => (
                <button
                  key={scenario.key}
                  className={`rounded-3xl border p-4 text-left transition ${
                    signalForm.networkLatencyMs === scenarioPresets[scenario.key].networkLatencyMs && signalForm.speedKph === scenarioPresets[scenario.key].speedKph
                      ? "border-cyan/30 bg-cyan/10"
                      : "border-white/10 bg-white/5 hover:border-cyan/20"
                  }`}
                  onClick={() => setSignalForm(scenarioPresets[scenario.key])}
                >
                  <p className="font-semibold">{scenario.title}</p>
                  <p className="mt-2 text-sm leading-7 text-white/65">{scenario.text}</p>
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <input className="field" type="number" placeholder="Latency ms" value={signalForm.networkLatencyMs} onChange={(e) => setSignalForm((current) => ({ ...current, networkLatencyMs: Number(e.target.value) }))} />
              <input className="field" type="number" placeholder="Speed kph" value={signalForm.speedKph} onChange={(e) => setSignalForm((current) => ({ ...current, speedKph: Number(e.target.value) }))} />
              <select className="field" value={signalForm.sensorMotion} onChange={(e) => setSignalForm((current) => ({ ...current, sensorMotion: e.target.value }))}>
                <option value="LOW_MOTION">Low motion</option>
                <option value="NORMAL_MOTION">Normal motion</option>
                <option value="HIGH_MOTION">High motion</option>
              </select>
              <select className="field" value={signalForm.trafficContext} onChange={(e) => setSignalForm((current) => ({ ...current, trafficContext: e.target.value }))}>
                <option value="NORMAL_FLOW">Normal flow</option>
                <option value="DISRUPTED">Disrupted</option>
                <option value="FAST_MOVING">Fast moving</option>
              </select>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className={`rounded-full border px-5 py-3 font-semibold transition ${isApproved ? "border-white/15 text-white hover:border-cyan/30 hover:text-cyan" : "cursor-not-allowed border-white/10 text-white/40"}`}
                onClick={ingestSignals}
                disabled={!isApproved}
              >
                Ingest worker signals
              </button>
              <button
                className={`rounded-full border px-5 py-3 font-semibold transition ${isApproved ? "border-white/15 text-white hover:border-cyan/30 hover:text-cyan" : "cursor-not-allowed border-white/10 text-white/40"}`}
                onClick={enqueueSignals}
                disabled={!isApproved}
              >
                Queue stream event
              </button>
              <button
                className={`rounded-full px-5 py-3 font-semibold transition ${isApproved ? "bg-cyan text-ink hover:scale-[1.02]" : "cursor-not-allowed bg-white/10 text-white/45"}`}
                onClick={triggerClaim}
                disabled={!isApproved}
              >
                {isApproved ? "Run full claim path" : "Admin approval required"}
              </button>
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/70">{profile?.alerts?.length || 0} alerts</span>
            </div>
          </GlassCard>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Account status" value={profile?.user?.status || user?.status || "-"} tone={user?.status === "ACTIVE" ? "text-mint" : "text-sand"} hint="Controlled by verification workflow" />
          <Metric label="AI risk score" value={profile?.user?.riskProfile?.score ?? latestClaim?.aiRisk?.score ?? 0} tone="text-cyan" hint="Dynamic risk profile for worker trust" />
          <Metric label="Weekly premium" value={`INR ${activePolicyPremium}`} tone="text-sand" hint="Fetched from active policy record" />
          <Metric label="Signal integrity" value={latestSignal.integrityScore ?? 0} tone="text-mint" hint="Latest signal-fusion confidence score" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(118,228,247,0.08),rgba(255,255,255,0.04))]">
            <p className="text-sm uppercase tracking-[0.32em] text-cyan">TrustShield platform strengths</p>
            <h2 className="mt-3 text-3xl font-bold">Adversarial resilience translated into worker-facing visibility</h2>
            <p className="mt-4 text-white/70">
              This dashboard now exposes the same product story described in the architecture: layered verification, fraud-aware decisions, graph intelligence, and a fairness layer that protects genuine users from harsh automated denial.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {trustLayers.map((item) => (
                <div key={item} className="rounded-3xl bg-white/5 p-4 text-sm text-white/78">
                  {item}
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <p className="text-sm uppercase tracking-[0.32em] text-sand">Anti-spoof telemetry</p>
            <h2 className="mt-3 text-3xl font-bold">Latest verification signals and fraud pressure</h2>
            <div className="mt-6 space-y-3">
              <div className="rounded-3xl bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <Fingerprint size={18} className="text-cyan" />
                  <p className="font-semibold">Spoof risk</p>
                </div>
                <p className="mt-2 text-sm text-white/70">{latestClaim?.signalFusion?.spoofRisk ?? latestSnapshot?.derivedFeatures?.spoofRisk ?? 0}</p>
              </div>
              <div className="rounded-3xl bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <Network size={18} className="text-sand" />
                  <p className="font-semibold">IP threat score</p>
                </div>
                <p className="mt-2 text-sm text-white/70">{latestClaim?.signalFusion?.details?.ipThreatScore ?? 0}</p>
              </div>
              <div className="rounded-3xl bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <Activity size={18} className="text-mint" />
                  <p className="font-semibold">Anomaly verdict</p>
                </div>
                <p className="mt-2 text-sm text-white/70">{latestClaim?.anomaly?.verdict || latestSnapshot?.derivedFeatures?.anomalyVerdict || "N/A"}</p>
              </div>
              <div className="rounded-3xl bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <Waypoints size={18} className="text-coral" />
                  <p className="font-semibold">Traffic context</p>
                </div>
                <p className="mt-2 text-sm text-white/70">{latestClaim?.signalFusion?.details?.trafficContext || latestSnapshot?.rawSignals?.trafficContext || "N/A"}</p>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <GlassCard>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Policy and claim intelligence</h2>
                <p className="mt-2 text-white/60">Live API-backed policy lifecycle, claim telemetry, and payout movement.</p>
              </div>
              <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/65">{profile?.summary?.totalClaims || 0} claims tracked</div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-white/5 p-5">
                <p className="text-sm text-white/50">Current pricing breakdown</p>
                <p className="mt-4">Base: INR {activePolicy?.pricingBreakdown?.base ?? activePolicyPremium ?? 0}</p>
                <p>Risk: INR {activePolicy?.pricingBreakdown?.risk ?? activePolicy?.riskScore ?? 0}</p>
                <p>Discount: INR {activePolicy?.pricingBreakdown?.discount ?? 0}</p>
                <p className="mt-2 font-bold">Total: INR {activePolicyTotal}</p>
                <p className="mt-3 text-sm text-white/55">
                  Coverage: {activePolicyCoverage} | Ends: {activePolicy?.endsAt ? new Date(activePolicy.endsAt).toLocaleString() : "No active policy"}
                </p>
                <p className="mt-2 text-sm text-white/60">Issued by: {issuingProviderName}</p>
                {activePolicy?.riskInputs ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-white/55">
                      Signals: Rain {activePolicy.riskInputs.rainfall || 0} | AQI {activePolicy.riskInputs.aqi || 0} | Curfew {activePolicy.riskInputs.curfew ? "Yes" : "No"}
                    </p>
                    <div className="inline-flex rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-cyan">
                      Provider source: {activePolicy.riskInputs.source || "N/A"}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl bg-white/5 p-5">
                <p className="text-sm text-white/50">Risk explanation</p>
                <p className="mt-4 leading-7 text-white/80">{profile?.user?.riskProfile?.explanation || latestClaim?.aiRisk?.explanation || "Activate a weekly policy and claim flow to evaluate live risk."}</p>
              </div>
            </div>

            <div className="mt-6 h-72 rounded-[24px] bg-black/20 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="payoutGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#76e4f7" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#76e4f7" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="name" stroke="#d4e8ff" />
                  <YAxis stroke="#d4e8ff" />
                  <Tooltip />
                  <Area type="monotone" dataKey="payout" stroke="#76e4f7" fillOpacity={1} fill="url(#payoutGradient)" />
                  <Area type="monotone" dataKey="fraud" stroke="#ff9478" fillOpacity={0} />
                  <Area type="monotone" dataKey="risk" stroke="#ffd7a8" fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 space-y-3">
              {profile?.claims?.map((claim) => (
                <div key={claim._id} className="rounded-3xl border border-white/10 bg-black/20 p-4 transition hover:border-cyan/20">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{claim.triggerType} disruption</p>
                      <p className="text-sm text-white/60">{new Date(claim.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="rounded-full bg-white/10 px-4 py-2 text-sm">{claim.decision}</div>
                  </div>
                  <p className="mt-3 text-sm text-white/70">
                    Fraud score: {claim.fraud?.score} | AI risk: {claim.aiRisk?.score} | Hours lost: {claim.payout?.hoursLost || 0} | Payout: INR {claim.payout?.total}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/50">{getDecisionSourceLabel(claim)}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">Lifecycle: {getLifecycleLabel(claim)}</p>
                  {claim.review?.requestedAt ? <p className="mt-2 text-sm text-sand">Manual review requested {new Date(claim.review.requestedAt).toLocaleString()}</p> : null}
                  {claim.review?.reviewedBy?.name ? <p className="mt-1 text-sm text-white/60">Final reviewer: {claim.review.reviewedBy.name}</p> : null}
                  {claim.payout?.status === "SUCCESS" || claim.payout?.status === "WITHDRAWN" ? (
                    <p className="mt-2 text-sm text-mint">
                      Payout {claim.payout.processingSeconds || 0}s | Txn {claim.payout.transactionId || "N/A"} | {claim.payout.gateway || "SIMULATOR"}
                    </p>
                  ) : null}
                  {claim.payout?.status === "PENDING" ? (
                    <p className="mt-3 rounded-2xl border border-sand/20 bg-sand/10 px-4 py-2 text-sm text-sand">
                      Settlement queued from insurer liquidity. This is an automatic insurance payout, not a worker payment action.
                    </p>
                  ) : null}
                  {claim?.decisionSource === "AUTO" && claim?.review?.status === "NOT_REQUIRED" ? (
                    <div className="mt-3">
                      <button
                        className="rounded-full border border-coral/25 px-4 py-2 text-sm font-semibold text-coral transition hover:bg-coral/10"
                        onClick={() => requestManualReview(claim._id)}
                      >
                        Escalate to manual review
                      </button>
                    </div>
                  ) : null}
                  <p className="mt-2 text-sm text-white/60">
                    Integrity: {claim.signalFusion?.integrityScore ?? 0} | Spoof risk: {claim.signalFusion?.spoofRisk ?? 0} | Anomaly: {claim.anomaly?.verdict || "N/A"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em]">
                    <span className="rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1 text-cyan">Provider: {claim.provider?.organizationName || claim.provider?.name || claim.providerName || issuingProviderName}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-white/65">Data source: {claim.disruptionData?.source || "N/A"}</span>
                    <span className="rounded-full border border-coral/20 bg-coral/10 px-3 py-1 text-coral">IP threat: {claim.signalFusion?.details?.ipThreatScore ?? 0}</span>
                    <span className="rounded-full border border-sand/20 bg-sand/10 px-3 py-1 text-sand">IP city: {claim.signalFusion?.details?.ipCity || "Unknown"}</span>
                  </div>
                  {claim.signalFusion?.flags?.length ? <p className="mt-2 text-sm text-white/50">Security flags: {claim.signalFusion.flags.join(", ")}</p> : null}
                  <p className="mt-2 text-sm text-white/55">{claim.decisionReason}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="space-y-6">
            <GlassCard>
              <h2 className="text-2xl font-bold">Claim outcome distribution</h2>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-sand">Pending claims: {pendingClaimCount}</p>
              <div className="mt-5 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusChartData} dataKey="value" nameKey="name" outerRadius={86}>
                      {statusChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard>
              <h2 className="text-2xl font-bold">Policy history</h2>
              <div className="mt-5 space-y-3">
                {profile?.policyHistory?.map((policy) => (
                  <div key={policy._id} className="rounded-3xl bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">INR {policy.weeklyPremium}</p>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">{policy.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-white/60">
                      {new Date(policy.startsAt).toLocaleDateString()} to {new Date(policy.endsAt).toLocaleDateString()} | Coverage {policy.coverageHours} hrs
                    </p>
                    <p className="mt-2 text-sm text-white/55">Product: {policy.product?.name || policy.productName || "Provider weekly cover"}</p>
                    <p className="mt-2 text-sm text-white/55">Issued by {policy.provider?.organizationName || policy.provider?.name || policy.providerName || profile?.user?.linkedProviderName || "Assigned provider"}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="bg-[linear-gradient(145deg,rgba(181,245,200,0.08),rgba(255,255,255,0.04))]">
              <h2 className="text-2xl font-bold">Payout history</h2>
                <p className="mt-2 text-sm text-white/60">Worker settlement trail with transaction metadata for audit proof.</p>
              <div className="mt-5 space-y-3">
                {payoutHistory.length ? (
                  payoutHistory.map((item) => (
                    <div key={item.id} className="rounded-3xl bg-white/5 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold">{item.triggerType} | INR {item.amount}</p>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">{item.status}</span>
                      </div>
                      <p className="mt-2 text-sm text-mint">Txn {item.transactionId} | {item.gateway} | {item.seconds}s</p>
                      {item.status === "PENDING" ? (
                        <p className="mt-3 rounded-2xl border border-sand/20 bg-sand/10 px-4 py-2 text-sm text-sand">
                          Settlement queued from insurer liquidity. No further worker action is required.
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm text-white/60">Processed {new Date(item.processedAt).toLocaleString()} | Decision {item.decision}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">Lifecycle: {getLifecycleLabel((profile?.claims || []).find((entry) => entry._id === item.id))}</p>
                      <p className="mt-2 text-sm text-white/50">{item.decisionReason}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl bg-white/5 p-4 text-sm text-white/60">No payout has been settled yet. Approved claims will appear here with transaction details.</div>
                )}
              </div>
            </GlassCard>

            <GlassCard>
              <h2 className="text-2xl font-bold">Predictive alerts</h2>
              <div className="mt-5 space-y-3">
                {profile?.alerts?.map((alert) => (
                  <div key={alert._id} className="rounded-3xl bg-white/5 p-4">
                    <p className="font-semibold">{alert.title}</p>
                    <p className="mt-2 text-sm leading-7 text-white/70">{alert.message}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <ChatbotPanel />

            <GlassCard>
              <h2 className="text-2xl font-bold">Feature snapshots</h2>
              <div className="mt-5 space-y-3">
                {profile?.featureSnapshots?.map((snapshot) => (
                  <div key={snapshot._id} className="rounded-3xl bg-white/5 p-4">
                    <p className="font-semibold">{snapshot.source}</p>
                    <p className="mt-2 text-sm text-white/70">
                      Integrity {snapshot.derivedFeatures?.integrityScore} | Spoof risk {snapshot.derivedFeatures?.spoofRisk} | Anomaly {snapshot.derivedFeatures?.anomalyVerdict}
                    </p>
                    <p className="mt-2 text-sm text-white/50">
                      Traffic {snapshot.rawSignals?.trafficContext || "N/A"} | Location {snapshot.rawSignals?.location || "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <h2 className="text-2xl font-bold">Graph links</h2>
              <div className="mt-5 space-y-3">
                {profile?.graphEdges?.map((edge) => (
                  <div key={edge._id} className="rounded-3xl bg-white/5 p-4">
                    <p className="font-semibold">{edge.edgeType}</p>
                    <p className="mt-2 text-sm text-white/70">{edge.value}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="bg-[linear-gradient(145deg,rgba(181,245,200,0.08),rgba(255,255,255,0.04))]">
              <div className="flex items-center gap-3">
                <TimerReset className="text-mint" />
                <div>
                  <h2 className="text-2xl font-bold">Feedback loop</h2>
                  <p className="mt-2 text-sm text-white/65">Alerts, snapshots, graph links, and review outcomes improve the next decision cycle.</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
