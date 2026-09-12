const redis = require("../config/redis");

const createRateLimiter = ({
    windowSeconds = 60,
    maxRequests = 30,
    keyPrefix = "rate-limit"
} = {}) => {
    return async (req, res, next) => {
        try {
            const identifier =
                req.user?.userId ||
                req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
                req.ip ||
                "anonymous";

            const key = `${keyPrefix}:${identifier}`;

            const requests = await redis.incr(key);

            if (requests === 1) {
                await redis.expire(key, windowSeconds);
            }

            if (requests > maxRequests) {
                return res.status(429).json({
                    message: "Too many requests. Please try again later.",
                    retryAfter: windowSeconds
                });
            }

            next();

        } catch (error) {
            console.error("Rate limiter error:", error.message);
            next();
        }
    };
};

const defaultLimiter = createRateLimiter();
defaultLimiter.createRateLimiter = createRateLimiter;

module.exports = defaultLimiter;