const { v4: uuidv4 } = require("uuid");
const { pool } = require("../config/db");
const { validateAmount, validateIdempotencyKey } = require("../utils/validation");


// ==========================================
// CREATE WALLET
// ==========================================

const createWallet = async (req, res) => {
    try {
        const userId = req.user.userId;

        const existingWallet = await pool.query(
            `SELECT id, currency, balance
             FROM wallets
             WHERE user_id = $1`,
            [userId]
        );

        if (existingWallet.rows.length > 0) {
            return res.status(409).json({
                message: "Wallet already exists",
                wallet: existingWallet.rows[0]
            });
        }

        const walletId = uuidv4();

        const result = await pool.query(
            `INSERT INTO wallets
            (id, user_id, currency, balance)
            VALUES ($1, $2, 'INR', 0.00)
            RETURNING id, user_id, currency, balance, created_at`,
            [walletId, userId]
        );

        res.status(201).json({
            message: "Wallet created successfully",
            wallet: result.rows[0]
        });

    } catch (error) {
        console.error("Create wallet error:", error);

        res.status(500).json({
            message: "Failed to create wallet. Please try again later."
        });
    }
};


// ==========================================
// GET WALLET
// ==========================================

const getWallet = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT id, user_id, currency, balance, created_at
             FROM wallets
             WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Wallet not found"
            });
        }

        res.status(200).json({
            wallet: result.rows[0]
        });

    } catch (error) {
        console.error("Get wallet error:", error);

        res.status(500).json({
            message: "Failed to fetch wallet. Please try again later."
        });
    }
};


// ==========================================
// DEPOSIT
// ==========================================

const getExistingTxResponse = async (client, idempotencyKey) => {
    const txRes = await client.query(
        `SELECT id, reference_id, transaction_type, status
         FROM transactions
         WHERE idempotency_key = $1`,
        [idempotencyKey]
    );

    if (txRes.rows.length === 0) return null;

    const tx = txRes.rows[0];
    const details = await client.query(
        `SELECT le.amount, w.id AS wallet_id, w.balance, w.currency
         FROM ledger_entries le
         JOIN wallets w ON w.id = le.wallet_id
         WHERE le.transaction_id = $1
         LIMIT 1`,
        [tx.id]
    );
    const d = details.rows[0] || {};
    return {
        message: "Transaction already processed",
        transaction: tx,
        transactionId: tx.id,
        referenceId: tx.reference_id,
        amount: d.amount ? Number(d.amount) : undefined,
        wallet: d.wallet_id ? {
            id: d.wallet_id,
            balance: d.balance,
            currency: d.currency
        } : undefined
    };
};

const deposit = async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.userId;
        const { amount } = req.body;

        const depositAmount = validateAmount(amount);
        if (!depositAmount) {
            return res.status(400).json({
                message: "Invalid deposit amount. Must be a positive number with at most 2 decimal places."
            });
        }

        const rawKey = req.headers["idempotency-key"];
        const idempotencyKey = rawKey ? validateIdempotencyKey(rawKey) : null;
        if (rawKey && !idempotencyKey) {
            return res.status(400).json({
                message: "Invalid Idempotency-Key. Must be between 1 and 255 characters."
            });
        }

        await client.query("BEGIN");

        // Check idempotency if key provided
        if (idempotencyKey) {
            const existingTx = await client.query(
                `SELECT id, reference_id, transaction_type, status
                 FROM transactions
                 WHERE idempotency_key = $1
                 FOR UPDATE`,
                [idempotencyKey]
            );

            if (existingTx.rows.length > 0) {
                const responseData = await getExistingTxResponse(client, idempotencyKey);
                await client.query("ROLLBACK");
                return res.status(200).json(responseData);
            }
        }

        // Lock wallet
        const walletResult = await client.query(
            `SELECT id, balance, currency
             FROM wallets
             WHERE user_id = $1
             FOR UPDATE`,
            [userId]
        );

        if (walletResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Wallet not found"
            });
        }

        const wallet = walletResult.rows[0];

        // Increase balance
        const updatedWallet = await client.query(
            `UPDATE wallets
             SET balance = balance + $1
             WHERE id = $2
             RETURNING id, balance, currency`,
            [depositAmount, wallet.id]
        );

        // Create transaction
        const transactionId = uuidv4();
        const referenceId = `DEP-${Date.now()}-${uuidv4()}`;

        await client.query(
            `INSERT INTO transactions
            (id, reference_id, transaction_type, status, idempotency_key)
            VALUES ($1, $2, 'DEPOSIT', 'COMPLETED', $3)`,
            [
                transactionId,
                referenceId,
                idempotencyKey
            ]
        );

        // CREDIT ledger entry
        await client.query(
            `INSERT INTO ledger_entries
            (id, transaction_id, wallet_id, entry_type, amount)
            VALUES ($1, $2, $3, 'CREDIT', $4)`,
            [
                uuidv4(),
                transactionId,
                wallet.id,
                depositAmount
            ]
        );

        // Insert Transactional Outbox Event
        await client.query(
            `INSERT INTO outbox_events
            (id, event_type, aggregate_type, aggregate_id, payload)
            VALUES ($1, $2, $3, $4, $5)`,
            [
                uuidv4(),
                "DEPOSIT_COMPLETED",
                "TRANSACTION",
                transactionId,
                JSON.stringify({
                    event: "DEPOSIT_COMPLETED",
                    transactionId,
                    referenceId,
                    walletId: wallet.id,
                    userId,
                    amount: depositAmount,
                    timestamp: new Date().toISOString()
                })
            ]
        );

        await client.query("COMMIT");

        res.status(200).json({
            message: "Deposit successful",
            transactionId,
            referenceId,
            amount: depositAmount,
            wallet: updatedWallet.rows[0]
        });

    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error("Rollback error:", rollbackError.message);
        }

        // Concurrent duplicate idempotency key race handling
        if (error.code === "23505" && req.headers["idempotency-key"]) {
            try {
                const existingResponse = await getExistingTxResponse(client, req.headers["idempotency-key"]);
                if (existingResponse) {
                    return res.status(200).json(existingResponse);
                }
            } catch (lookupError) {
                console.error("Idempotency lookup error:", lookupError.message);
            }
        }

        console.error("Deposit error:", error);

        res.status(500).json({
            message: "Deposit failed. Please try again later."
        });

    } finally {
        client.release();
    }
};


// ==========================================
// WITHDRAW
// ==========================================

const withdraw = async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.userId;
        const { amount } = req.body;

        const withdrawAmount = validateAmount(amount);
        if (!withdrawAmount) {
            return res.status(400).json({
                message: "Invalid withdrawal amount. Must be a positive number with at most 2 decimal places."
            });
        }

        const rawKey = req.headers["idempotency-key"];
        const idempotencyKey = rawKey ? validateIdempotencyKey(rawKey) : null;
        if (rawKey && !idempotencyKey) {
            return res.status(400).json({
                message: "Invalid Idempotency-Key. Must be between 1 and 255 characters."
            });
        }

        await client.query("BEGIN");

        // Check idempotency if key provided
        if (idempotencyKey) {
            const existingTx = await client.query(
                `SELECT id, reference_id, transaction_type, status
                 FROM transactions
                 WHERE idempotency_key = $1
                 FOR UPDATE`,
                [idempotencyKey]
            );

            if (existingTx.rows.length > 0) {
                const responseData = await getExistingTxResponse(client, idempotencyKey);
                await client.query("ROLLBACK");
                return res.status(200).json(responseData);
            }
        }

        // Lock wallet
        const walletResult = await client.query(
            `SELECT id, balance, currency
             FROM wallets
             WHERE user_id = $1
             FOR UPDATE`,
            [userId]
        );

        if (walletResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Wallet not found"
            });
        }

        const wallet = walletResult.rows[0];

        // Check balance while wallet is locked
        if (Number(wallet.balance) < withdrawAmount) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Insufficient balance"
            });
        }

        // Decrease wallet balance
        const updatedWallet = await client.query(
            `UPDATE wallets
             SET balance = balance - $1
             WHERE id = $2
             RETURNING id, balance, currency`,
            [withdrawAmount, wallet.id]
        );

        // Create transaction
        const transactionId = uuidv4();
        const referenceId = `WDR-${Date.now()}-${uuidv4()}`;

        await client.query(
            `INSERT INTO transactions
            (id, reference_id, transaction_type, status, idempotency_key)
            VALUES ($1, $2, 'WITHDRAW', 'COMPLETED', $3)`,
            [
                transactionId,
                referenceId,
                idempotencyKey
            ]
        );

        // DEBIT ledger entry
        await client.query(
            `INSERT INTO ledger_entries
            (id, transaction_id, wallet_id, entry_type, amount)
            VALUES ($1, $2, $3, 'DEBIT', $4)`,
            [
                uuidv4(),
                transactionId,
                wallet.id,
                withdrawAmount
            ]
        );

        // Insert Transactional Outbox Event
        await client.query(
            `INSERT INTO outbox_events
            (id, event_type, aggregate_type, aggregate_id, payload)
            VALUES ($1, $2, $3, $4, $5)`,
            [
                uuidv4(),
                "WITHDRAWAL_COMPLETED",
                "TRANSACTION",
                transactionId,
                JSON.stringify({
                    event: "WITHDRAWAL_COMPLETED",
                    transactionId,
                    referenceId,
                    walletId: wallet.id,
                    userId,
                    amount: withdrawAmount,
                    timestamp: new Date().toISOString()
                })
            ]
        );

        await client.query("COMMIT");

        res.status(200).json({
            message: "Withdrawal successful",
            transactionId,
            referenceId,
            amount: withdrawAmount,
            wallet: updatedWallet.rows[0]
        });

    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error("Rollback error:", rollbackError.message);
        }

        // Concurrent duplicate idempotency key race handling
        if (error.code === "23505" && req.headers["idempotency-key"]) {
            try {
                const existingResponse = await getExistingTxResponse(client, req.headers["idempotency-key"]);
                if (existingResponse) {
                    return res.status(200).json(existingResponse);
                }
            } catch (lookupError) {
                console.error("Idempotency lookup error:", lookupError.message);
            }
        }

        console.error("Withdraw error:", error);

        res.status(500).json({
            message: "Withdrawal failed. Please try again later."
        });

    } finally {
        client.release();
    }
};


// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    createWallet,
    getWallet,
    deposit,
    withdraw
};