import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { requestLogger } from "./middlewares/logger.middleware.js"
import { generalLimiter, authLimiter, uploadLimiter } from "./middlewares/rateLimiter.middleware.js"

const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(requestLogger)
// Global rate limiter
app.use(generalLimiter)
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


// Routes import
import userRoutes from "./routes/user.routes.js"
import videoRoutes from "./routes/video.routes.js"
import commentRoutes from "./routes/comment.routes.js"
import likeRoutes from "./routes/like.routes.js"
import subscriptionRoutes from "./routes/subscription.routes.js"
import playlistRoutes from "./routes/playlist.routes.js"
import tweetRoutes from "./routes/tweet.routes.js"
import dashboardRoutes from "./routes/dashboard.routes.js"
import healthcheckRoutes from "./routes/healthcheck.routes.js"

// Routes declaration
app.use("/health", healthcheckRoutes)
app.use("/api/v1/healthcheck", healthcheckRoutes)
// User routes with auth rate limiter
app.use("/api/v1/users", authLimiter, userRoutes)
// Video routes with upload rate limiter
app.use("/api/v1/videos", uploadLimiter, videoRoutes)
app.use("/api/v1/comments",commentRoutes)
app.use("/api/v1/likes",likeRoutes)
app.use("/api/v1/subscriptions",subscriptionRoutes)
app.use("/api/v1/playlist",playlistRoutes)
app.use("/api/v1/tweets",tweetRoutes)
app.use("/api/v1/dashboard",dashboardRoutes)

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500
    const message = err.message || "Internal Server Error"

    return res.status(statusCode).json({
        statusCode,
        message,
        success: false,
        errors: err.errors || [],
        data: null
    })
})

export {app}