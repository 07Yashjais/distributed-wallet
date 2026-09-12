const express = require("express");
require("dotenv").config();
const cors = require("cors");

const { connectDB, pool } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const walletRoutes = require("./routes/walletRoutes");
const transferRoutes = require("./routes/transferRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const healthRoutes = require("./routes/healthRoutes");

const helmet = require("helmet");
const redis = require("./config/redis");

const app = express();

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const isProd = process.env.NODE_ENV === "production";

const configuredOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map(o => o.trim().replace(/\/$/, ""))
    .filter(Boolean);

const isOriginAllowed = (origin) => {
    if (!origin) return true;
    const clean = origin.trim().replace(/\/$/, "");

    // 1. Explicitly configured origins in CORS_ORIGIN
    if (configuredOrigins.includes(clean)) {
        return true;
    }

    // 2. Production Vercel domain & preview deployments
    if (
        clean === "https://distributed-wallet.vercel.app" ||
        clean.endsWith(".vercel.app")
    ) {
        return true;
    }

    // 3. Local development origins (localhost & 127.0.0.1 on any port)
    if (
        clean.startsWith("http://localhost:") ||
        clean.startsWith("http://127.0.0.1:") ||
        clean === "http://localhost" ||
        clean === "http://127.0.0.1"
    ) {
        return true;
    }

    // 4. Non-production wildcard fallback
    if (!isProd && configuredOrigins.includes("*")) {
        return true;
    }

    return false;
};

const corsOptions = {
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Idempotency-Key",
        "Accept",
        "Origin",
        "X-Requested-With"
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 86400
};

app.use(cors(corsOptions));

app.use(express.json());


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
    console.log(`${signal} received. Shutting down...`);

    if (!server) {
        process.exit(0);
    }

    server.close(async () => {
        try {
            // Close PostgreSQL
            await pool.end();

            // Close Redis
            await redis.quit();

            console.log("Connections closed.");

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


process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));


startServer();