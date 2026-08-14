const redis = require("../config/redis");

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 30;

const rateLimiter = async (req, res, next) => {
    try {
        const identifier =
            req.user?.userId ||
            req.ip;

        const key = `rate-limit:${identifier}`;

        const requests = await redis.incr(key);

        if (requests === 1) {
            await redis.expire(key, WINDOW_SECONDS);
        }

        if (requests > MAX_REQUESTS) {
            return res.status(429).json({
                message: "Too many requests",
                retryAfter: WINDOW_SECONDS
            });
        }

        next();

    } catch (error) {
        console.error("Rate limiter error:", error.message);
        next();
    }
};

module.exports = rateLimiter;