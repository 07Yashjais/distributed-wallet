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

app.use(helmet());

const isProd = process.env.NODE_ENV === "production";

const allowedOrigins = (process.env.CORS_ORIGIN || (isProd ? "" : "http://localhost:5173"))
    .split(",")
    .map(o => o.trim().replace(/\/$/, ""))
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests without Origin (like curl, mobile apps, server-to-server)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || (!isProd && allowedOrigins.includes("*"))) {
            return callback(null, true);
        }

        // Return false to deny CORS cleanly without throwing a 500 Error
        return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Idempotency-Key"
    ],
    credentials: true
}));

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