require("dotenv").config();

const { pool, connectDB } = require("../config/db");
const { publishEvent, connectKafka } = require("../config/kafka");

const BATCH_SIZE = 20;
const POLL_INTERVAL = 2000;
const MAX_ATTEMPTS = 25;

// In-memory exponential backoff schedule: eventId -> nextRetryTimeMs
const retrySchedule = new Map();

const calculateBackoffMs = (attempts) => {
    // Progressive backoff: 2s, 4s, 8s, 16s, 32s, max 60s
    return Math.min(1000 * Math.pow(2, Math.min(attempts, 6)), 60000);
};

let isShuttingDown = false;
let isFirstPoll = true;

const processOutbox = async () => {
    if (isShuttingDown) return;

    let client;
    try {
        client = await pool.connect();

        const result = await client.query(
            `
            SELECT *
            FROM outbox_events
            WHERE status = 'PENDING'
              AND attempts < $1
            ORDER BY created_at ASC
            LIMIT $2
            `,
            [MAX_ATTEMPTS, BATCH_SIZE]
        );

        client.release();
        client = null;

        if (isFirstPoll) {
            console.log(`Outbox worker active. Polling outbox_events (${result.rows.length} pending found).`);
            isFirstPoll = false;
        }

        for (const event of result.rows) {
            if (isShuttingDown) break;

            // Check if this event is waiting on exponential backoff
            const nextRetryTime = retrySchedule.get(event.id) || 0;
            if (Date.now() < nextRetryTime) {
                continue;
            }

            // Parse payload - permanent failure if unparseable
            let payload;
            try {
                payload =
                    typeof event.payload === "string"
                        ? JSON.parse(event.payload)
                        : event.payload;

                if (!payload || typeof payload !== "object") {
                    throw new Error("Payload is not a valid JSON object");
                }
            } catch (parseError) {
                console.error(
                    `Permanent failure: corrupt payload for event ${event.id}:`,
                    parseError.message
                );

                await pool.query(
                    `
                    UPDATE outbox_events
                    SET
                        status = 'FAILED',
                        failed_at = NOW()
                    WHERE id = $1
                    `,
                    [event.id]
                );
                retrySchedule.delete(event.id);
                continue;
            }

            try {
                await publishEvent(
                    "wallet.transactions",
                    payload
                );

                await pool.query(
                    `
                    UPDATE outbox_events
                    SET
                        status = 'PROCESSED',
                        processed_at = NOW(),
                        attempts = attempts + 1
                    WHERE id = $1
                    `,
                    [event.id]
                );

                retrySchedule.delete(event.id);

                console.log(
                    `Outbox event processed: ${event.id}`
                );

            } catch (error) {
                console.error(
                    `Temporary Kafka publish failure for event ${event.id}:`,
                    error.message
                );

                const nextAttempts = event.attempts + 1;
                const backoffMs = calculateBackoffMs(nextAttempts);
                retrySchedule.set(event.id, Date.now() + backoffMs);

                if (nextAttempts >= MAX_ATTEMPTS) {
                    await pool.query(
                        `
                        UPDATE outbox_events
                        SET
                            status = 'FAILED',
                            attempts = $1,
                            failed_at = NOW()
                        WHERE id = $2
                        `,
                        [nextAttempts, event.id]
                    );

                    retrySchedule.delete(event.id);

                    console.error(
                        `Event reached max attempts (${MAX_ATTEMPTS}), moved to FAILED: ${event.id}`
                    );
                } else {
                    // Keep status PENDING for temporary outages
                    await pool.query(
                        `
                        UPDATE outbox_events
                        SET attempts = $1
                        WHERE id = $2
                        `,
                        [nextAttempts, event.id]
                    );

                    console.log(
                        `Event kept PENDING. Retry scheduled: ${event.id}, attempt ${nextAttempts}/${MAX_ATTEMPTS} in ${backoffMs / 1000}s`
                    );
                }
            }
        }

    } catch (error) {
        console.error(
            "Outbox worker query error:",
            error.message
        );
    } finally {
        if (client) {
            client.release();
        }
    }
};

const { producer } = require("../config/kafka");

const startWorker = async (maxStartupRetries = 10, startupDelayMs = 2000) => {
    console.log("Starting outbox worker with resilient retry...");

    // 1. Verify PostgreSQL connection
    for (let attempt = 1; attempt <= maxStartupRetries; attempt++) {
        try {
            await connectDB();
            break;
        } catch (err) {
            console.warn(`[Outbox Worker] Database connection attempt ${attempt}/${maxStartupRetries} failed: ${err.message}`);
            if (attempt === maxStartupRetries) {
                console.error("[Outbox Worker] Database connection failed permanently:", err.message);
                console.error(err.stack);
                process.exit(1);
            }
            await new Promise(res => setTimeout(res, startupDelayMs));
        }
    }

    // 2. Verify Kafka connection
    for (let attempt = 1; attempt <= maxStartupRetries; attempt++) {
        try {
            await connectKafka();
            break;
        } catch (err) {
            console.warn(`[Outbox Worker] Kafka producer connection attempt ${attempt}/${maxStartupRetries} failed: ${err.message}`);
            if (attempt === maxStartupRetries) {
                console.error("[Outbox Worker] Kafka connection failed permanently:", err.message);
                console.error(err.stack);
                process.exit(1);
            }
            await new Promise(res => setTimeout(res, startupDelayMs));
        }
    }

    console.log("Outbox worker initialized and monitoring outbox events...");

    while (!isShuttingDown) {
        try {
            await processOutbox();
        } catch (err) {
            console.error("Outbox worker iteration error:", err.message);
            console.error(err.stack);
        }

        if (isShuttingDown) break;

        await new Promise(resolve =>
            setTimeout(resolve, POLL_INTERVAL)
        );
    }
};

const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`${signal} received. Stopping outbox worker gracefully...`);
    try {
        if (producer) {
            await producer.disconnect();
            console.log("Kafka producer disconnected cleanly.");
        }
    } catch (err) {
        console.error("Error disconnecting Kafka producer:", err.message);
    }

    try {
        await pool.end();
        console.log("Database pool closed cleanly.");
    } catch (err) {
        console.error("Error during outbox worker pool shutdown:", err.message);
    }
    process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startWorker().catch(err => {
    console.error("Fatal error during outbox worker startup:", err.message);
    console.error(err.stack);
    process.exit(1);
});