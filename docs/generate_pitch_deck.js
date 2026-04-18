const fs = require('fs');
const PDFDocument = require('pdfkit');
const backupPath = 'docs/TrustShield-AI-Final-Pitch-Deck.pdf.bak';
const outputPath = 'docs/TrustShield-AI-Final-Pitch-Deck.pdf';

if (fs.existsSync(outputPath)) {
  fs.copyFileSync(outputPath, backupPath);
}

const doc = new PDFDocument({ margin: 50, size: 'A4' });
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

const brand = {
  primary: '#1f2937',
  accent: '#2563eb',
  text: '#111827',
  gray: '#6b7280'
};

function drawPageFrame(title, subtitle) {
  doc.fillColor(brand.primary).rect(0, 0, doc.page.width, 100).fill();
  doc.fillColor('white').font('Helvetica-Bold').fontSize(18).text('Guidewire DEVTrails 2026', 50, 28);
  doc.fontSize(14).fillColor('white').text(title, 50, 52);
  if (subtitle) {
    doc.font('Helvetica').fontSize(10).fillColor('white').text(subtitle, 50, 74);
  }
  doc.moveDown(4);
}

function addSectionHeader(text) {
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(18).fillColor(brand.primary).text(text);
  doc.moveDown(0.5);
}

function addBullet(text) {
  doc.fillColor(brand.text).font('Helvetica').fontSize(12).text(`• ${text}`, { indent: 18, lineGap: 4 });
}

function addNote(text) {
  doc.fillColor(brand.gray).font('Helvetica').fontSize(11).text(text, { indent: 18, lineGap: 4 });
}

function addFooter() {
  const pageNumber = doc.page.number;
  doc.font('Helvetica').fontSize(9).fillColor(brand.gray).text(`Page ${pageNumber}`, 50, doc.page.height - 50, { align: 'center', width: doc.page.width - 100 });
}

function nextPage(title, subtitle) {
  if (doc.page.number > 0) {
    doc.addPage();
  }
  drawPageFrame(title, subtitle);
}

nextPage('TrustShield AI', 'AI-powered weekly parametric income protection for gig delivery workers');
doc.font('Helvetica-Bold').fontSize(20).fillColor(brand.accent).text('Phase 3 Final Pitch', { align: 'center' });
doc.moveDown(1);
doc.font('Helvetica').fontSize(12).fillColor(brand.text).text('A secure, explainable, and fraud-aware parametric protection system designed for delivery workers in adversarial environments.');
doc.moveDown(1);
addSectionHeader('Why it matters');
addBullet('Protects weekly income for delivery workers during weather, pollution, and curfew disruptions.');
addBullet('Excludes health, life, accident, and vehicle repair to keep coverage focused and sustainable.');
addBullet('Built to operate in adversarial conditions with robust fraud controls.');
addFooter();

nextPage('Problem and Persona', 'Real income loss for platform-based delivery workers');
addBullet('Delivery workers lose 20-30% income during uncontrollable external disruptions.');
addBullet('Target persona: food, grocery, and e-commerce delivery workers.');
addBullet('Workers need a weekly protection model aligned with their earnings cycles.');
addBullet('Current safety nets are weak, manual, and vulnerable to false or delayed claims.');
addFooter();

nextPage('Our Solution', 'AI-first weekly micro-insurance with operational trust');
addBullet('Weekly policy model with real-time claim triggers and automated decisioning.');
addBullet('Role-based surfaces for Worker, Insurer/Provider, Platform Ops, and Admin.');
addBullet('Provider-linked data isolation secures insurer portfolios and governance boundaries.');
addBullet('Disruption evidence is validated using telematics, weather, AQI, and fraud signals.');
addFooter();

nextPage('How It Works', 'Seamless flow from signup to payout');
addBullet('Worker signs up, selects a provider, verifies identity/email, and activates coverage.');
addBullet('Worker purchases a weekly policy and submits a telemetry-backed claim trigger.');
addBullet('AI + fraud + anomaly + graph signals produce APPROVED, NEEDS_REVIEW, or REJECTED decisions.');
addFooter();

nextPage('AI + Fraud Architecture', 'Explainable scoring for trust and transparency');
addBullet('Composite risk score = location + device + behavior + network + cluster risk.');
addBullet('Fraud score stack includes GPS inconsistency, weather mismatch, repeat claims, and linked accounts.');
addBullet('Graph intelligence identifies synchronized claim pressure and ring-like behavior.');
addFooter();

nextPage('Phase 3: Advanced Fraud Detection', 'Delivery-focused practical fraud defenses');
addBullet('GPS spoof pressure: unrealistic speed jumps, confidence mismatch, and route anomalies.');
addBullet('Fake weather claim checks: cross-validated disruption signals with real-time data.');
addBullet('Mass pattern detection: synchronized claims and ring-like account behavior trigger review pressure.');
addFooter();

nextPage('Phase 3: Instant Payout Simulation', 'Gateway-grade trace and SLA visibility');
addBullet('Approved claims include payout status, gateway, transaction ID, timestamp, and processing seconds.');
addBullet('Gateway modes supported: RAZORPAY_TEST, STRIPE_SANDBOX, and UPI simulator fallback.');
addBullet('UI highlights under-30-second payout SLA for judge-visible impact.');
addFooter();

nextPage('Intelligent Dashboards', 'Trust and control for workers, insurers, and ops');
addBullet('Worker dashboard: protected earnings, claims history, payout trace, and coverage signals.');
addBullet('Insurer dashboard: loss ratio, disruption risk band, fraud pressure, and payout SLA.');
addBullet('Ops/Admin dashboards provide queue controls, governance actions, and review workflows.');
addFooter();

nextPage('Pricing & Sustainability', 'Weekly pricing built for gig cash flow');
addBullet('Premiums are calculated weekly with dynamic risk modifiers and provider controls.');
addBullet('Loss ratio tracking improves underwriting and reserve posture decisions.');
addBullet('Provider liquidity and payout ledger keep sustainability visible.');
addFooter();

nextPage('Business Viability', 'B2B2C-ready model with enterprise confidence');
addBullet('Providers publish policy products and underwrite linked worker cohorts.');
addBullet('Platform earns distribution and risk-management value through trust automation.');
addBullet('Data isolation and governance controls improve enterprise adoption confidence.');
addFooter();

nextPage('Scale & Defensibility', 'Built for cities, providers, and disruption patterns');
addBullet('Queue-based processing for ingestion, model jobs, replay, and retries.');
addBullet('Feature snapshots and model artifacts support continuous learning loops.');
addBullet('Modular API design supports future real gateway and platform integrations.');
addFooter();

nextPage('Why TrustShield AI Wins', 'Clear phase 3 value for the judge panel');
addBullet('Strong phase coverage from ideation to automation and scale optimization.');
addBullet('Clear demo story: disruption trigger → AI decision → instant payout simulation.');
addBullet('Balanced approach across worker trust, insurer control, and platform resilience.');
addFooter();

nextPage('Submission Link Summary', null);
doc.font('Helvetica-Bold').fontSize(14).fillColor(brand.primary).text('GitHub Repository', { continued: false });
doc.font('Helvetica').fillColor(brand.text).text('https://github.com/Arpan-jain001/trustshield-ai');
doc.moveDown(0.5);
doc.font('Helvetica-Bold').fillColor(brand.primary).text('Demo Video');
doc.font('Helvetica').fillColor(brand.text).text('https://docs.google.com/videos/d/1GwxiW2muhRkE2_4rlvMHfPnY7gVCtzMD9K3o23xG4Gs/play');
doc.moveDown(0.5);
doc.font('Helvetica-Bold').fillColor(brand.primary).text('Live Frontend');
doc.font('Helvetica').fillColor(brand.text).text('https://trustshield-ai-frontend.vercel.app/');
addFooter();

nextPage('Thank You', 'Ready for Guidewire DEVTrails 2026');
doc.font('Helvetica').fontSize(12).fillColor(brand.text).text('TrustShield AI is positioned to deliver fast, explainable, and fraud-aware weekly income protection for India’s gig delivery workforce.', { lineGap: 4 });
doc.moveDown(1);
doc.font('Helvetica-Bold').fontSize(12).fillColor(brand.accent).text('Contact: info@trustshield.ai');
addFooter();

doc.end();
stream.on('finish', () => {
  console.log('PDF generated:', outputPath);
});
