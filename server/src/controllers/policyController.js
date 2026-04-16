import { Claim } from "../models/Claim.js";
import { Policy } from "../models/Policy.js";
import { ProviderPolicyProduct } from "../models/ProviderPolicyProduct.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { computePolicyPricing } from "../services/policyService.js";

export const createPolicy = asyncHandler(async (req, res) => {
  if (!req.user.linkedProvider) {
    return res.status(400).json({ message: "No insurer/provider organization is linked to this worker account" });
  }

  let selectedProduct = null;
  if (req.body?.productId) {
    selectedProduct = await ProviderPolicyProduct.findOne({
      _id: req.body.productId,
      provider: req.user.linkedProvider,
      status: "ACTIVE"
    });
    if (!selectedProduct) {
      return res.status(404).json({ message: "Selected provider policy product is not available" });
    }
  } else {
    selectedProduct = await ProviderPolicyProduct.findOne({
      provider: req.user.linkedProvider,
      status: "ACTIVE",
      isDefault: true
    }).sort({ createdAt: -1 });

    if (!selectedProduct) {
      selectedProduct = await ProviderPolicyProduct.findOne({
        provider: req.user.linkedProvider,
        status: "ACTIVE"
      }).sort({ createdAt: -1 });
    }
  }

  const claimCount = await Claim.countDocuments({ user: req.user._id });
  const result = await computePolicyPricing(req.user, claimCount, selectedProduct);
  const existingActivePolicy = await Policy.findOne({ user: req.user._id, status: "ACTIVE" }).sort({ createdAt: -1 });

  await Policy.updateMany({ user: req.user._id, status: "ACTIVE" }, { status: "EXPIRED" });

  const policy = await Policy.create({
    user: req.user._id,
    provider: req.user.linkedProvider,
    product: selectedProduct?._id,
    productName: selectedProduct?.name || "Provider weekly cover",
    providerName: req.user.linkedProviderName || "Assigned insurer",
    weeklyPremium: result.pricingBreakdown.total,
    coverageHours: result.coverageHours,
    maxPayout: selectedProduct?.maxPayout || 3000,
    riskScore: result.risk.score,
    pricingBreakdown: result.pricingBreakdown,
    aiExplanation: result.risk.explanation,
    riskInputs: {
      rainfall: result.disruptionSignals?.rainfall,
      aqi: result.disruptionSignals?.aqi,
      curfew: result.disruptionSignals?.curfew,
      source: result.disruptionSignals?.source
    },
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  req.user.riskProfile = {
    score: result.risk.score,
    explanation: result.risk.explanation,
    updatedAt: new Date()
  };
  await req.user.save();

  res.status(201).json({
    message: existingActivePolicy ? "Weekly policy renewed successfully" : "Weekly policy activated successfully",
    action: existingActivePolicy ? "RENEWED" : "CREATED",
    policy
  });
});

export const getUserPolicy = asyncHandler(async (req, res) => {
  const policy = await Policy.findOne({ user: req.user._id, status: "ACTIVE" })
    .populate("provider", "name organizationName")
    .populate("product", "name description coverageHours maxPayout")
    .sort({ createdAt: -1 });
  res.json({ policy });
});
