import rateLimit from "express-rate-limit"

// Strict limiter for auth routes — prevents brute-force attacks on login/register
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: {
        statusCode: 429,
        message: "Too many requests from this IP, please try again after 15 minutes",
        success: false,
        data: null,
        errors: []
    },
    standardHeaders: true, // Return rate limit info in RateLimit-* headers
    legacyHeaders: false
})

// General API limiter — applied globally to all routes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: {
        statusCode: 429,
        message: "Too many requests from this IP, please try again after 15 minutes",
        success: false,
        data: null,
        errors: []
    },
    standardHeaders: true,
    legacyHeaders: false
})

// Upload limiter — file upload is heavy, limit it more aggressively
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: {
        statusCode: 429,
        message: "Upload limit reached. You can upload at most 20 files per hour.",
        success: false,
        data: null,
        errors: []
    },
    standardHeaders: true,
    legacyHeaders: false
})

export { authLimiter, generalLimiter, uploadLimiter }
