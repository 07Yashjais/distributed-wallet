const express = require("express");

const {
    createWallet,
    getWallet,
    deposit,
    withdraw
} = require("../controllers/walletController");

const authMiddleware = require("../middleware/authMiddleware");
const { createRateLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

const walletLimiter = createRateLimiter({
    windowSeconds: 60,
    maxRequests: 30,
    keyPrefix: "rate-limit-wallet"
});

router.post("/", authMiddleware, createWallet);

router.get("/", authMiddleware, getWallet);

router.post("/deposit", authMiddleware, walletLimiter, deposit);

router.post("/withdraw", authMiddleware, walletLimiter, withdraw);

module.exports = router;