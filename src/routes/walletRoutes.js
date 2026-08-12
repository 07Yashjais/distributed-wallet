const express = require("express");

const {
    createWallet,
    getWallet,
    deposit
} = require("../controllers/walletController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createWallet);

router.get("/", authMiddleware, getWallet);

router.post("/deposit", authMiddleware, deposit);

module.exports = router;