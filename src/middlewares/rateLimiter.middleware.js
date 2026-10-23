import rateLimit from "express-rate-limit"

// Auth route rate limiter (max 20 requests per 15 minutes)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
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

// General API rate limiter (max 300 requests per 15 minutes)
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

// Upload route rate limiter (max 20 uploads per hour)
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
