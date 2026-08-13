const { v4: uuidv4 } = require("uuid");
const { pool } = require("../config/db");

const transfer = async (req, res) => {
    const client = await pool.connect();

    try {
        const senderUserId = req.user.userId;
        const { receiverWalletId, amount } = req.body;

        // -----------------------------
        // 1. Validate input
        // -----------------------------

        if (!receiverWalletId || !amount) {
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
        // 2. Find sender wallet
        // -----------------------------

        const senderResult = await client.query(
            `SELECT id, balance
             FROM wallets
             WHERE user_id = $1`,
            [senderUserId]
        );

        if (senderResult.rows.length === 0) {
            return res.status(404).json({
                message: "Sender wallet not found"
            });
        }

        const senderWallet = senderResult.rows[0];

        // Sender and receiver cannot be same
        if (senderWallet.id === receiverWalletId) {
            return res.status(400).json({
                message: "Cannot transfer to the same wallet"
            });
        }

        // -----------------------------
        // 3. Start database transaction
        // -----------------------------

        await client.query("BEGIN");

        /*
         * IMPORTANT:
         * Lock wallets in deterministic order.
         *
         * This helps prevent deadlocks when two transfers
         * happen in opposite directions simultaneously.
         */

        const walletIds = [
            senderWallet.id,
            receiverWalletId
        ].sort();

        const lockedWallets = await client.query(
            `SELECT id, balance
             FROM wallets
             WHERE id = ANY($1::uuid[])
             ORDER BY id
             FOR UPDATE`,
            [walletIds]
        );

        if (lockedWallets.rows.length !== 2) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Receiver wallet not found"
            });
        }

        const sender = lockedWallets.rows.find(
            wallet => wallet.id === senderWallet.id
        );

        const receiver = lockedWallets.rows.find(
            wallet => wallet.id === receiverWalletId
        );

        // -----------------------------
        // 4. Check balance
        // -----------------------------

        if (Number(sender.balance) < transferAmount) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Insufficient balance"
            });
        }

        // -----------------------------
        // 5. Update balances
        // -----------------------------

        await client.query(
            `UPDATE wallets
             SET balance = balance - $1
             WHERE id = $2`,
            [transferAmount, sender.id]
        );

        await client.query(
            `UPDATE wallets
             SET balance = balance + $1
             WHERE id = $2`,
            [transferAmount, receiver.id]
        );

        // -----------------------------
        // 6. Create transaction
        // -----------------------------

        const transactionId = uuidv4();

        const referenceId =
            `TRF-${Date.now()}-${uuidv4()}`;

        await client.query(
            `INSERT INTO transactions
            (id, reference_id, transaction_type, status)
            VALUES ($1, $2, 'TRANSFER', 'COMPLETED')`,
            [
                transactionId,
                referenceId
            ]
        );

        // -----------------------------
        // 7. Create DEBIT ledger entry
        // -----------------------------

        await client.query(
            `INSERT INTO ledger_entries
            (id, transaction_id, wallet_id, entry_type, amount)
            VALUES ($1, $2, $3, 'DEBIT', $4)`,
            [
                uuidv4(),
                transactionId,
                sender.id,
                transferAmount
            ]
        );

        // -----------------------------
        // 8. Create CREDIT ledger entry
        // -----------------------------

        await client.query(
            `INSERT INTO ledger_entries
            (id, transaction_id, wallet_id, entry_type, amount)
            VALUES ($1, $2, $3, 'CREDIT', $4)`,
            [
                uuidv4(),
                transactionId,
                receiver.id,
                transferAmount
            ]
        );

        // -----------------------------
        // 9. Commit everything
        // -----------------------------

        await client.query("COMMIT");

        res.status(200).json({
            message: "Transfer successful",
            transactionId,
            referenceId,
            amount: transferAmount
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error("Transfer error:", error);

        res.status(500).json({
            message: "Transfer failed"
        });

    } finally {
        client.release();
    }
};

module.exports = {
    transfer
};