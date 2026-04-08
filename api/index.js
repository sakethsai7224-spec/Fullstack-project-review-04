import express from "express";
import mysql from "mysql2/promise";
import { Sequelize, DataTypes } from "sequelize";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Environment Variables
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "root";
const DB_PASS = process.env.DB_PASS || "123456";
const DB_NAME = process.env.DB_NAME || "relief_db";
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;

// Nodemailer Config
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // TLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
});

// Sequelize Setup
const useSSL = DB_HOST !== "localhost" && DB_HOST !== "127.0.0.1";
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: "mysql",
    logging: false,
    dialectOptions: useSSL ? {
        ssl: { rejectUnauthorized: false }
    } : {}
});

// Models
const User = sequelize.define("User", {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING },
    age: { type: DataTypes.STRING },
    job: { type: DataTypes.STRING },
    location: { type: DataTypes.STRING },
    purpose: { type: DataTypes.STRING },
    rating: { type: DataTypes.STRING },
    about: { type: DataTypes.TEXT },
    profileImage: { type: DataTypes.TEXT('long') },
});

const Record = sequelize.define("Record", {
    serialId: { type: DataTypes.STRING, primaryKey: true },
    type: { type: DataTypes.STRING },
    name: { type: DataTypes.STRING },
    item: { type: DataTypes.STRING },
    quantity: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING },
    userEmail: { type: DataTypes.STRING, allowNull: false },
    itemImage: { type: DataTypes.TEXT('long') },
    otherInfo: { type: DataTypes.JSON },
});

// Database Initialization (Lazy)
let dbInitialized = false;
const ensureDB = async () => {
    if (dbInitialized) return;
    try {
        const connection = await mysql.createConnection({ 
            host: DB_HOST, user: DB_USER, password: DB_PASS, port: DB_PORT,
            ssl: useSSL ? { rejectUnauthorized: false } : undefined
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
        
        // Index pruning logic
        try {
            const [indexes] = await connection.query(`SHOW INDEX FROM Users WHERE Non_unique = 0 AND Key_name != 'PRIMARY'`);
            if (indexes.length > 50) {
                const emailIndexes = indexes.filter(idx => idx.Column_name === 'email');
                if (emailIndexes.length > 1) {
                    for (let i = 1; i < emailIndexes.length; i++) {
                        await connection.query(`ALTER TABLE Users DROP INDEX \`${emailIndexes[i].Key_name}\``);
                    }
                }
            }
        } catch (idxErr) {
            // Table might not exist yet
        }

        await connection.end();
        await sequelize.sync({ alter: false });
        dbInitialized = true;
    } catch (err) {
        console.error("❌ DB Init Error:", err.message);
        throw err;
    }
};

// Global DB initialized middleware
app.use(async (req, res, next) => {
    // Skip ensureDB for root health check if needed, but easier to keep it
    if (req.url.includes("/health")) return next(); 
    try {
        await ensureDB();
        next();
    } catch (err) {
        res.status(500).json({ error: "Database connection failed. Check your environment variables. Error: " + err.message });
    }
});

// --- API ROUTES ---
// We handle both /api/path and /path because Vercel/Express routing can vary

const getDatabaseHandler = async (req, res) => {
    try {
        const { userEmail } = req.query;
        if (!userEmail) return res.status(400).json({ error: "Missing userEmail" });
        const { Op } = Sequelize;
        let whereClause = { [Op.or]: [{ userEmail: userEmail }, { type: "Request" }, { type: "Donation" }] };
        if (userEmail === "admin@gmail.com" || userEmail === "admin") whereClause = {};
        const records = await Record.findAll({ where: whereClause });
        const db = {};
        records.forEach(r => {
            db[r.serialId] = { type: r.type, name: r.name, item: r.item, quantity: r.quantity, status: r.status, userEmail: r.userEmail, itemImage: r.itemImage, ...(r.otherInfo || {}) };
        });
        res.json(db);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const postDatabaseHandler = async (req, res) => {
    try {
        const { serialId, data } = req.body;
        const userEmail = data.userEmail;
        if (!userEmail) return res.status(400).json({ error: "Missing userEmail" });
        await Record.upsert({ serialId, type: data.type, name: data.name, item: data.item, quantity: data.quantity, status: data.status, userEmail, itemImage: data.itemImage, otherInfo: data });
        res.json({ message: "Record saved" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

app.get(["/api/database", "/database"], getDatabaseHandler);
app.post(["/api/database", "/database"], postDatabaseHandler);

app.post(["/api/signup", "/signup"], async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ error: "User already exists" });
        const newUser = await User.create({ name, email, password, phone });
        res.status(201).json({ message: "User created", user: newUser });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post(["/api/login", "/login"], async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email, password } });
        if (!user) return res.status(401).json({ error: "Invalid credentials" });
        res.json({ message: "Login successful", user: { name: user.name, email: user.email, age: user.age, job: user.job, phone: user.phone, location: user.location, purpose: user.purpose, rating: user.rating, about: user.about, profileImage: user.profileImage } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get(["/api/health", "/health"], (req, res) => {
    res.json({ status: "ok", message: "Relief Connection API is running!", db_host: DB_HOST });
});

// Fallback
app.all("*", (req, res) => {
    res.status(404).json({ error: `Not Found: ${req.method} ${req.url}` });
});

export default app;
