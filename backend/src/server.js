const express = require("express");
require("dotenv").config();

const { connectDB, pool } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const walletRoutes = require("./routes/walletRoutes");
const transferRoutes = require("./routes/transferRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const healthRoutes = require("./routes/healthRoutes");

const redis = require("./config/redis");
const { connectKafka } = require("./config/kafka");
const app = express();

app.use(express.json());

app.use((req, res, next) => {
    const origin = process.env.CORS_ORIGIN === "*"
        ? "*"
        : (process.env.CORS_ORIGIN || req.headers.origin || "http://localhost:5173");
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Idempotency-Key");
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});


app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/transactions", transactionRoutes);

app.use("/health", healthRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Distributed Wallet API is running"
    });
});

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
    try {
        await connectDB();

        await connectKafka();
       

        server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error(
            "Server startup failed:",
            error.message
        );

        process.exit(1);
    }
};


const shutdown = async (signal) => {

    console.log(
        `${signal} received. Shutting down...`
    );

    if (!server) {
        process.exit(0);
    }

    server.close(async () => {

        try {

            await pool.end();

            await redis.quit();

            console.log(
                "Connections closed."
            );

            process.exit(0);

        } catch (error) {

            console.error(
                "Shutdown error:",
                error.message
            );

            process.exit(1);
        }
    });
};

process.on(
    "SIGTERM",
    () => shutdown("SIGTERM")
);

process.on(
    "SIGINT",
    () => shutdown("SIGINT")
);


startServer();