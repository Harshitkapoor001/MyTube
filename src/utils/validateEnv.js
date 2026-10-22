const REQUIRED_ENV_VARS = [
    "PORT",
    "MONGODB_URI",
    "CORS_ORIGIN",
    "ACCESS_TOKEN_SECRET",
    "ACCESS_TOKEN_EXPIRY",
    "REFRESH_TOKEN_SECRET",
    "REFRESH_TOKEN_EXPIRY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET"
];

export const validateEnv = () => {
    const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        console.error("FATAL: Missing required environment variables:");
        missing.forEach((key) => console.error(`  - ${key}`));
        throw new Error(
            `Missing ${missing.length} required environment variable(s): ${missing.join(", ")}`
        );
    }
};
