require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { pool } = require("../src/config/db");

const initDatabase = async () => {
    try {
        console.log("Connecting to database to initialize schema...");
        const schemaPath = path.join(__dirname, "schema.sql");
        const schemaSql = fs.readFileSync(schemaPath, "utf-8");

        await pool.query(schemaSql);
        console.log("✅ Database schema initialized successfully!");
    } catch (error) {
        console.error("❌ Failed to initialize schema:", error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

initDatabase();
