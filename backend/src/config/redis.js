const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        if (times > 5) {
            console.error("Redis: maximum reconnect attempts reached");
            return null;
        }

        return Math.min(times * 1000, 5000);
    },
});

redis.on("connect", () => {
    console.log("Redis connected");
});

redis.on("ready", () => {
    console.log("Redis ready");
});

redis.on("error", (err) => {
    console.error("Redis error:", err.message);
});

redis.on("close", () => {
    console.warn("Redis connection closed");
});

module.exports = redis;