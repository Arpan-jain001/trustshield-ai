# Backend (Node.js + Express)

This folder contains the backend APIs for TrustShield AI.

## Core Responsibilities

- Authentication and role-based access control
- User verification and moderation workflows
- Weekly policy creation and dynamic pricing
- Claim processing API
- Risk scoring engine
- Fraud detection logic
- AI chatbot and risk explanation endpoints
- Payout simulation and disruption automation
- Feature-store persistence and signal ingestion
- Graph-edge persistence and community clustering
- Queue processing, model artifacts, and ops telemetry

## System Architecture Support

The backend is aligned with the TrustShield AI multi-layer architecture:

1. Data Ingestion (GPS, sensors, network)
2. Signal Fusion Layer
3. ML Anomaly Detection
4. Graph-Based Fraud Detection
5. Risk Scoring Engine
6. Claim Decision System
7. Queue / Stream Processing
8. Ops Metrics and Health

The goal is real-time processing in the `2-5 second` range with adversarial resilience against spoofing and coordinated abuse.

## Tech Stack

- Node.js
- Express.js
- MongoDB
- JWT
- Gemini API
- Resend
- OpenWeather API
- IPGeolocation API
