export const requestLogger = (req, res, next) => {
    const startTime = process.hrtime();

    res.on("finish", () => {
        const diff = process.hrtime(startTime);
        const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
        const timestamp = new Date().toISOString();
        const statusCode = res.statusCode;

        console.log(
            `[${timestamp}] ${req.method} ${req.originalUrl || req.url} ${statusCode} - ${timeInMs}ms`
        );
    });

    next();
};
