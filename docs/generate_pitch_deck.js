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

doc.fontSize(26).text('TrustShield AI Final Pitch Deck', { align: 'center' });
doc.moveDown();

doc.fontSize(16).text('Overview', { underline: true });
doc.moveDown(0.25);
doc.fontSize(12).text('TrustShield AI is a next-generation parametric insurance platform designed for gig workers, enabling instant, automated payouts during extreme environmental conditions. It is built with an adversarial-first architecture to resist GPS spoofing and coordinated fraud attacks.');

doc.moveDown();
doc.fontSize(16).text('1. Problem', { underline: true });
doc.moveDown(0.25);
doc.fontSize(12).text('• Parametric insurance is vulnerable to GPS spoofing and fraud.');
doc.text('• Existing systems rely on single-source verification, which can be manipulated by fraud rings.');

doc.moveDown();
doc.fontSize(16).text('2. Solution', { underline: true });
doc.moveDown(0.25);
doc.fontSize(12).text('• TrustShield AI uses multi-modal verification: GPS, cell tower, IP, sensor telemetry, and network signals.');
doc.text('• The platform combines machine learning, anomaly detection, and graph-based fraud detection to protect payouts and ensure fairness.');

doc.moveDown();
doc.fontSize(16).text('3. Target Users', { underline: true });
doc.moveDown(0.25);
doc.fontSize(12).text('• Gig economy delivery partners and riders');
doc.text('• Insurance providers offering parametric coverage');
doc.text('• Platforms requiring fraud-resistant risk management');

doc.moveDown();
doc.fontSize(16).text('4. Product Highlights', { underline: true });
doc.moveDown(0.25);
doc.fontSize(12).text('• Instant automated payouts for extreme conditions');
doc.text('• Multi-layer trust architecture for adversarial environments');
doc.text('• Graph-based fraud ring detection and trajectory validation');
doc.text('• Behavioral and motion consistency checks');

doc.moveDown();
doc.fontSize(16).text('5. Architecture', { underline: true });
doc.moveDown(0.25);
doc.fontSize(12).text('• Ingestion API and stream processing');
doc.text('• Feature store and risk engine');
doc.text('• Graph engine, claim service, and payout dashboard');

doc.moveDown();
doc.fontSize(16).text('6. Tech Stack', { underline: true });
doc.moveDown(0.25);
doc.fontSize(12).text('• Frontend: React, Tailwind CSS');
doc.text('• Backend: Node.js, Express');
doc.text('• Database: MongoDB');
doc.text('• Intelligence: ML models and graph algorithms');

doc.moveDown();
doc.fontSize(16).text('7. Requirements Checklist', { underline: true });
doc.moveDown(0.25);
doc.fontSize(12).text('• Pitch deck is uploaded and referenced in the repository README under the "Pitch Deck" section.');
doc.text('• Demo video is available and linked in the README.');
doc.text('• Complete source code is provided in the repository with dependencies and local run instructions.');

doc.moveDown();
doc.fontSize(16).text('8. Demo and Links', { underline: true });
doc.moveDown(0.25);
doc.fontSize(12).text('• Demo Video: https://docs.google.com/videos/d/1GwxiW2muhRkE2_4rlvMHfPnY7gVCtzMD9K3o23xG4Gs/play');
doc.text('• Live Frontend: https://trustshield-ai-frontend.vercel.app/');
doc.text('• Pitch Deck File: docs/TrustShield-AI-Final-Pitch-Deck.pdf');

doc.moveDown();
doc.fontSize(16).text('9. Source Code', { underline: true });
doc.moveDown(0.25);
doc.fontSize(12).text('• The full source code is available in this GitHub repository, including frontend, backend, and shared packages.');
doc.text('• Run locally using npm install and npm run server / npm run dev as described in the README.');

doc.end();
stream.on('finish', () => {
  console.log('PDF generated:', outputPath);
});
