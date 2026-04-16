import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

const configWarnings = [];
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "trustshield-super-secret" || process.env.JWT_SECRET === "change-me") {
  configWarnings.push("JWT_SECRET is using a weak default. Replace it for production.");
}
if (!process.env.MONGODB_URI) {
  configWarnings.push("MONGODB_URI is missing.");
}
if (!process.env.CLIENT_URL) {
  configWarnings.push("CLIENT_URL is missing.");
}
if (!process.env.EMAIL_FROM) {
  configWarnings.push("EMAIL_FROM is missing.");
}
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  configWarnings.push("ADMIN_EMAIL or ADMIN_PASSWORD is missing.");
}
if (!process.env.SUPPORT_EMAIL) {
  configWarnings.push("SUPPORT_EMAIL is missing.");
}
if (process.env.NODE_ENV === "production" && !process.env.RESEND_API_KEY) {
  configWarnings.push("RESEND_API_KEY is missing in production.");
}
if (process.env.NODE_ENV === "production" && !process.env.OPENWEATHER_API_KEY && !process.env.WEATHER_API_KEY) {
  configWarnings.push("Weather API key is missing in production.");
}
if (process.env.NODE_ENV === "production" && !process.env.IPGEOLOCATION_API_KEY) {
  configWarnings.push("IPGEOLOCATION_API_KEY is missing in production.");
}

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  aiProvider: process.env.AI_PROVIDER || "GEMINI",
  geminiApiKey: process.env.GEMINI_API_KEY,
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  supportEmail: process.env.SUPPORT_EMAIL,
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY || process.env.WEATHER_API_KEY,
  ipGeolocationApiKey: process.env.IPGEOLOCATION_API_KEY,
  weatherApiKey: process.env.WEATHER_API_KEY,
  aqiApiKey: process.env.AQI_API_KEY,
  paymentGateway: process.env.PAYMENT_GATEWAY,
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  enableSchedulers: process.env.ENABLE_SCHEDULERS !== "false",
  configWarnings
};
