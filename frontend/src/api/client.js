import { frontendEnv } from "../config/env";

const API_BASE = frontendEnv.apiBaseUrl;

export async function api(path, { token, body, method = "GET" } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "x-device-fingerprint": "trustshield-web-device"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    Object.assign(error, data, { httpStatus: response.status });
    throw error;
  }
  return data;
}
