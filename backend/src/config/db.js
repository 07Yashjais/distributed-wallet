const { Pool } = require("pg");

const useSSL = process.env.DATABASE_SSL === 'true' || 
    (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require'));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSSL ? { rejectUnauthorized: false } : false
});

const connectDB = async () => {
    try {
        const client = await pool.connect();

        console.log("PostgreSQL connected successfully");

        client.release();
    } catch (error) {
        console.error("PostgreSQL connection failed:");
        console.error(error.message);
    }
};

module.exports = {
    pool,
    connectDB
};