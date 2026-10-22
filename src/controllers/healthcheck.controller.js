import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getDbState = (state) => {
    switch (state) {
        case 0:
            return "disconnected";
        case 1:
            return "connected";
        case 2:
            return "connecting";
        case 3:
            return "disconnecting";
        default:
            return "unknown";
    }
};

export const healthcheck = asyncHandler(async (req, res) => {
    const healthData = {
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: `${process.uptime().toFixed(2)}s`,
        database: {
            state: getDbState(mongoose.connection.readyState),
            host: mongoose.connection.host || "unknown"
        }
    };

    return res
        .status(200)
        .json(new ApiResponse(200, healthData, "Health check passed"));
});
