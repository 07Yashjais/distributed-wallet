const express = require("express");
require("dotenv").config();

const { connectDB } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const walletRoutes = require("./routes/walletRoutes");
const app = express();


app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.get("/", (req, res) => {
    res.json({
        message: "Distributed Wallet API is running"
    });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();