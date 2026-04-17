import { AlertCircle, CheckCircle2, AlertTriangle, Loader as LoaderIcon } from "lucide-react";
import { GlassCard } from "./GlassCard";

export function PreTriggerFraudDialog({ 
  claim, 
  onConfirm, 
  onCancel, 
  loading = false,
  hasLocation = false 
}) {
  if (!hasLocation) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
        <GlassCard className="max-w-md w-full border-orange-500/30">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-white">Location Required</h3>
              <p className="text-sm text-white/70 mt-1">Please capture your live location before triggering a claim.</p>
            </div>
          </div>
          
          <button
            onClick={onCancel}
            className="w-full mt-6 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg font-semibold transition"
          >
            Go Back & Capture Location
          </button>
        </GlassCard>
      </div>
    );
  }

  const fraudScore = claim?.fraud?.score || 0;
  const aiScore = claim?.aiRisk?.score || 0;
  const anomalyVerdict = claim?.anomaly?.verdict || "UNKNOWN";
  const fraudFlags = claim?.fraud?.flags || [];
  const anomalyReasons = claim?.anomaly?.reasons || [];

  const isFraudRisk = fraudScore >= 60;
  const isAnomalousRisk = aiScore >= 60;
  const isHighRisk = isFraudRisk || isAnomalousRisk;

  const riskLevel = (() => {
    if (fraudScore >= 80 || aiScore >= 80) return { label: "CRITICAL", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" };
    if (fraudScore >= 60 || aiScore >= 60) return { label: "HIGH", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" };
    if (fraudScore >= 40 || aiScore >= 40) return { label: "MEDIUM", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" };
    return { label: "LOW", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" };
  })();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto py-12">
      <GlassCard className={`max-w-2xl w-full ${riskLevel.bg} border-2 ${riskLevel.border}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-3">
            {isHighRisk ? (
              <AlertCircle className={`w-6 h-6 ${riskLevel.color} flex-shrink-0 mt-0.5`} />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">Pre-Trigger Risk Analysis</h2>
              <p className="text-sm text-white/60 mt-1">Review your claim risk profile before submission</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${riskLevel.bg} ${riskLevel.color}`}>
            {riskLevel.label} RISK
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Fraud Score */}
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm text-white/60 uppercase tracking-wider">Fraud Score</p>
            <p className={`text-3xl font-bold mt-2 ${fraudScore >= 60 ? "text-red-400" : "text-green-400"}`}>
              {fraudScore}%
            </p>
            <p className="text-xs text-white/50 mt-1">
              {fraudScore >= 80 ? "Critical fraud indicators" : fraudScore >= 60 ? "High fraud risk" : fraudScore >= 40 ? "Moderate indicators" : "Low fraud risk"}
            </p>
          </div>

          {/* AI Risk Score */}
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm text-white/60 uppercase tracking-wider">AI Risk Score</p>
            <p className={`text-3xl font-bold mt-2 ${aiScore >= 60 ? "text-red-400" : "text-green-400"}`}>
              {aiScore}%
            </p>
            <p className="text-xs text-white/50 mt-1">
              Anomaly: <span className="font-semibold">{anomalyVerdict}</span>
            </p>
          </div>
        </div>

        {/* Fraud Flags */}
        {fraudFlags.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm font-semibold text-red-300 mb-3">🚩 Fraud Flags Detected:</p>
            <ul className="space-y-1">
              {fraudFlags.map((flag, idx) => (
                <li key={idx} className="text-sm text-red-200/80 flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Anomaly Reasons */}
        {anomalyReasons.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm font-semibold text-yellow-300 mb-3">⚠️ Anomaly Detection Reasons:</p>
            <ul className="space-y-1">
              {anomalyReasons.map((reason, idx) => (
                <li key={idx} className="text-sm text-yellow-200/80 flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Risk Explanation */}
        {claim?.aiRisk?.explanation && (
          <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm font-semibold text-blue-300 mb-2">📊 AI Risk Analysis:</p>
            <p className="text-sm text-blue-200/80">{claim.aiRisk.explanation}</p>
          </div>
        )}

        {/* Location & Telemetry Info */}
        {claim?.disruptionData && (
          <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm font-semibold text-white/80 mb-3">📍 Captured Telemetry:</p>
            <div className="grid grid-cols-2 gap-3 text-xs text-white/60">
              <div>
                <p className="text-white/40">Location</p>
                <p className="text-white/80">
                  {claim.disruptionData.coordinates?.latitude?.toFixed(4)}, {claim.disruptionData.coordinates?.longitude?.toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-white/40">Weather</p>
                <p className="text-white/80">{claim.disruptionData.aqi || "--"} AQI • {claim.disruptionData.rainfall || 0}mm rain</p>
              </div>
            </div>
          </div>
        )}

        {/* Decision Info */}
        {claim?.decisionReason && (
          <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm font-semibold text-white/80 mb-2">📋 Decision Reason:</p>
            <p className="text-sm text-white/70">{claim.decisionReason}</p>
          </div>
        )}

        {/* Warning for High Risk */}
        {isHighRisk && (
          <div className="mb-6 p-4 rounded-lg bg-orange-500/15 border border-orange-500/30">
            <p className="text-sm text-orange-300">
              ⚠️ <strong>High risk detected</strong> - If you proceed, your claim will go to <strong>manual review</strong> where an adjuster will evaluate it. Fraudulent claims may result in account suspension.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              isHighRisk
                ? "bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
                : "bg-mint hover:bg-mint/90 text-slate-950 disabled:opacity-50"
            }`}
          >
            {loading ? (
              <>
                <LoaderIcon className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                {isHighRisk ? "⚠️ Proceed to Review" : "✓ Trigger Claim"}
              </>
            )}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
