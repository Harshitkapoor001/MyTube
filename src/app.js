import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { requestLogger } from "./middlewares/logger.middleware.js"

const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(requestLogger)
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


// Routes import
import userRoutes from "./routes/user.routes.js"
import videoRoutes from "./routes/video.routes.js"
import healthcheckRoutes from "./routes/healthcheck.routes.js"

// Routes declaration
app.use("/health", healthcheckRoutes)
app.use("/api/v1/healthcheck", healthcheckRoutes)
app.use("/api/v1/users",userRoutes)
app.use("/api/v1/videos",videoRoutes)

// Global error-handling middleware — must have exactly 4 params for Express to treat it as an error handler
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