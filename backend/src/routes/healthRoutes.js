const express = require("express");
const { pool } = require("../config/db");
const redis = require("../config/redis");
const { checkKafkaHealth } = require("../config/kafka");

const router = express.Router();

router.get("/", async (req, res) => {
    let database = "down";
    let redisStatus = "down";
    let kafkaStatus = "down";

    try {
        await pool.query("SELECT 1");
        database = "up";
    } catch (error) {
        console.error("Health DB check failed:", error.message);
    }

    try {
        await redis.ping();
        redisStatus = "up";
    } catch (error) {
        console.error("Health Redis check failed:", error.message);
    }

    try {
        kafkaStatus = await checkKafkaHealth();
    } catch (error) {
        console.error("Health Kafka check failed:", error.message);
    }

    const healthy =
        database === "up" &&
        redisStatus === "up" &&
        kafkaStatus === "up";

    const statusCode = healthy ? 200 : 503;

    res.status(statusCode).json({
        status: healthy ? "healthy" : "degraded",
        services: {
            api: "up",
            database,
            redis: redisStatus,
            kafka: kafkaStatus
        },
        timestamp: new Date().toISOString()
    });
});

module.exports = router;