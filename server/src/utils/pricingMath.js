export function calculatePolicyPrice({ base = 149, riskScore = 0, riskMultiplier = 1, discount = 0 } = {}) {
  const normalizedBase = Math.max(99, Number(base) || 149);
  const normalizedRisk = Math.max(0, Math.min(100, Number(riskScore) || 0));
  const normalizedMultiplier = Math.max(0.5, Number(riskMultiplier) || 1);
  const normalizedDiscount = Math.max(0, Number(discount) || 0);
  const riskCharge = Math.round((normalizedRisk / 100) * 110 * normalizedMultiplier);
  const total = Math.max(99, normalizedBase + riskCharge - normalizedDiscount);

  return {
    base: normalizedBase,
    risk: riskCharge,
    discount: normalizedDiscount,
    total
  };
}
