#  TrustShield AI – Adversarially Resilient Parametric Insurance

![Status](https://img.shields.io/badge/status-active-success) ![License](https://img.shields.io/badge/license-MIT-blue)

## 🧠 Overview

TrustShield AI is a next-generation parametric insurance platform designed for gig workers, enabling **instant, automated payouts during extreme environmental conditions**.

⚡ Designed to operate under real-world adversarial attacks where traditional GPS-based systems fail.

Unlike traditional systems, TrustShield AI follows a **zero-trust, adversarial-first architecture**, ensuring resilience against sophisticated fraud attacks such as GPS spoofing and coordinated claim manipulation.

## 📁 Folder Structure

* `client/` - mobile SDK and client packages
* `frontend/` - React web app and UI
* `server/` - backend API, services, and models
* `docs/` - architecture, submission notes, and pitch deck assets
* `packages/` - reusable libraries and SDKs

**Live frontend:** https://trustshield-ai-frontend.vercel.app/

---

## ⚠️ Problem Statement

Current parametric insurance platforms rely heavily on **GPS-based verification**, which is fundamentally insecure in adversarial environments.

Fraud rings exploit this by:

* Spoofing location to high-risk zones
* Coordinating mass claims
* Draining liquidity pools

👉 GPS alone is unreliable in adversarial environments and can be easily manipulated, making single-source verification systems fundamentally insecure.

This creates a critical need for a **multi-layer fraud-resistant system**.

---

## 👥 Target Users

* Gig workers (delivery partners, riders)
* Insurance providers offering parametric coverage
* Platforms managing real-time risk-based payouts

---

## 🛡️ Core Solution

TrustShield AI replaces single-point trust with **multi-modal verification and intelligence**.

### 🔍 Multi-Layer Verification

* GPS + Cell Tower + IP triangulation
* Sensor-based motion validation
* Network telemetry analysis

### 🤖 AI/ML Intelligence

* Anomaly detection (Isolation Forest)
* Behavioral modeling
* Trajectory validation using sequence models

### 🕸️ Graph-Based Fraud Detection

* User-device-IP graph modeling
* Community detection (Louvain clustering)
* Synchronized claim detection

---

## ⚖️ Risk Scoring Engine

Each claim is evaluated using a composite risk model:

```
Risk Score = Location + Device + Behavior + Network + Cluster Risk
```

### Decision Strategy:

* 🟢 Low Risk → Instant payout
* 🟡 Medium Risk → Soft verification
* 🔴 High Risk → Manual review

---

## 🧪 End-to-End Flow

1. User submits claim
2. Multi-signal data collected (GPS, sensors, network)
3. Pre-filter validation (anti-spoof checks)
4. Signal fusion and consistency checks
5. ML anomaly detection
6. Graph-based fraud detection
7. Risk score computation
8. Decision (Approve / Verify / Hold)
9. Feedback loop improves system over time

---

## 🏗️ System Architecture

```
[ Mobile App ]
      │
      ▼
[ Ingestion API ]
      ▼
[ Stream Processor ]
      ▼
[ Feature Store ]
      ▼
[ Rule Engine ] + [ ML Models ]
      ▼
[ Graph Engine ]
      ▼
[ Risk Engine ]
      ▼
[ Claims Service ]
      ▼
[ Payout / Review Dashboard ]
```

---

## 🔐 Adversarial Defense & Anti-Spoofing Strategy

### 🔍 Differentiation Engine

* Multi-source validation (GPS + Cell + IP)
* Motion and trajectory consistency analysis
* ML-based anomaly detection

### 📊 Data Signals

* Device fingerprinting & integrity checks
* Network behavior and latency patterns
* Environmental validation (weather + traffic)
* Historical user movement patterns

### 🕸️ Fraud Ring Detection

* Spatial-temporal clustering
* Graph-based community detection
* Synchronized claim behavior analysis

### ⚖️ UX Balance (Fairness Layer)

* Risk-based claim processing
* Soft verification (no harsh rejection)
* Human-in-the-loop review
* Transparent feedback to users

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Tailwind CSS

### Backend

* Node.js
* Express.js

### Database

* MongoDB

### Intelligence Layer

* Machine Learning (Isolation Forest, LSTM)
* Graph Algorithms (Louvain Clustering)

## 🧩 Dependencies

### Frontend
* React 18
* Vite
* Tailwind CSS
* React Router DOM
* Recharts
* React Three Fiber
* Framer Motion
* jsPDF
* Razorpay SDK

### Backend
* Express 5
* Mongoose
* dotenv
* bcryptjs
* jsonwebtoken
* cors
* morgan
* node-cron
* Razorpay SDK
* Google GenAI
* Resend email SDK

### Workspace tooling
* concurrently

## 🎥 Demo Video

👉 [Watch Demo](https://docs.google.com/videos/d/1GwxiW2muhRkE2_4rlvMHfPnY7gVCtzMD9K3o23xG4Gs/play)

---

## 📊 Pitch Deck

👉 [View Pitch Deck](docs/TrustShield-AI-Final-Pitch-Deck.pdf)

## 🚀 Phase 3 Deliverables

* GitHub repository access is available at: https://github.com/Arpan-jain001/trustshield-ai
* Pitch deck is uploaded and linked under the `Pitch Deck` section
* Recorded demo video is linked under the `Demo Video` section
* Complete source code is available with dependencies and clear local run instructions
* Backend is hosted on Render and frontend is hosted on Vercel

## 📦 Source Code

Complete source code for frontend, backend, and shared packages is available in this repository.

* GitHub repository: https://github.com/Arpan-jain001/trustshield-ai
* Backend deployment: Render
* Frontend deployment: Vercel - https://trustshield-ai-frontend.vercel.app/
* `.env.example` is included at the repository root and `frontend/.env.example` is included for frontend config

## ⚙️ How to Run Locally

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Arpan-jain001/trustshield-ai.git
cd trustshield-ai
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Setup Environment Variables

Create a `.env` file in the repository root (`e:\trustshield-ai\.env`). Do not commit `.env` to GitHub.

Create a `.env.example` file with placeholder values and commit that file instead.

Create a `frontend/.env` file from `frontend/.env.example` for frontend-specific variables.

Root backend `.env` example:

```env
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
EMAIL_FROM=no-reply@trustshield.ai
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
SUPPORT_EMAIL=support@example.com
PAYMENT_GATEWAY=RAZORPAY_TEST
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
RESEND_API_KEY=your_resend_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
IPGEOLOCATION_API_KEY=your_ipgeolocation_api_key
AQI_API_KEY=your_aqi_api_key
NODE_ENV=development
PORT=5000
```

Frontend `.env.example` is available at `frontend/.env.example` and should include:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SUPPORT_EMAIL=support@example.com
VITE_SITE_URL=http://localhost:5173
```

### 4️⃣ Run Backend

```bash
npm run server
```

### 5️⃣ Run Frontend

```bash
npm run frontend
```

### 6️⃣ Run Both Locally

```bash
npm run dev
```

---

## Phase 3 Additions (Scale and Optimize)

* Advanced fraud scoring for delivery-focused scenarios (GPS inconsistency pressure, weather mismatch, coordinated claim spikes)
* Simulated instant payout pipeline with transaction metadata (gateway, transaction ID, status, processing time)
* Worker dashboard payout visibility with payout SLA and transaction trace
* Insurer intelligence panels: loss ratio, next-week disruption risk band, payout SLA trend, fraud pressure
* Final submission package scaffold in [docs/phase3-final-submission.md](docs/phase3-final-submission.md)

## Additional Environment Variables

```env
PAYMENT_GATEWAY=RAZORPAY_TEST
RAZORPAY_KEY_ID=your-razorpay-test-key-id
RAZORPAY_KEY_SECRET=your-razorpay-test-key-secret
```

---

## 📊 Key Highlights

* ✅ Multi-modal trust architecture
* ✅ AI-driven fraud detection
* ✅ Graph intelligence for coordinated attacks
* ✅ ⚡ Real-time decision system (<2–5 seconds)
* ✅ Fair and user-centric design

---

## 🚀 Future Scope

* Real-time deployment with live weather APIs
* Mobile app for gig workers
* Continuous ML model retraining pipelines
* Blockchain-based transparency for payouts
* Expansion to multi-risk insurance coverage

---

## 🏆 Why TrustShield AI?

TrustShield AI is not just an insurance platform — it is a **trust-aware intelligent system** designed to operate under real-world adversarial conditions.

It ensures:

* Fraud prevention at scale
* Instant support for genuine users
* Long-term system sustainability

---

## 👨‍💻 Built With

React.js, Tailwind CSS, Node.js, Express.js, MongoDB, REST APIs, Machine Learning, Graph Algorithms
