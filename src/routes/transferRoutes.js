const express = require("express");

const { transfer } = require("../controllers/transferController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, transfer);

module.exports = router;