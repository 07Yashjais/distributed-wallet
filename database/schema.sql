-- ============================================
-- DISTRIBUTED WALLET SYSTEM DATABASE
-- ============================================

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- WALLETS
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',

    -- NUMERIC is used instead of FLOAT for money
    balance NUMERIC(20, 2) NOT NULL DEFAULT 0.00,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_wallet_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
);


-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY,

    reference_id VARCHAR(100) UNIQUE NOT NULL,

    transaction_type VARCHAR(30) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',

    idempotency_key VARCHAR(255),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- LEDGER ENTRIES
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY,

    transaction_id UUID NOT NULL,

    wallet_id UUID NOT NULL,

    entry_type VARCHAR(10) NOT NULL,

    amount NUMERIC(20, 2) NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ledger_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES transactions(id),

    CONSTRAINT fk_ledger_wallet
        FOREIGN KEY (wallet_id)
        REFERENCES wallets(id),

    CONSTRAINT valid_entry_type
        CHECK (entry_type IN ('DEBIT', 'CREDIT')),

    CONSTRAINT positive_amount
        CHECK (amount > 0)
);


-- INDEXES
CREATE INDEX IF NOT EXISTS idx_wallet_user
ON wallets(user_id);

CREATE INDEX IF NOT EXISTS idx_ledger_wallet
ON ledger_entries(wallet_id);

CREATE INDEX IF NOT EXISTS idx_ledger_transaction
ON ledger_entries(transaction_id);

CREATE INDEX IF NOT EXISTS idx_transactions_reference
ON transactions(reference_id);

CREATE INDEX IF NOT EXISTS idx_transactions_created
ON transactions(created_at);

CREATE UNIQUE INDEX IF NOT EXISTS
idx_transactions_idempotency_key
ON transactions(idempotency_key)
WHERE idempotency_key IS NOT NULL;