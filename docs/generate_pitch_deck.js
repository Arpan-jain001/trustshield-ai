const fs = require('fs');
const PDFDocument = require('pdfkit');
const backupPath = 'docs/TrustShield-AI-Final-Pitch-Deck.pdf.bak';
const outputPath = 'docs/TrustShield-AI-Final-Pitch-Deck.pdf';

if (fs.existsSync(outputPath)) {
  fs.copyFileSync(outputPath, backupPath);
}

const doc = new PDFDocument({ margin: 0, size: 'A4' });
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

const brand = {
  background: '#07111d',
  card: '#11243f',
  accent: '#22c55e',
  accentSoft: '#2563eb',
  text: '#f8fafc',
  subtext: '#cbd5e1',
  border: '#334155'
};

const sections = [
  {
    title: 'TrustShield AI',
    subtitle: 'AI-powered weekly parametric income protection for gig delivery workers',
    bullets: [
      'Coverage scope: loss of income only due to weather, pollution, and curfew disruptions.',
      'Excludes health, life, accident, and vehicle repair by design.',
      'Built for adversarial environments with explainable AI and fraud controls.'
    ]
  },
  {
    title: 'Problem and Persona',
    subtitle: 'Delivery workers lose income during uncontrollable disruptions',
    bullets: [
      'Target persona: platform-based food, grocery and e-commerce delivery workers.',
      'Workers lose 20-30% weekly income during weather and curfew disruptions.',
      'Existing safety nets are weak, manual and vulnerable to delayed or false claims.'
    ]
  },
  {
    title: 'Our Solution',
    subtitle: 'Weekly micro-insurance with AI decisioning and automated routing',
    bullets: [
      'Role-based experiences for Worker, Insurer/Provider, Platform Ops and Admin.',
      'Provider-linked data isolation ensures portfolio boundaries and governance.',
      'Real-time disruption evidence drives claim simulation and approvals.'
    ]
  },
  {
    title: 'How It Works',
    subtitle: 'Signup to payout in one trust pipeline',
    bullets: [
      'Worker registers, selects provider, verifies email, and activates coverage.',
      'Weekly policy purchase and telemetry-backed claim trigger submission.',
      'AI + fraud + anomaly + graph signals produce APPROVED / NEEDS_REVIEW / REJECTED.'
    ]
  },
  {
    title: 'AI + Fraud Architecture',
    subtitle: 'Explainable risk scoring for trustworthy decisions',
    bullets: [
      'Composite risk = location + device + behavior + network + cluster risk.',
      'Fraud stack uses GPS inconsistency, weather mismatch, repeat claims, linked accounts.',
      'Graph intelligence detects synchronized claim pressure and ring-like fraud patterns.'
    ]
  },
  {
    title: 'Phase 3: Advanced Fraud Detection',
    subtitle: 'Delivery-focused practical fraud defenses',
    bullets: [
      'GPS spoof pressure: speed jumps, confidence mismatch and route anomalies.',
      'Weather claim checks: cross-validation with live disruption and AQI signals.',
      'Mass pattern detection: synchronized claims trigger elevated review pressure.'
    ]
  },
  {
    title: 'Phase 3: Instant Payout Simulation',
    subtitle: 'Gateway-grade trace and SLA visibility',
    bullets: [
      'Approved claims carry payout status, gateway, transaction ID, timestamp and processing seconds.',
      'Gateway modes: RAZORPAY_TEST, STRIPE_SANDBOX, UPI simulator fallback.',
      'UI highlights under-30-second payout SLA for judge-visible impact.'
    ]
  },
  {
    title: 'Intelligent Dashboards',
    subtitle: 'Trust and control for workers, insurers, and ops',
    bullets: [
      'Worker dashboard: protected earnings, claims history, payout trace, coverage signals.',
      'Insurer dashboard: loss ratio, disruption risk band, fraud pressure, payout SLA.',
      'Ops/Admin dashboards: queue controls, governance, and review workflows.'
    ]
  },
  {
    title: 'Pricing & Sustainability',
    subtitle: 'Weekly pricing built for gig cash flow',
    bullets: [
      'Premiums calculated weekly with dynamic risk modifiers and provider controls.',
      'Loss ratio tracking improves underwriting and reserve posture decisions.',
      'Provider liquidity and payout ledger keep sustainability visible.'
    ]
  },
  {
    title: 'Business Viability',
    subtitle: 'B2B2C-ready model with monetization levers',
    bullets: [
      'Providers publish policy products and underwrite linked worker cohorts.',
      'Platform earns distribution and risk-management value through trust automation.',
      'Data isolation and governance controls improve enterprise adoption confidence.'
    ]
  },
  {
    title: 'Scale & Defensibility',
    subtitle: 'Built for cities, providers and disruption patterns',
    bullets: [
      'Queue-based processing for ingestion, model jobs, replay and retries.',
      'Feature snapshots and model artifacts support continuous learning loops.',
      'Modular API design supports future real gateway and integration readiness.'
    ]
  },
  {
    title: 'Why TrustShield AI Wins',
    subtitle: 'Phase 3 delivers clear value for judges',
    bullets: [
      'Strong phase coverage: ideation, automation and scale optimization complete.',
      'Clear demo story: disruption trigger → AI decision → instant payout simulation.',
      'Balanced worker trust, insurer control, and platform resilience in one stack.'
    ]
  },
  {
    title: 'Submission Links',
    subtitle: 'Project and demo references',
    bullets: [
      'GitHub: https://github.com/Arpan-jain001/trustshield-ai',
      'Demo video: https://docs.google.com/videos/d/1GwxiW2muhRkE2_4rlvMHfPnY7gVCtzMD9K3o23xG4Gs/play',
      'Live frontend: https://trustshield-ai-frontend.vercel.app/'
    ]
  },
  {
    title: 'Thank You',
    subtitle: 'Ready for Guidewire DEVTrails 2026',
    bullets: [
      'TrustShield AI delivers explainable, fraud-aware weekly income protection for India’s gig delivery workforce.',
      'Contact: arpanjain00123@gmail.com'
    ]
  }
];

function drawBackground() {
  doc.save();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(brand.background);
  doc.fillOpacity(0.18).fill(brand.accentSoft).circle(90, 100, 80).fill();
  doc.fillOpacity(0.2).fill(brand.accent).circle(doc.page.width - 120, 140, 110).fill();
  doc.fillOpacity(0.14).fill(brand.border).circle(100, doc.page.height - 120, 70).fill();
  doc.fillOpacity(0.16).fill(brand.accentSoft).circle(doc.page.width - 80, doc.page.height - 100, 90).fill();
  doc.restore();
}

function drawHeader() {
  doc.fillColor(brand.text).font('Helvetica-Bold').fontSize(16).text('Guidewire DEVTrails 2026 | Phase 3 Final Pitch', 20, 18, { width: doc.page.width - 40, align: 'left' });
  doc.fillColor(brand.accent).fontSize(10).text('TrustShield AI', 20, 38);
  doc.fillColor(brand.subtext).font('Helvetica').fontSize(9).text('Advanced parametric income protection for gig delivery workers', 20, 50);
  doc.strokeColor(brand.border).lineWidth(0.5).moveTo(20, 65).lineTo(doc.page.width - 20, 65).stroke();
}

function drawCard(x, y, width, height, section) {
  doc.save();
  doc.roundedRect(x, y, width, height, 12).fill(brand.card);
  doc.strokeColor(brand.border).lineWidth(0.8).roundedRect(x, y, width, height, 12).stroke();
  doc.fillColor(brand.accent).font('Helvetica-Bold').fontSize(14).text(section.title, x + 18, y + 18, { width: width - 36 });
  doc.fillColor(brand.subtext).font('Helvetica').fontSize(10).text(section.subtitle, x + 18, y + 40, { width: width - 36, lineGap: 3 });
  let bulletY = y + 70;
  section.bullets.forEach((bullet) => {
    doc.fillColor(brand.text).font('Helvetica').fontSize(11).text(`• ${bullet}`, x + 18, bulletY, { width: width - 36, lineGap: 4 });
    bulletY += doc.heightOfString(`• ${bullet}`, { width: width - 36, lineGap: 4 }) + 6;
  });
  doc.restore();
}

function addPageSections(pageIndex) {
  const headerHeight = 75;
  const footerHeight = 20;
  const gapBetweenCards = 8;
  const top = headerHeight;
  const usableHeight = doc.page.height - headerHeight - footerHeight;
  const cardHeight = (usableHeight - gapBetweenCards) / 2;
  const cardWidth = doc.page.width - 40;
  const sectionIndex = pageIndex * 2;
  drawCard(20, top, cardWidth, cardHeight, sections[sectionIndex]);
  if (sections[sectionIndex + 1]) {
    drawCard(20, top + cardHeight + gapBetweenCards, cardWidth, cardHeight, sections[sectionIndex + 1]);
  }
  doc.fillColor(brand.subtext).font('Helvetica').fontSize(8).text(`Page ${pageIndex + 1} of ${Math.ceil(sections.length / 2)}`, 20, doc.page.height - 14, { align: 'center', width: doc.page.width - 40 });
}

const pages = Math.ceil(sections.length / 2);
for (let pageIndex = 0; pageIndex < pages; pageIndex += 1) {
  if (pageIndex > 0) doc.addPage();
  drawBackground();
  drawHeader();
  addPageSections(pageIndex);
}

doc.end();
stream.on('finish', () => {
  console.log('PDF generated:', outputPath);
});
