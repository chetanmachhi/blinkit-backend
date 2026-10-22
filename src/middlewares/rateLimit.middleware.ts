import rateLimit from "express-rate-limit";

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    showMessage: true,
    message: "Too many requests, please try again later",
  },
});

export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    const phone =
      (req.body as Record<string, string>)?.phone || "unknown";
    const ip = req.ip || "unknown";
    return `${phone}:${ip}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    showMessage: true,
    message: "Too many OTP requests, please try again later",
  },
});
