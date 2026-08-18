const express = require("express");

const { transfer } = require("../controllers/transferController");

const authMiddleware = require("../middleware/authMiddleware");

const rateLimiter = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/", authMiddleware,rateLimiter, transfer);

module.exports = router;