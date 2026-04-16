import { env } from "../config/env.js";

const geocodeCache = new Map();

const fallbackCoordinates = {
  delhi: { latitude: 28.6139, longitude: 77.209 },
  mumbai: { latitude: 19.076, longitude: 72.8777 },
  noida: { latitude: 28.5355, longitude: 77.391 },
  gurugram: { latitude: 28.4595, longitude: 77.0266 },
  bangalore: { latitude: 12.9716, longitude: 77.5946 },
  bengaluru: { latitude: 12.9716, longitude: 77.5946 },
  lucknow: { latitude: 26.8467, longitude: 80.9462 }
};

function randomAround(base, spread = 0.02) {
  return base + (Math.random() - 0.5) * spread;
}

function normalizeIp(ipAddress) {
  if (!ipAddress) return "";
  if (ipAddress.startsWith("::ffff:")) {
    return ipAddress.slice(7);
  }
  return ipAddress === "::1" ? "" : ipAddress;
}

function isPrivateIp(ipAddress) {
  if (!ipAddress) return true;
  return /^(10\.|127\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.|169\.254\.|::1|fc00:|fd00:)/.test(ipAddress);
}

async function geocodeLocation(location) {
  const key = location.trim().toLowerCase();
  if (geocodeCache.has(key)) {
    return geocodeCache.get(key);
  }

  const fallback = fallbackCoordinates[key];

  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    );
    if (response.ok) {
      const data = await response.json();
      const match = data?.results?.[0];
      if (match?.latitude && match?.longitude) {
        const result = {
          latitude: match.latitude,
          longitude: match.longitude,
          resolvedName: [match.name, match.admin1, match.country].filter(Boolean).join(", ")
        };
        geocodeCache.set(key, result);
        return result;
      }
    }
  } catch {
    // Safe fallback below
  }

  const result = fallback
    ? {
        ...fallback,
        resolvedName: location
      }
    : {
        latitude: 28.6139,
        longitude: 77.209,
        resolvedName: location
      };

  geocodeCache.set(key, result);
  return result;
}

function toRad(value) {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(a, b) {
  if (!a || !b) return 0;
  const earthRadius = 6371;
  const dLat = toRad((b.latitude || 0) - (a.latitude || 0));
  const dLon = toRad((b.longitude || 0) - (a.longitude || 0));
  const lat1 = toRad(a.latitude || 0);
  const lat2 = toRad(b.latitude || 0);

  const angle =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  return 2 * earthRadius * Math.atan2(Math.sqrt(angle), Math.sqrt(1 - angle));
}

async function lookupIpSignal(ipAddress, fallbackLocation) {
  const normalizedIp = normalizeIp(ipAddress);
  if (!env.ipGeolocationApiKey || !normalizedIp || isPrivateIp(normalizedIp)) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.ipgeolocation.io/v3/ipgeo?apiKey=${env.ipGeolocationApiKey}&ip=${encodeURIComponent(normalizedIp)}&include=security`
    );
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const latitude = Number(data?.location?.latitude ?? data?.latitude);
    const longitude = Number(data?.location?.longitude ?? data?.longitude);
    const security = data?.security || {};

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      latitude,
      longitude,
      city: data?.location?.city || data?.city || fallbackLocation,
      security: {
        isProxy: Boolean(security.is_proxy),
        isVpn: Boolean(security.is_vpn),
        isTor: Boolean(security.is_tor),
        threatScore: Number(security.threat_score || security.threatScore || 0)
      }
    };
  } catch {
    return null;
  }
}

export async function collectVerificationSignals({ user, trigger, ipAddress, deviceFingerprint, signalPayload = {} }) {
  const baseLocation = await geocodeLocation(trigger.location || user.location);
  const ipLookup = await lookupIpSignal(ipAddress, trigger.location || user.location);

  const gpsCoords = signalPayload.gpsCoordinates || {
    latitude: randomAround(baseLocation.latitude, 0.03),
    longitude: randomAround(baseLocation.longitude, 0.03)
  };
  const cellCoords = signalPayload.cellTowerCoordinates || {
    latitude: randomAround(baseLocation.latitude, 0.06),
    longitude: randomAround(baseLocation.longitude, 0.06)
  };
  const ipCoords = signalPayload.ipCoordinates || {
    latitude: ipLookup?.latitude ?? randomAround(baseLocation.latitude, 0.12),
    longitude: ipLookup?.longitude ?? randomAround(baseLocation.longitude, 0.12)
  };

  const gpsDistance = haversineDistanceKm(gpsCoords, baseLocation);
  const cellDistance = haversineDistanceKm(cellCoords, baseLocation);
  const ipDistance = haversineDistanceKm(ipCoords, baseLocation);
  const gpsCellDistance = haversineDistanceKm(gpsCoords, cellCoords);
  const gpsIpDistance = haversineDistanceKm(gpsCoords, ipCoords);

  const latencyMs = Number(signalPayload.networkLatencyMs) || 45 + Math.round(Math.random() * 160);
  const speedKph = Number(signalPayload.speedKph) || Math.max(6, Math.round((gpsCellDistance + gpsIpDistance) * 2.3));
  const sensorMotion = signalPayload.sensorMotion || (speedKph > 35 ? "HIGH_MOTION" : speedKph > 15 ? "NORMAL_MOTION" : "LOW_MOTION");
  const trafficContext =
    signalPayload.trafficContext || (trigger.rainfall > 80 || trigger.aqi > 300 ? "DISRUPTED" : speedKph > 35 ? "FAST_MOVING" : "NORMAL_FLOW");

  const spoofFlags = [];

  if (gpsCellDistance > 8) spoofFlags.push("GPS and cell-tower position mismatch");
  if (gpsIpDistance > 20) spoofFlags.push("GPS and IP triangulation mismatch");
  if (latencyMs > 280) spoofFlags.push("Abnormal network latency");
  if (speedKph > 75 && sensorMotion !== "HIGH_MOTION") spoofFlags.push("Trajectory speed inconsistent with motion sensors");
  if (ipLookup?.security?.isProxy) spoofFlags.push("IP security flagged proxy usage");
  if (ipLookup?.security?.isVpn) spoofFlags.push("IP security flagged VPN usage");
  if (ipLookup?.security?.isTor) spoofFlags.push("IP security flagged TOR usage");

  const locationConfidence = Math.max(0, 100 - Math.round((gpsDistance + cellDistance * 0.6 + ipDistance * 0.35) * 2.8));
  const motionConfidence = Math.max(0, sensorMotion === "HIGH_MOTION" ? 92 : sensorMotion === "NORMAL_MOTION" ? 78 : 58);
  const networkPenalty = Math.round((ipLookup?.security?.threatScore || 0) * 0.45);
  const networkConfidence = Math.max(0, 100 - Math.round(latencyMs / 3) - networkPenalty);
  const deviceConfidence = user.deviceFingerprint && deviceFingerprint && user.deviceFingerprint !== deviceFingerprint ? 42 : 88;
  const spoofRisk = Math.min(100, Math.max(5, Math.round(100 - (locationConfidence * 0.45 + motionConfidence * 0.2 + networkConfidence * 0.2 + deviceConfidence * 0.15))));
  const consistencyScore = Math.max(0, 100 - spoofRisk);
  const integrityScore = Math.max(0, Math.min(100, Math.round((locationConfidence * 0.4 + motionConfidence * 0.2 + networkConfidence * 0.2 + deviceConfidence * 0.2))));

  return {
    coordinates: baseLocation,
    integrityScore,
    spoofRisk,
    consistencyScore,
    locationConfidence,
    motionConfidence,
    networkConfidence,
    deviceConfidence,
    flags: spoofFlags,
    details: {
      gpsLocation: `${gpsCoords.latitude.toFixed(4)}, ${gpsCoords.longitude.toFixed(4)}`,
      cellTowerLocation: `${cellCoords.latitude.toFixed(4)}, ${cellCoords.longitude.toFixed(4)}`,
      ipLocation: `${ipCoords.latitude.toFixed(4)}, ${ipCoords.longitude.toFixed(4)}`,
      latencyMs,
      speedKph,
      sensorMotion,
      trafficContext,
      ipCity: ipLookup?.city || trigger.location || user.location,
      ipThreatScore: ipLookup?.security?.threatScore || 0
    }
  };
}

export function evaluateAnomaly({ trigger, signalFusion, priorClaimCount }) {
  const reasons = [];
  let score = 18;

  if (signalFusion.spoofRisk > 45) {
    score += 28;
    reasons.push("Signal fusion indicates spoofing pressure");
  }
  if (trigger.aqi > 320 || trigger.rainfall > 90 || trigger.curfew) {
    score += 10;
    reasons.push("High-disruption environment changes normal delivery pattern");
  }
  if ((priorClaimCount || 0) >= 2) {
    score += 18;
    reasons.push("Repeated claim behavior in a short window");
  }
  if (signalFusion.details.speedKph > 65) {
    score += 12;
    reasons.push("Movement speed exceeds expected rider pattern");
  }

  score = Math.max(0, Math.min(100, score));
  return {
    score,
    verdict: score >= 70 ? "HIGH_ANOMALY" : score >= 45 ? "MODERATE_ANOMALY" : "LOW_ANOMALY",
    reasons
  };
}
