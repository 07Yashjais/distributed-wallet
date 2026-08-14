const { v4: uuidv4 } = require("uuid");
const { pool } = require("../config/db");
const rateLimiter = require("../middleware/rateLimiter");

const transfer = async (req, res) => {
    const client = await pool.connect();

    try {
        const senderUserId = req.user.userId;
        const { receiverWalletId, amount } = req.body;

        // -----------------------------
        // 1. Get idempotency key
        // -----------------------------

        const idempotencyKey = req.headers["idempotency-key"];

        if (!idempotencyKey) {
            return res.status(400).json({
                message: "Idempotency-Key header is required"
            });
        }

        if (idempotencyKey.length > 255) {
            return res.status(400).json({
                message: "Idempotency-Key is too long"
            });
        }

        // -----------------------------
        // 2. Validate request
        // -----------------------------

        if (!receiverWalletId || amount === undefined) {
            return res.status(400).json({
                message: "Receiver wallet and amount are required"
            });
        }

        const transferAmount = Number(amount);

        if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than zero"
            });
        }

        // -----------------------------
        // 3. Find sender wallet
        // -----------------------------

        const senderResult = await client.query(
            `SELECT id
             FROM wallets
             WHERE user_id = $1`,
            [senderUserId]
        );

        if (senderResult.rows.length === 0) {
            return res.status(404).json({
                message: "Sender wallet not found"
            });
        }

        const senderWalletId = senderResult.rows[0].id;

        if (senderWalletId === receiverWalletId) {
            return res.status(400).json({
                message: "Cannot transfer to the same wallet"
            });
        }

        // -----------------------------
        // 4. Start DB transaction
        // -----------------------------

        await client.query("BEGIN");

        // -----------------------------
        // 5. Check idempotency
        // -----------------------------

        const existingTransaction = await client.query(
            `SELECT
                id,
                reference_id,
                transaction_type,
                status
             FROM transactions
             WHERE idempotency_key = $1
             FOR UPDATE`,
            [idempotencyKey]
        );

        if (existingTransaction.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(200).json({
                message: "Transaction already processed",
                transaction: existingTransaction.rows[0]
            });
        }

        // -----------------------------
        // 6. Lock both wallets
        // -----------------------------

        const walletIds = [
            senderWalletId,
            receiverWalletId
        ].sort();

        const walletsResult = await client.query(
            `SELECT id, balance
             FROM wallets
             WHERE id = ANY($1::uuid[])
             ORDER BY id
             FOR UPDATE`,
            [walletIds]
        );

        if (walletsResult.rows.length !== 2) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Receiver wallet not found"
            });
        }

        const sender = walletsResult.rows.find(
            wallet => wallet.id === senderWalletId
        );

        const receiver = walletsResult.rows.find(
            wallet => wallet.id === receiverWalletId
        );

        // -----------------------------
        // 7. Check balance
        // -----------------------------

        if (Number(sender.balance) < transferAmount) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Insufficient balance"
            });
        }

        // -----------------------------
        // 8. Debit sender
        // -----------------------------

        await client.query(
            `UPDATE wallets
             SET balance = balance - $1
             WHERE id = $2`,
            [transferAmount, senderWalletId]
        );

        // -----------------------------
        // 9. Credit receiver
        // -----------------------------

        await client.query(
            `UPDATE wallets
             SET balance = balance + $1
             WHERE id = $2`,
            [transferAmount, receiverWalletId]
        );

        // -----------------------------
        // 10. Create transaction
        // -----------------------------

        const transactionId = uuidv4();

        const referenceId =
            `TRF-${Date.now()}-${uuidv4()}`;

        await client.query(
            `INSERT INTO transactions
             (
                id,
                reference_id,
                transaction_type,
                status,
                idempotency_key
             )
             VALUES ($1, $2, 'TRANSFER', 'COMPLETED', $3)`,
            [
                transactionId,
                referenceId,
                idempotencyKey
            ]
        );

        // -----------------------------
        // 11. DEBIT ledger entry
        // -----------------------------

        await client.query(
            `INSERT INTO ledger_entries
             (
                id,
                transaction_id,
                wallet_id,
                entry_type,
                amount
             )
             VALUES ($1, $2, $3, 'DEBIT', $4)`,
            [
                uuidv4(),
                transactionId,
                senderWalletId,
                transferAmount
            ]
        );

        // -----------------------------
        // 12. CREDIT ledger entry
        // -----------------------------

        await client.query(
            `INSERT INTO ledger_entries
             (
                id,
                transaction_id,
                wallet_id,
                entry_type,
                amount
             )
             VALUES ($1, $2, $3, 'CREDIT', $4)`,
            [
                uuidv4(),
                transactionId,
                receiverWalletId,
                transferAmount
            ]
        );

        // -----------------------------
        // 13. Commit
        // -----------------------------

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Transfer successful",
            transactionId,
            referenceId,
            amount: transferAmount
        });

    } catch (error) {

        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error(
                "Rollback error:",
                rollbackError.message
            );
        }

        // PostgreSQL unique violation
        // Another request may have inserted
        // the same idempotency key concurrently.
        if (error.code === "23505") {

            try {
                const existingTransaction = await client.query(
                    `SELECT
                        id,
                        reference_id,
                        transaction_type,
                        status
                     FROM transactions
                     WHERE idempotency_key = $1`,
                    [req.headers["idempotency-key"]]
                );

                if (existingTransaction.rows.length > 0) {
                    return res.status(200).json({
                        message: "Transaction already processed",
                        transaction: existingTransaction.rows[0]
                    });
                }
            } catch (lookupError) {
                console.error(
                    "Idempotency lookup failed:",
                    lookupError.message
                );
            }
        }

        console.error("Transfer error:", error);

        return res.status(500).json({
            message: "Transfer failed"
        });

    } finally {
        client.release();
    }
};

module.exports = {
    transfer
};