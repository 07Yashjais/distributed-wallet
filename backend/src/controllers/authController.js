const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { pool } = require("../config/db");



const {
    validateEmail,
    validatePassword,
    validateName
} = require("../utils/validation");

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        if (!validateName(name)) {
            return res.status(400).json({
                message: "Name must be between 2 and 100 characters"
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                message: "Invalid email format"
            });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const userId = uuidv4();

        const result = await pool.query(
            `INSERT INTO users
            (id, name, email, password_hash)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, created_at`,
            [userId, name.trim(), normalizedEmail, passwordHash]
        );

        res.status(201).json({
            message: "User registered successfully",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            message: "Registration failed. Please try again later."
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                message: "Invalid email format"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const result = await pool.query(
            `SELECT id, name, email, password_hash
             FROM users
             WHERE email = $1`,
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            message: "Login failed. Please try again later."
        });
    }
};


module.exports = {
    register,
    login
};