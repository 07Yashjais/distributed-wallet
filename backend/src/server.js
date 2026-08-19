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


// =====================================================
// CORS
// =====================================================

const allowedOrigins = [
    "https://distributed-wallet-4p74.vercel.app",
    "https://distributed-wallet.vercel.app"
];

app.use((req, res, next) => {

    res.setHeader(
        "Access-Control-Allow-Origin",
        allowedOrigin
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Idempotency-Key, X-Requested-With, Accept"
    );

    res.setHeader(
        "Access-Control-Allow-Credentials",
        "true"
    );

    res.setHeader(
        "Access-Control-Max-Age",
        "86400"
    );

    // Handle browser preflight request
    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }

    next();
});


// =====================================================
// BODY PARSER
// =====================================================

app.use(express.json());


// =====================================================
// API ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

app.use("/api/wallet", walletRoutes);

app.use("/api/transfers", transferRoutes);

app.use("/api/transactions", transactionRoutes);


// =====================================================
// HEALTH CHECK
// =====================================================

app.use("/health", healthRoutes);


// =====================================================
// ROOT ROUTE
// =====================================================

app.get("/", (req, res) => {

    res.json({
        message: "Distributed Wallet API is running",
        status: "ok"
    });

});


// =====================================================
// SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

let server;


// =====================================================
// START SERVER
// =====================================================

const startServer = async () => {

    try {

        console.log("Starting Distributed Wallet backend...");

        // PostgreSQL
        await connectDB();

        // Kafka
        await connectKafka();

        // Start Express
        server = app.listen(PORT, () => {

            console.log(
                `Server running on port ${PORT}`
            );

            console.log(
                `CORS allowed origin: ${allowedOrigin}`
            );

        });

    } catch (error) {

        console.error(
            "Server startup failed:",
            error.message
        );

        process.exit(1);
    }
};


// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

const shutdown = async (signal) => {

    console.log(
        `${signal} received. Shutting down...`
    );

    // Server hasn't started
    if (!server) {

        process.exit(0);

    }

    server.close(async () => {

        try {

            // Close PostgreSQL
            await pool.end();

            // Close Redis
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


// =====================================================
// PROCESS SIGNALS
// =====================================================

process.on(
    "SIGTERM",
    () => shutdown("SIGTERM")
);

process.on(
    "SIGINT",
    () => shutdown("SIGINT")
);


// =====================================================
// START
// =====================================================

startServer();