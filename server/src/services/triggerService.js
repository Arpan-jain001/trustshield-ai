import { SystemAlert } from "../models/SystemAlert.js";
import { env } from "../config/env.js";

const citySignals = {
  delhi: { rainfall: 34, aqi: 322, curfew: false },
  mumbai: { rainfall: 96, aqi: 128, curfew: false },
  noida: { rainfall: 18, aqi: 286, curfew: false },
  gurugram: { rainfall: 22, aqi: 250, curfew: false },
  bangalore: { rainfall: 74, aqi: 88, curfew: false },
  lucknow: { rainfall: 14, aqi: 335, curfew: true }
};

const fallbackCoordinates = {
  delhi: { latitude: 28.6139, longitude: 77.209 },
  mumbai: { latitude: 19.076, longitude: 72.8777 },
  noida: { latitude: 28.5355, longitude: 77.391 },
  gurugram: { latitude: 28.4595, longitude: 77.0266 },
  bangalore: { latitude: 12.9716, longitude: 77.5946 },
  bengaluru: { latitude: 12.9716, longitude: 77.5946 },
  lucknow: { latitude: 26.8467, longitude: 80.9462 }
};

async function geocodeLocation(location) {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    );
    if (response.ok) {
      const data = await response.json();
      const match = data?.results?.[0];
      if (match?.latitude && match?.longitude) {
        return { latitude: match.latitude, longitude: match.longitude };
      }
    }
  } catch {
    // Fall back below
  }

  return fallbackCoordinates[location.toLowerCase()] || fallbackCoordinates.delhi;
}

async function fetchLiveDisruptionSignalsForCoordinates(coordinates, locationLabel) {
  if (env.openWeatherApiKey) {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.latitude}&lon=${coordinates.longitude}&appid=${env.openWeatherApiKey}&units=metric`;
    const airQualityUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${coordinates.latitude}&lon=${coordinates.longitude}&appid=${env.openWeatherApiKey}`;

    const [weatherResponse, airResponse] = await Promise.all([fetch(weatherUrl), fetch(airQualityUrl)]);
    if (weatherResponse.ok && airResponse.ok) {
      const [weatherData, airData] = await Promise.all([weatherResponse.json(), airResponse.json()]);
      const rainfall = Math.round(Number(weatherData?.rain?.["1h"] ?? weatherData?.rain?.["3h"] ?? 0) * 25);
      const pm25 = Number(airData?.list?.[0]?.components?.pm2_5 ?? 0);
      const pm10 = Number(airData?.list?.[0]?.components?.pm10 ?? 0);
      const liveAqi = Math.round(pm25 * 4 + pm10 * 1.2);

      return {
        rainfall,
        aqi: liveAqi,
        curfew: locationLabel.toLowerCase() === "lucknow" && liveAqi > 320,
        weatherCode: Number(weatherData?.weather?.[0]?.id || 0),
        source: "OPENWEATHER",
        observedAt: new Date((weatherData?.dt || Math.floor(Date.now() / 1000)) * 1000),
        forecastProbability: weatherData?.clouds?.all || 0,
        coordinates,
        weather: {
          temperatureC: Number(weatherData?.main?.temp ?? 0),
          condition: weatherData?.weather?.[0]?.main || "Unknown",
          description: weatherData?.weather?.[0]?.description || "Unknown conditions",
          precipitationMm: Number(weatherData?.rain?.["1h"] ?? weatherData?.rain?.["3h"] ?? 0),
          windKph: Number(weatherData?.wind?.speed ?? 0) * 3.6
        }
      };
    }
  }

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&current=rain,weather_code&hourly=precipitation_probability&forecast_days=1`;
  const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&hourly=us_aqi&forecast_days=1`;

  const [weatherResponse, airResponse] = await Promise.all([fetch(weatherUrl), fetch(airQualityUrl)]);
  if (!weatherResponse.ok || !airResponse.ok) {
    throw new Error("Live disruption feed unavailable");
  }

  const [weatherData, airData] = await Promise.all([weatherResponse.json(), airResponse.json()]);
  const rainfall = Math.round(Number(weatherData?.current?.rain ?? 0) * 14);
  const aqiSeries = airData?.hourly?.us_aqi || [];
  const liveAqi = Math.round(Number(aqiSeries.find((value) => typeof value === "number") ?? 0));
  const forecastPrecipitation = weatherData?.hourly?.precipitation_probability || [];
  const probability = Math.max(...forecastPrecipitation.slice(0, 6).map((value) => Number(value) || 0), 0);

  return {
    rainfall,
    aqi: liveAqi,
    curfew: locationLabel.toLowerCase() === "lucknow" && liveAqi > 320,
    weatherCode: Number(weatherData?.current?.weather_code || 0),
    source: "OPEN_METEO",
    observedAt: new Date(),
    forecastProbability: probability,
    coordinates,
    weather: {
      temperatureC: Number(weatherData?.current?.temperature_2m ?? weatherData?.current?.temperature ?? 0),
      condition: `Code ${Number(weatherData?.current?.weather_code || 0)}`,
      description: "Open-Meteo current conditions",
      precipitationMm: Number(weatherData?.current?.rain ?? 0),
      windKph: Number(weatherData?.current?.wind_speed_10m ?? 0)
    }
  };
}

async function fetchLiveDisruptionSignals(location) {
  const coordinates = await geocodeLocation(location);
  return fetchLiveDisruptionSignalsForCoordinates(coordinates, location);
}

export async function getDisruptionSignals(location) {
  try {
    const liveSignals = await fetchLiveDisruptionSignals(location);
    return {
      ...liveSignals,
      location,
      shouldTrigger: liveSignals.rainfall > 80 || liveSignals.aqi > 300 || liveSignals.curfew
    };
  } catch {
    const key = location.toLowerCase();
    const match = citySignals[key] || {
      rainfall: 20 + Math.round(Math.random() * 60),
      aqi: 110 + Math.round(Math.random() * 240),
      curfew: Math.random() > 0.78
    };

    return {
      ...match,
      location,
      source: "FALLBACK_SIGNAL_MODEL",
      weatherCode: 0,
      observedAt: new Date(),
      coordinates: fallbackCoordinates[key] || fallbackCoordinates.delhi,
      shouldTrigger: match.rainfall > 80 || match.aqi > 300 || match.curfew
    };
  }
}

export async function getDisruptionSignalsFromCoordinates({ latitude, longitude, locationLabel = "Live device location" }) {
  try {
    const liveSignals = await fetchLiveDisruptionSignalsForCoordinates({ latitude, longitude }, locationLabel);
    return {
      ...liveSignals,
      location: locationLabel,
      shouldTrigger: liveSignals.rainfall > 80 || liveSignals.aqi > 300 || liveSignals.curfew
    };
  } catch {
    return {
      ...(await getDisruptionSignals(locationLabel)),
      coordinates: { latitude, longitude },
      location: locationLabel
    };
  }
}

export async function createPredictiveAlert(user) {
  const signals = await getDisruptionSignals(user.location);
  const message =
    signals.rainfall > 70
      ? "Heavy rain expected tomorrow. Consider extending coverage hours."
      : signals.aqi > 250
        ? "Air quality could disrupt deliveries tomorrow. Keep policy active."
        : "No major disruption predicted, but keep weekly protection active.";

  return SystemAlert.create({
    user: user._id,
    title: "Predictive alert",
    message,
    severity: signals.rainfall > 70 || signals.aqi > 250 ? "WARN" : "INFO"
  });
}
