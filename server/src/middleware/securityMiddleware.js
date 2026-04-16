const buckets = new Map();

function getIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")?.[0]?.trim() || req.ip || "unknown-ip";
}

export function securityHeadersMiddleware(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(self), microphone=(), camera=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  next();
}

export function rateLimitMiddleware({ windowMs = 60_000, max = 120 } = {}) {
  return (req, res, next) => {
    const ip = getIp(req);
    const key = `${ip}:${req.path}`;
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    buckets.set(key, current);

    if (current.count > max) {
      res.setHeader("Retry-After", Math.ceil((current.resetAt - now) / 1000));
      return res.status(429).json({ message: "Too many requests. Please try again shortly." });
    }

    next();
  };
}
