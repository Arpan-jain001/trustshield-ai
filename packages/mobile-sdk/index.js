export class TrustShieldMobileSDK {
  constructor({ baseUrl, token, deviceFingerprint }) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = token;
    this.deviceFingerprint = deviceFingerprint || "trustshield-mobile-sdk";
  }

  async post(path, body) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
        "x-device-fingerprint": this.deviceFingerprint
      },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "SDK request failed");
    }
    return data;
  }

  ingestSignals(payload) {
    return this.post("/api/user/signals/ingest", payload);
  }

  queueSignals(payload) {
    return this.post("/api/user/signals/queue", payload);
  }

  createClaim(payload = {}) {
    return this.post("/api/claim/create", { signalPayload: payload });
  }
}
