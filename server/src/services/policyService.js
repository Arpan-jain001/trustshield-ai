import { generateRiskAssessment } from "./aiService.js";
import { getDisruptionSignals } from "./triggerService.js";
import { calculatePolicyPrice } from "../utils/pricingMath.js";

export async function computePolicyPricing(user, claimCount = 0, product = null) {
  const locationRiskMap = {
    delhi: 80,
    mumbai: 68,
    noida: 58,
    gurugram: 52,
    lucknow: 74,
    bangalore: 42
  };

  const disruptionSignals = await getDisruptionSignals(user.location);
  const locationRisk = locationRiskMap[user.location.toLowerCase()] || 55;
  const environmentalRisk = Math.min(100, Math.round(disruptionSignals.rainfall * 0.55 + disruptionSignals.aqi * 0.18 + (disruptionSignals.curfew ? 18 : 0)));
  const payload = {
    workerType: user.customWorkType || user.workType,
    weatherRisk: environmentalRisk,
    locationRisk,
    pastClaimsRisk: Math.min(90, claimCount * 20),
    behaviorRisk: user.status === "ACTIVE" ? 22 : 42,
    networkRisk: Math.min(95, Math.round(disruptionSignals.aqi / 3.2)),
    deviceRisk: user.deviceFingerprint ? 28 : 45,
    clusterRisk: claimCount >= 3 ? 52 : disruptionSignals.curfew ? 46 : 30
  };

  const risk = await generateRiskAssessment(payload);
  const pricingBreakdown = calculatePolicyPrice({
    base: Number(product?.weeklyBasePremium) || 149,
    riskScore: risk.score,
    riskMultiplier: Number(product?.riskMultiplier) || 1,
    discount: claimCount === 0 ? 25 : 0
  });
  const coverageHours = Math.max(12, Number(product?.coverageHours) || 24) + Math.round(risk.score / 5);

  return {
    risk,
    pricingBreakdown,
    coverageHours,
    disruptionSignals
  };
}
