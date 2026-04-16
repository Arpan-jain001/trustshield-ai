import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { jsPDF } from "jspdf";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.resolve(__dirname, "../../docs/TrustShield-AI-Final-Pitch-Deck.pdf");

const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();

function drawBackground() {
  doc.setFillColor(8, 22, 38);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(20, 70, 95);
  doc.circle(110, 90, 80, "F");

  doc.setFillColor(85, 170, 185);
  doc.circle(pageWidth - 110, pageHeight - 80, 90, "F");

  doc.setFillColor(12, 36, 58);
  doc.rect(40, 40, pageWidth - 80, pageHeight - 80, "F");
}

function addTitle(title, subtitle) {
  drawBackground();

  doc.setTextColor(118, 228, 247);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Guidewire DEVTrails 2026 | Phase 3 Final Pitch", 60, 78);

  doc.setTextColor(245, 251, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.text(title, 60, 130);

  doc.setTextColor(214, 232, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  const subtitleLines = doc.splitTextToSize(subtitle, pageWidth - 120);
  doc.text(subtitleLines, 60, 165);
}

function addBullets(items, startY = 220) {
  doc.setTextColor(233, 244, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);

  let y = startY;
  for (const item of items) {
    const lines = doc.splitTextToSize(item, pageWidth - 140);
    doc.text(`- ${lines[0]}`, 74, y);
    y += 26;
    for (let i = 1; i < lines.length; i += 1) {
      doc.text(`  ${lines[i]}`, 74, y);
      y += 24;
    }
    y += 6;
  }
}

function addFooter(pageNumber) {
  doc.setTextColor(180, 205, 226);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("TrustShield AI | Confidential Pitch Material", 60, pageHeight - 34);
  doc.text(`Page ${pageNumber}`, pageWidth - 90, pageHeight - 34);
}

const slides = [
  {
    title: "TrustShield AI",
    subtitle: "AI-powered weekly parametric income protection for gig delivery workers",
    bullets: [
      "Coverage scope: loss of income only due to weather, pollution, and curfew disruptions.",
      "Excludes health, life, accident, and vehicle repair by design.",
      "Built for adversarial environments with explainable AI and fraud controls."
    ]
  },
  {
    title: "Problem and Persona",
    subtitle: "Delivery workers lose 20-30% income during uncontrollable external disruptions",
    bullets: [
      "Target persona: platform-based delivery worker (food, grocery, e-commerce).",
      "Workers need fast weekly protection aligned to weekly earnings cycles.",
      "Current safety nets are weak, manual, and vulnerable to false or delayed claims."
    ]
  },
  {
    title: "Our Solution",
    subtitle: "Weekly micro-insurance with AI decisioning and automated claim routing",
    bullets: [
      "Role-based surfaces: Worker, Insurer/Provider, Platform Ops, Admin.",
      "Provider-linked data isolation ensures insurer portfolio boundaries.",
      "Real-time disruption evidence drives claim simulation and approvals."
    ]
  },
  {
    title: "How It Works",
    subtitle: "End-to-end flow from signup to payout in one trust pipeline",
    bullets: [
      "Worker signs up, selects provider, verifies email, then awaits admin activation.",
      "Worker buys weekly policy and submits telemetry-backed claim trigger.",
      "AI + fraud + anomaly + graph signals produce APPROVED, NEEDS_REVIEW, or REJECTED decisions."
    ]
  },
  {
    title: "AI and Fraud Architecture",
    subtitle: "Clear, explainable logic over black-box complexity",
    bullets: [
      "Composite risk = location + device + behavior + network + cluster risk.",
      "Fraud score stack includes GPS inconsistency, weather mismatch, repeat claims, and linked accounts.",
      "Graph intelligence identifies synchronized claim pressure and ring-like behavior."
    ]
  },
  {
    title: "Phase 3: Advanced Fraud Detection",
    subtitle: "Delivery-focused practical scenarios implemented",
    bullets: [
      "GPS spoof pressure: unrealistic speed jumps and confidence mismatch flags.",
      "Fake weather claim check: trigger data cross-validated with disruption signals.",
      "Mass pattern detection: synchronized location claims increase review pressure."
    ]
  },
  {
    title: "Phase 3: Instant Payout Simulation",
    subtitle: "Fast payout experience with gateway-grade transaction trace",
    bullets: [
      "Approved claims now carry payout status, gateway, transaction ID, timestamp, and processing seconds.",
      "Gateway modes supported: RAZORPAY_TEST, STRIPE_SANDBOX, and UPI simulator fallback.",
      "UI highlights under-30-second payout SLA for judge-visible impact."
    ]
  },
  {
    title: "Intelligent Dashboard",
    subtitle: "Worker trust view + insurer intelligence layer",
    bullets: [
      "Worker dashboard: earnings protected, claims history, latest payout trace, active coverage signals.",
      "Insurer dashboard: loss ratio, next-week disruption risk band, fraud pressure, payout SLA.",
      "Ops and Admin dashboards provide queue controls, governance actions, and review workflows."
    ]
  },
  {
    title: "Weekly Pricing Model",
    subtitle: "Financial logic built for gig-worker weekly cash flow",
    bullets: [
      "Premium calculated weekly with dynamic risk modifiers and provider product controls.",
      "Loss ratio tracking improves underwriting and reserve posture decisions.",
      "Provider liquidity and payout ledger keep portfolio sustainability visible."
    ]
  },
  {
    title: "Business Viability",
    subtitle: "B2B2C-ready architecture with clear monetization levers",
    bullets: [
      "Providers publish policy products and underwrite linked worker cohorts.",
      "Platform earns distribution and risk-management value through trust automation.",
      "Data isolation and governance controls improve enterprise adoption confidence."
    ]
  },
  {
    title: "Scalability and Defensibility",
    subtitle: "Built to scale across cities, providers, and disruption patterns",
    bullets: [
      "Queue-based processing for ingestion, model jobs, replay, and retries.",
      "Feature snapshots and model artifacts support continuous learning loops.",
      "Modular API design supports future real gateway and platform integrations."
    ]
  },
  {
    title: "Why TrustShield AI Wins",
    subtitle: "Fast, explainable, fraud-aware income protection for India\'s gig economy",
    bullets: [
      "Strong phase coverage: ideation, automation, and scale optimization complete.",
      "Clear demo story: disruption trigger -> AI decision -> instant payout simulation.",
      "Balanced approach: worker trust, insurer control, and platform resilience in one stack."
    ]
  }
];

slides.forEach((slide, index) => {
  if (index > 0) doc.addPage();
  addTitle(slide.title, slide.subtitle);
  addBullets(slide.bullets);
  addFooter(index + 1);
});

const pdfBytes = doc.output("arraybuffer");
fs.writeFileSync(outputPath, Buffer.from(pdfBytes));

console.log(`Pitch deck generated: ${outputPath}`);
