require("dotenv").config();
const { Pool } = require("pg");

const useSSL = process.env.DATABASE_SSL === 'true' || 
    (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require'));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.DB_POOL_MAX || "20", 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

const connectDB = async () => {
    try {
        const client = await pool.connect();

        console.log("PostgreSQL connected successfully");

        client.release();
    } catch (error) {
        console.error("PostgreSQL connection failed during startup:");
        console.error(error.message);
        throw new Error(`Database connection failed: ${error.message}`);
    }
};

module.exports = {
    pool,
    connectDB
};