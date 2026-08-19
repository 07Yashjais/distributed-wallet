const express = require("express");
const { pool } = require("../config/db");
const redis = require("../config/redis");

const router = express.Router();

router.get("/", async (req, res) => {
    let database = "down";
    let redisStatus = "down";

    try {
        await pool.query("SELECT 1");
        database = "up";
    } catch (error) {
        console.error("Health DB check:", error.message);
    }

    try {
        await redis.ping();
        redisStatus = "up";
    } catch (error) {
        console.error("Health Redis check:", error.message);
    }

    const healthy =
        database === "up" &&
        redisStatus === "up";

    res.status(200).json({
        status: healthy ? "healthy" : "degraded",
        services: {
            api: "up",
            database,
            redis: redisStatus,
            kafka: "up"
        },
        timestamp: new Date().toISOString()
    });
});

module.exports = router;