const { pool } = require("../config/db");

const getTransactions = async (req, res) => {
    try {
        const userId = req.user.userId;
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
        const rawCursor = req.query.cursor;

        const params = [userId];
        let cursorClause = "";

        if (rawCursor && rawCursor !== "null" && rawCursor !== "undefined" && rawCursor !== "") {
            try {
                let cursorObj;
                if (typeof rawCursor === "string" && rawCursor.startsWith("{")) {
                    cursorObj = JSON.parse(rawCursor);
                } else {
                    const decoded = Buffer.from(rawCursor, "base64").toString("utf8");
                    cursorObj = JSON.parse(decoded);
                }

                if (cursorObj.createdAt && cursorObj.id) {
                    params.push(cursorObj.createdAt, cursorObj.id);
                    cursorClause = `AND (le.created_at, le.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`;
                } else if (cursorObj.createdAt) {
                    params.push(cursorObj.createdAt);
                    cursorClause = `AND le.created_at < $${params.length}::timestamptz`;
                }
            } catch {
                // Fallback: direct timestamp string
                params.push(rawCursor);
                cursorClause = `AND le.created_at < $${params.length}::timestamptz`;
            }
        }

        params.push(limit + 1);
        const limitParamIndex = params.length;

        const result = await pool.query(
            `SELECT
                t.id AS transaction_id,
                t.reference_id,
                t.transaction_type,
                t.status,
                le.id AS entry_id,
                le.entry_type,
                le.amount,
                le.created_at
             FROM transactions t
             JOIN ledger_entries le
                ON le.transaction_id = t.id
             JOIN wallets w
                ON w.id = le.wallet_id
             WHERE w.user_id = $1
             ${cursorClause}
             ORDER BY le.created_at DESC, le.id DESC
             LIMIT $${limitParamIndex}`,
            params
        );

        const rows = result.rows;
        const hasMore = rows.length > limit;
        const transactions = hasMore ? rows.slice(0, limit) : rows;

        let nextCursor = null;
        if (hasMore && transactions.length > 0) {
            const lastItem = transactions[transactions.length - 1];
            nextCursor = Buffer.from(
                JSON.stringify({
                    createdAt: lastItem.created_at,
                    id: lastItem.entry_id
                })
            ).toString("base64");
        }

        res.status(200).json({
            transactions,
            nextCursor,
            hasMore
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