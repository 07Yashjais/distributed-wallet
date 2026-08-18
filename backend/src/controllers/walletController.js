const { v4: uuidv4 } = require("uuid");
const { pool } = require("../config/db");


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
            message: "Internal server error"
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
            message: "Internal server error"
        });
    }
};


// ==========================================
// DEPOSIT
// ==========================================

const deposit = async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.userId;
        const { amount } = req.body;

        if (amount === undefined) {
            return res.status(400).json({
                message: "Amount is required"
            });
        }

        const depositAmount = Number(amount);

        if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than zero"
            });
        }

        await client.query("BEGIN");

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

        const referenceId =
            `DEP-${Date.now()}-${uuidv4()}`;

        await client.query(
            `INSERT INTO transactions
            (id, reference_id, transaction_type, status)
            VALUES ($1, $2, 'DEPOSIT', 'COMPLETED')`,
            [
                transactionId,
                referenceId
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
            console.error(
                "Rollback error:",
                rollbackError.message
            );
        }

        console.error("Deposit error:", error);

        res.status(500).json({
            message: "Deposit failed"
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

        if (amount === undefined) {
            return res.status(400).json({
                message: "Amount is required"
            });
        }

        const withdrawAmount = Number(amount);

        if (!Number.isFinite(withdrawAmount) || withdrawAmount <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than zero"
            });
        }

        await client.query("BEGIN");

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
            [
                withdrawAmount,
                wallet.id
            ]
        );

        // Create transaction
        const transactionId = uuidv4();

        const referenceId =
            `WDR-${Date.now()}-${uuidv4()}`;

        await client.query(
            `INSERT INTO transactions
            (id, reference_id, transaction_type, status)
            VALUES ($1, $2, 'WITHDRAW', 'COMPLETED')`,
            [
                transactionId,
                referenceId
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
            console.error(
                "Rollback error:",
                rollbackError.message
            );
        }

        console.error("Withdraw error:", error);

        res.status(500).json({
            message: "Withdrawal failed"
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