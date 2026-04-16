import test from "node:test";
import assert from "node:assert/strict";
import { calculatePolicyPrice } from "./pricingMath.js";

test("calculatePolicyPrice uses base, risk, multiplier, and discount", () => {
  const result = calculatePolicyPrice({
    base: 200,
    riskScore: 50,
    riskMultiplier: 1.2,
    discount: 20
  });

  assert.deepEqual(result, {
    base: 200,
    risk: 66,
    discount: 20,
    total: 246
  });
});

test("calculatePolicyPrice enforces minimum total price", () => {
  const result = calculatePolicyPrice({
    base: 10,
    riskScore: 0,
    riskMultiplier: 1,
    discount: 100
  });

  assert.equal(result.total, 99);
});
