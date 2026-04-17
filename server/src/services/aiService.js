import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

const genAi = env.geminiApiKey ? new GoogleGenAI({ apiKey: env.geminiApiKey }) : null;

function fallbackRisk(payload) {
  const base =
    (payload.weatherRisk || 0) * 0.22 +
    (payload.locationRisk || 0) * 0.16 +
    (payload.pastClaimsRisk || 0) * 0.15 +
    (payload.behaviorRisk || 0) * 0.12 +
    (payload.networkRisk || 0) * 0.1 +
    (payload.deviceRisk || 0) * 0.1 +
    (payload.clusterRisk || 0) * 0.15;
  const score = Math.max(10, Math.min(95, Math.round(base)));
  return {
    score,
    explanation: `Risk is ${score}/100 based on weather exposure, location volatility, recent claims pattern, behavior consistency, network trust, device integrity, and cluster-level fraud pressure.`,
    modelProvider: "FALLBACK",
    degraded: true
  };
}

export async function generateRiskAssessment(payload) {
  if (!genAi || env.aiProvider !== "GEMINI") {
    return {
      ...fallbackRisk(payload),
      degraded: false,
      modelProvider: "RULE_BASED"
    };
  }

  const prompt = `
  You are a risk engine for TrustShield AI, a parametric income-protection platform for gig workers in India.
  IMPORTANT: Do not mention health, life, accident, or vehicle insurance.
  Return strict JSON only with keys score and explanation.
  Evaluate from 0-100 using these signals:
  ${JSON.stringify(payload, null, 2)}
  Weight cluster risk, device integrity, and spoofing pressure carefully.
  `;

  try {
    const response = await genAi.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });
    const text = response.text?.trim() || "{}";
    const parsed = JSON.parse(text.replace(/```json|```/g, ""));
    return {
      score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
      explanation: parsed.explanation || "AI explanation unavailable.",
      modelProvider: "GEMINI",
      degraded: false
    };
  } catch (error) {
    console.warn("Gemini risk fallback:", error.message);
    return {
      ...fallbackRisk(payload),
      degraded: true,
      modelProvider: "FALLBACK"
    };
  }
}

export async function answerChatbot(question, context) {
  if (!genAi || env.aiProvider !== "GEMINI") {
    return `TrustShield AI assistant: ${question}. Based on your profile, risk score is ${context.riskScore}. Claim decision summary: ${context.claimSummary}`;
  }

  const prompt = `
  You are TrustShield AI assistant. Stay focused on parametric income protection only.
  Context:
  ${JSON.stringify(context, null, 2)}
  User question: ${question}
  Give a concise, helpful answer.
  `;

  try {
    const response = await genAi.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });
    return response.text || "I could not generate an answer right now.";
  } catch (error) {
    console.warn("Gemini chatbot fallback:", error.message);
    return `Your current risk score is ${context.riskScore}. Recent claims summary: ${context.claimSummary}`;
  }
}
