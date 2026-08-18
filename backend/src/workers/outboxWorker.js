require("dotenv").config();

const { pool } = require("../config/db");
const { publishEvent } = require("../config/kafka");

const BATCH_SIZE = 20;
const POLL_INTERVAL = 2000;

const processOutbox = async () => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const result = await client.query(
    `
    SELECT *
    FROM outbox_events
    WHERE status = 'PENDING'
      AND attempts < 3
    ORDER BY created_at ASC
    LIMIT $1
    FOR UPDATE SKIP LOCKED
    `,
    [BATCH_SIZE]
);

        for (const event of result.rows) {
            try {
                const payload =
                    typeof event.payload === "string"
                        ? JSON.parse(event.payload)
                        : event.payload;

                await publishEvent(
                    "wallet.transactions",
                    payload
                );

                await client.query(
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

                console.log(
                    `Outbox event processed: ${event.id}`
                );

            } catch (error) {
    console.error(
        `Failed to process event ${event.id}:`,
        error.message
    );

    const nextAttempts = event.attempts + 1;

    if (nextAttempts >= 3) {

        await client.query(
            `
            UPDATE outbox_events
            SET
                status = 'FAILED',
                attempts = $1,
                failed_at = NOW()
            WHERE id = $2
            `,
            [
                nextAttempts,
                event.id
            ]
        );

        console.error(
            `Event moved to FAILED: ${event.id}`
        );

    } else {

        await client.query(
            `
            UPDATE outbox_events
            SET attempts = $1
            WHERE id = $2
            `,
            [
                nextAttempts,
                event.id
            ]
        );

        console.log(
            `Event retry scheduled: ${event.id}, attempt ${nextAttempts}`
        );
    }
}
        }

        await client.query("COMMIT");

    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "Outbox worker error:",
            error.message
        );

    } finally {
        client.release();
    }
};

const startWorker = async () => {
    console.log("Starting outbox worker...");

    while (true) {
        await processOutbox();

        await new Promise(resolve =>
            setTimeout(resolve, POLL_INTERVAL)
        );
    }
};

startWorker();