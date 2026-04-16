import { jsPDF } from "jspdf";
import { frontendEnv } from "../config/env";

const palette = {
  bg: [7, 22, 39],
  panel: [13, 33, 53],
  title: [118, 228, 247],
  heading: [255, 215, 168],
  body: [235, 244, 255],
  muted: [160, 186, 214],
  accent: [181, 245, 200]
};

const guideContent = {
  en: {
    file: "trustshield-ai-role-guide-en.pdf",
    title: "TrustShield AI Platform Guide",
    subtitle: "How to use the platform, how it works, what each role can do, and why the system matters.",
    badges: ["Zero Trust", "Parametric Insurance", "Role-Based Workflows"],
    sections: [
      {
        heading: "Live Website",
        lines: [frontendEnv.siteUrl]
      },
      {
        heading: "Platform Overview",
        lines: [
          "TrustShield AI protects income during environmental disruption with fast, explainable decisions.",
          "It resists GPS spoofing and coordinated fraud using multi-modal verification and graph-aware risk signals.",
          "It separates worker, provider, ops, and admin responsibilities so data visibility stays role-scoped."
        ]
      },
      {
        heading: "Worker Role",
        lines: [
          "Signup as Worker and choose the insurer/provider organization you work under.",
          "After email verification and admin approval, the worker can buy or renew a weekly provider-issued policy.",
          "Workers can ingest signals, simulate claims, view payouts, alerts, graph pressure, and claim reasons.",
          "Workers cannot verify users, configure provider rules, or operate platform queues."
        ]
      },
      {
        heading: "Insurer / Provider Role",
        lines: [
          "Signup as Insurer and create the provider organization profile.",
          "Providers can configure underwriting posture, publish products, run pricing simulations, manage liquidity, and review provider-linked claims.",
          "Providers see only the workers, policies, and claims issued under their own organization.",
          "Providers cannot view another provider's workforce or perform admin moderation."
        ]
      },
      {
        heading: "Platform Ops Role",
        lines: [
          "Signup as Platform Ops for operational visibility and trust-pipeline management.",
          "Ops users can monitor queue jobs, retry failed jobs, replay jobs, trigger model training, and inspect graph pressure and incidents.",
          "Ops users do not buy policies, issue policies, or moderate user verification."
        ]
      },
      {
        heading: "Admin Role",
        lines: [
          "Admins verify, reject, suspend, or ban accounts.",
          "Admins review claims, resolve fraud alerts, and inspect cross-system evidence.",
          "Admin approval unlocks full role-specific dashboard access for user accounts."
        ]
      },
      {
        heading: "Core Signup and Access Flow",
        lines: [
          "1. Select role at signup.",
          "2. Verify email using OTP or secure link.",
          "3. User can log in and see status while admin review is pending.",
          "4. Admin approval enables full dashboard actions.",
          "5. Workers buy policies from the linked provider organization."
        ]
      },
      {
        heading: "How the Platform Works",
        lines: [
          "Workers, providers, ops teams, and admins all get different dashboards and different permissions.",
          "A worker selects a provider during signup, and that provider becomes the policy issuer and protected portfolio owner.",
          "Signal fusion combines weather, IP intelligence, device context, network behavior, telemetry, and graph pressure.",
          "Claims move through anomaly checks, graph checks, risk scoring, and then into approval, soft verification, or manual review.",
          "Platform Ops manages queue processing, replay paths, incidents, and model workflows.",
          "Admin remains the final trust gate for protected access and governance."
        ]
      }
    ]
  },
  hi: {
    file: "trustshield-ai-role-guide-hi.pdf",
    title: "TrustShield AI Platform Guide",
    subtitle: "Platform ka use kaise karein, yeh kaise kaam karta hai, har role kya kar sakta hai, aur system kyun important hai.",
    badges: ["Zero Trust", "Parametric Insurance", "Role-Based Workflows"],
    sections: [
      {
        heading: "Live Website",
        lines: [frontendEnv.siteUrl]
      },
      {
        heading: "Platform Overview",
        lines: [
          "TrustShield AI environmental disruption ke time income protection ko fast aur explainable decisions ke saath support karta hai.",
          "Yeh GPS spoofing aur coordinated fraud ko multi-modal verification aur graph-aware risk signals se resist karta hai.",
          "Yeh worker, provider, ops, aur admin responsibilities ko alag rakhta hai taaki visibility role-scoped rahe."
        ]
      },
      {
        heading: "Worker Role",
        lines: [
          "Worker ke roop me signup karein aur apni insurer/provider organization choose karein.",
          "Email verification aur admin approval ke baad worker weekly provider-issued policy buy ya renew kar sakta hai.",
          "Worker signals ingest, claims simulate, payouts, alerts, graph pressure, aur decision reasons dekh sakta hai.",
          "Worker users verify nahi kar sakta, provider rules change nahi kar sakta, aur platform queue operate nahi kar sakta."
        ]
      },
      {
        heading: "Insurer / Provider Role",
        lines: [
          "Insurer ke roop me signup karein aur provider organization profile banayein.",
          "Provider underwriting posture configure kar sakta hai, products publish kar sakta hai, pricing simulations chala sakta hai, liquidity manage kar sakta hai, aur provider-linked claims review kar sakta hai.",
          "Provider sirf apni organization ke under issued workers, policies aur claims inspect kar sakta hai.",
          "Provider kisi aur provider ka workforce ya admin moderation access nahi kar sakta."
        ]
      },
      {
        heading: "Platform Ops Role",
        lines: [
          "Platform Ops role operational visibility aur trust pipeline management ke liye hai.",
          "Ops queue jobs monitor kar sakta hai, failed jobs retry kar sakta hai, replay paths chala sakta hai, model training trigger kar sakta hai, aur graph pressure aur incidents inspect kar sakta hai.",
          "Ops policies buy ya issue nahi karta aur user verification moderate nahi karta."
        ]
      },
      {
        heading: "Admin Role",
        lines: [
          "Admin accounts verify, reject, suspend, ya ban karte hain.",
          "Admin claims review karte hain, fraud alerts resolve karte hain, aur cross-system evidence inspect karte hain.",
          "Admin approval ke baad hi user accounts ka full dashboard access unlock hota hai."
        ]
      },
      {
        heading: "Core Signup and Access Flow",
        lines: [
          "1. Signup me role select karein.",
          "2. OTP ya secure link se email verify karein.",
          "3. Admin review pending hone par bhi user login karke status dekh sakta hai.",
          "4. Admin approval ke baad full dashboard actions enable hote hain.",
          "5. Workers policies apne linked provider organization se lete hain."
        ]
      },
      {
        heading: "Platform Kaam Kaise Karta Hai",
        lines: [
          "Workers, providers, ops teams, aur admins sabke dashboards aur permissions alag hote hain.",
          "Worker signup ke time provider choose karta hai aur wahi policy issuer banta hai.",
          "Signal fusion weather, IP intelligence, device context, network behavior, telemetry, aur graph pressure ko combine karta hai.",
          "Claims anomaly checks, graph checks, risk scoring, aur decision routing se guzarte hain.",
          "Platform Ops queue processing, replay paths, incidents, aur model workflows handle karta hai.",
          "Admin protected access aur governance ka final trust gate hota hai."
        ]
      }
    ]
  }
};

function drawFrame(doc, content, pageNumber) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(...palette.bg);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setDrawColor(28, 58, 84);
  doc.roundedRect(24, 24, pageWidth - 48, pageHeight - 48, 22, 22);

  doc.setFillColor(...palette.panel);
  doc.roundedRect(36, 34, pageWidth - 72, 78, 18, 18, "F");

  doc.setTextColor(...palette.title);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(content.title, 52, 64);

  doc.setTextColor(...palette.body);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(content.subtitle, pageWidth - 120), 52, 84);

  let badgeX = 52;
  doc.setFontSize(9);
  content.badges.forEach((badge) => {
    const width = doc.getTextWidth(badge) + 22;
    doc.setFillColor(19, 48, 73);
    doc.roundedRect(badgeX, 92, width, 18, 9, 9, "F");
    doc.setTextColor(...palette.accent);
    doc.text(badge, badgeX + 11, 104);
    badgeX += width + 8;
  });

  doc.setDrawColor(24, 78, 104);
  doc.line(40, pageHeight - 48, pageWidth - 40, pageHeight - 48);
  doc.setTextColor(...palette.muted);
  doc.setFontSize(9);
  doc.text(`© 2026 TrustShield AI. All rights reserved. || Developed by Arpan Jain (AJ001)`, 40, pageHeight - 30);
  doc.text(frontendEnv.siteUrl, pageWidth - 190, pageHeight - 30);
  doc.text(`Page ${pageNumber}`, pageWidth - 70, pageHeight - 16);
}

export function downloadGuidePdf(language = "en") {
  const content = guideContent[language] || guideContent.en;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 48;
  const topY = 140;
  const bottomLimit = pageHeight - 72;
  let pageNumber = 1;
  let y = topY;

  const startPage = () => {
    drawFrame(doc, content, pageNumber);
    y = topY;
  };

  const nextPage = () => {
    doc.addPage();
    pageNumber += 1;
    startPage();
  };

  const ensurePage = (extra = 24) => {
    if (y + extra <= bottomLimit) return;
    nextPage();
  };

  startPage();

  content.sections.forEach((section) => {
    const headingHeight = 44;
    ensurePage(headingHeight + 12);

    doc.setFillColor(13, 33, 53);
    doc.roundedRect(marginX, y - 8, pageWidth - marginX * 2, headingHeight, 14, 14, "F");
    doc.setTextColor(...palette.heading);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(section.heading, marginX + 14, y + 18);
    y += headingHeight + 6;

    doc.setTextColor(...palette.body);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    section.lines.forEach((line) => {
      const wrapped = doc.splitTextToSize(`- ${line}`, pageWidth - marginX * 2 - 18);
      const blockHeight = wrapped.length * 14 + 18;
      ensurePage(blockHeight + 8);

      doc.setFillColor(10, 27, 44);
      doc.roundedRect(marginX, y - 6, pageWidth - marginX * 2, blockHeight, 12, 12, "F");
      doc.text(wrapped, marginX + 12, y + 10);
      y += blockHeight + 8;
    });

    y += 8;
  });

  doc.save(content.file);
}
