const Redis = require("ioredis");

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redisOptions = {
    maxRetriesPerRequest: null,
    retryStrategy(times) {
        return Math.min(times * 100, 3000);
    }
};

if (process.env.REDIS_TLS === "true" || redisUrl.startsWith("rediss://")) {
    redisOptions.tls = {
        rejectUnauthorized: false
    };
}

const redis = new Redis(redisUrl, redisOptions);

redis.on("connect", () => {
    console.log("Redis connected");
});

redis.on("ready", () => {
    console.log("Redis ready");
});

redis.on("error", (error) => {
    console.error("Redis connection error:", error.message);
});

module.exports = redis;