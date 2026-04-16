import crypto from "crypto";
import Razorpay from "razorpay";
import { env } from "../config/env.js";

let razorpayClient = null;

function getRazorpayClient() {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    return null;
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: env.razorpayKeyId,
      key_secret: env.razorpayKeySecret
    });
  }

  return razorpayClient;
}

function pickGateway() {
  if (env.paymentGateway) {
    return env.paymentGateway;
  }
  if (env.razorpayKeyId && env.razorpayKeySecret) {
    return "RAZORPAY_TEST";
  }
  return "UPI_SIMULATOR";
}

export function getPaymentGateway() {
  return pickGateway();
}

export function getRazorpayPublicConfig() {
  return {
    enabled: pickGateway() === "RAZORPAY_TEST" && Boolean(env.razorpayKeyId && env.razorpayKeySecret),
    keyId: env.razorpayKeyId || null
  };
}

function buildTransactionId(gateway) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const prefix = gateway === "RAZORPAY_TEST" ? "RZP" : gateway === "STRIPE_SANDBOX" ? "STP" : "UPI";
  return `${prefix}-${stamp}-${rand}`;
}

export function simulateInstantPayout({ amount, currency = "INR" }) {
  const numericAmount = Math.max(0, Number(amount) || 0);
  const gateway = pickGateway();

  if (numericAmount <= 0) {
    return {
      status: "SKIPPED",
      gateway,
      transactionId: null,
      currency,
      processingSeconds: 0,
      processedAt: new Date(),
      message: "No payout amount was available for transfer."
    };
  }

  const processingSeconds = Math.max(6, Math.min(28, 6 + Math.floor(Math.random() * 18)));
  const rupees = Math.round(numericAmount);

  return {
    status: "SUCCESS",
    gateway,
    transactionId: buildTransactionId(gateway),
    currency,
    processingSeconds,
    processedAt: new Date(),
    message: `INR ${rupees} credited instantly via ${gateway.replace("_", " ")}`
  };
}

export async function initiateInstantPayout({ amount, currency = "INR", referenceId = "trustshield-payout", notes = {} }) {
  const gateway = pickGateway();

  if (gateway !== "RAZORPAY_TEST") {
    return simulateInstantPayout({ amount, currency });
  }

  const numericAmount = Math.max(0, Number(amount) || 0);
  if (numericAmount <= 0) {
    return {
      status: "SKIPPED",
      gateway,
      orderId: null,
      transactionId: null,
      currency,
      processingSeconds: 0,
      processedAt: new Date(),
      message: "No payout amount was available for transfer."
    };
  }

  const client = getRazorpayClient();
  if (!client) {
    return {
      status: "FAILED",
      gateway,
      orderId: null,
      transactionId: null,
      currency,
      processingSeconds: 0,
      processedAt: null,
      message: "Razorpay credentials are missing. Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
    };
  }

  const amountInPaise = Math.round(numericAmount * 100);
  const order = await client.orders.create({
    amount: amountInPaise,
    currency,
    receipt: `${referenceId}`.slice(0, 40),
    notes
  });

  return {
    status: "PENDING",
    gateway,
    orderId: order.id,
    transactionId: order.id,
    currency,
    processingSeconds: 0,
    processedAt: null,
    message: "Razorpay order created. Complete checkout to settle payout."
  };
}

export function verifyRazorpayPaymentSignature({ orderId, paymentId, signature }) {
  if (!env.razorpayKeySecret) {
    return false;
  }

  const payload = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", env.razorpayKeySecret).update(payload).digest("hex");
  return expected === signature;
}
