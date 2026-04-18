const fs = require('fs');
const PDFDocument = require('pdfkit');
const backupPath = 'docs/TrustShield-AI-Final-Pitch-Deck.pdf.bak';
const outputPath = 'docs/TrustShield-AI-Final-Pitch-Deck.pdf';

if (fs.existsSync(outputPath)) {
  fs.copyFileSync(outputPath, backupPath);
}

const doc = new PDFDocument({ margin: 50 });
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

doc.fontSize(24).text('Guidewire DEVTrails 2026 | Phase 3 Final Pitch', { align: 'center' });
doc.fontSize(20).text('TrustShield AI', { align: 'center' });
doc.moveDown(0.25);
doc.fontSize(14).fillColor('gray').text('AI-powered weekly parametric income protection for gig delivery workers', { align: 'center' });
doc.moveDown(0.75);

doc.fontSize(12).fillColor('black').text('- Coverage scope: loss of income only due to weather, pollution, and curfew disruptions.');
doc.text('- Excludes health, life, accident, and vehicle repair by design.');
doc.text('- Built for adversarial environments with explainable AI and fraud controls.');

doc.addPage();
doc.fontSize(22).text('TrustShield AI | Confidential Pitch Material', { align: 'center' });
doc.fontSize(18).text('Problem and Persona', { underline: true });
doc.moveDown(0.5);
doc.fontSize(12).text('Delivery workers lose 20-30% income during uncontrollable external disruptions.');
doc.moveDown(0.25);
doc.text('- Target persona: platform-based delivery worker (food, grocery, e-commerce).');
doc.text('- Workers need fast weekly protection aligned to weekly earnings cycles.');
doc.text('- Current safety nets are weak, manual, and vulnerable to false or delayed claims.');

doc.addPage();
doc.fontSize(22).text('Our Solution', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(12).text('Weekly micro-insurance with AI decisioning and automated claim routing.');
doc.moveDown(0.25);
doc.text('- Role-based surfaces: Worker, Insurer/Provider, Platform Ops, Admin.');
doc.text('- Provider-linked data isolation ensures insurer portfolio boundaries.');
doc.text('- Real-time disruption evidence drives claim simulation and approvals.');

doc.addPage();
doc.fontSize(22).text('How It Works', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(12).text('End-to-end flow from signup to payout in one trust pipeline.');
doc.moveDown(0.25);
doc.text('- Worker signs up, selects provider, verifies email, then awaits admin activation.');
doc.text('- Worker buys weekly policy and submits telemetry-backed claim trigger.');
doc.text('- AI + fraud + anomaly + graph signals produce APPROVED, NEEDS_REVIEW, or REJECTED decisions.');

doc.addPage();
doc.fontSize(22).text('AI and Fraud Architecture', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(12).text('Clear, explainable logic over black-box complexity.');
doc.moveDown(0.25);
doc.text('- Composite risk = location + device + behavior + network + cluster risk.');
doc.text('- Fraud score stack includes GPS inconsistency, weather mismatch, repeat claims, and linked accounts.');
doc.text('- Graph intelligence identifies synchronized claim pressure and ring-like behavior.');

doc.addPage();
doc.fontSize(22).text('Phase 3: Advanced Fraud Detection', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(12).text('Delivery-focused practical scenarios implemented.');
doc.moveDown(0.25);
doc.text('- GPS spoof pressure: unrealistic speed jumps and confidence mismatch flags.');
doc.text('- Fake weather claim check: trigger data cross-validated with disruption signals.');
doc.text('- Mass pattern detection: synchronized location claims increase review pressure.');

doc.addPage();
doc.fontSize(22).text('Phase 3: Instant Payout Simulation', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(12).text('Fast payout experience with gateway-grade transaction trace.');
doc.moveDown(0.25);
doc.text('- Approved claims now carry payout status, gateway, transaction ID, timestamp, and processing seconds.');

doc.text('- Gateway modes supported: RAZORPAY_TEST, STRIPE_SANDBOX, and UPI simulator fallback.');
doc.text('- UI highlights under-30-second payout SLA for judge-visible impact.');

doc.addPage();
doc.fontSize(22).text('Intelligent Dashboard', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(12).text('Worker trust view + insurer intelligence layer.');
doc.moveDown(0.25);
doc.text('- Worker dashboard: earnings protected, claims history, latest payout trace, active coverage signals.');
doc.text('- Insurer dashboard: loss ratio, next-week disruption risk band, fraud pressure, payout SLA.');

doc.text('- Ops and Admin dashboards provide queue controls, governance actions, and review workflows.');

doc.addPage();
doc.fontSize(22).text('Weekly Pricing Model', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(12).text('Financial logic built for gig-worker weekly cash flow.');
doc.moveDown(0.25);
doc.text('- Premium calculated weekly with dynamic risk modifiers and provider product controls.');
doc.text('- Loss ratio tracking improves underwriting and reserve posture decisions.');
doc.text('- Provider liquidity and payout ledger keep portfolio sustainability visible.');

doc.addPage();
doc.fontSize(22).text('Business Viability', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(12).text('B2B2C-ready architecture with clear monetization levers.');
doc.moveDown(0.25);
doc.text('- Providers publish policy products and underwrite linked worker cohorts.');
doc.text('- Platform earns distribution and risk-management value through trust automation.');
doc.text('- Data isolation and governance controls improve enterprise adoption confidence.');

doc.addPage();
doc.fontSize(22).text('Scalability and Defensibility', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(12).text('Built to scale across cities, providers, and disruption patterns.');
doc.moveDown(0.25);
doc.text('- Queue-based processing for ingestion, model jobs, replay, and retries.');
doc.text('- Feature snapshots and model artifacts support continuous learning loops.');
doc.text('- Modular API design supports future real gateway and platform integrations.');

doc.addPage();
doc.fontSize(22).text('Why TrustShield AI Wins', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(12).text('Fast, explainable, fraud-aware income protection for India\'s gig economy.');
doc.moveDown(0.25);
doc.text('- Strong phase coverage: ideation, automation, and scale optimization complete.');
doc.text('- Clear demo story: disruption trigger -> AI decision -> instant payout simulation.');
doc.text('- Balanced approach: worker trust, insurer control, and platform resilience in one stack.');

doc.addPage();
doc.fontSize(18).text('Repository and Submission Links', { underline: true });
doc.moveDown(0.25);
doc.fontSize(12).text('GitHub repository: https://github.com/Arpan-jain001/trustshield-ai');
doc.text('Demo Video: https://docs.google.com/videos/d/1GwxiW2muhRkE2_4rlvMHfPnY7gVCtzMD9K3o23xG4Gs/play');
doc.text('Live Frontend: https://trustshield-ai-frontend.vercel.app/');

doc.end();
stream.on('finish', () => {
  console.log('PDF generated:', outputPath);
});
