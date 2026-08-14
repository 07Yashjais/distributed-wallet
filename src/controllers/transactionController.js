const { pool } = require("../config/db");

const getTransactions = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT
                t.id AS transaction_id,
                t.reference_id,
                t.transaction_type,
                t.status,
                le.entry_type,
                le.amount,
                le.created_at
             FROM transactions t
             JOIN ledger_entries le
                ON le.transaction_id = t.id
             JOIN wallets w
                ON w.id = le.wallet_id
             WHERE w.user_id = $1
             ORDER BY le.created_at DESC`,
            [userId]
        );

        res.status(200).json({
            transactions: result.rows
        });

    } catch (error) {
        console.error("Transaction history error:", error);

        res.status(500).json({
            message: "Failed to fetch transactions"
        });
    }
};

module.exports = {
    getTransactions
};