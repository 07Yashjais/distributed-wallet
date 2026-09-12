const express = require("express");

const { register, login } = require("../controllers/authController");
const { createRateLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

const authLimiter = createRateLimiter({
    windowSeconds: 60,
    maxRequests: 20,
    keyPrefix: "rate-limit-auth"
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

module.exports = router;