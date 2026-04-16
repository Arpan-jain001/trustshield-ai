# TrustShield Mobile SDK

Lightweight client for mobile or edge apps that want to send TrustShield worker signals into the backend.

## Usage

```js
import { TrustShieldMobileSDK } from "@trustshield/mobile-sdk";

const sdk = new TrustShieldMobileSDK({
  baseUrl: "http://localhost:5000",
  token: "<worker-jwt>",
  deviceFingerprint: "android-device-001"
});

await sdk.queueSignals({
  networkLatencyMs: 95,
  speedKph: 28,
  sensorMotion: "NORMAL_MOTION",
  trafficContext: "NORMAL_FLOW",
  gpsCoordinates: { latitude: 28.6139, longitude: 77.209 },
  cellTowerCoordinates: { latitude: 28.6144, longitude: 77.2086 },
  ipCoordinates: { latitude: 28.622, longitude: 77.215 }
});
```
