const express = require("express");

const {
    createWallet,
    getWallet,
    deposit,
    withdraw
} = require("../controllers/walletController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createWallet);

router.get("/", authMiddleware, getWallet);

router.post("/deposit", authMiddleware, deposit);

router.post("/withdraw", authMiddleware, withdraw);

module.exports = router;