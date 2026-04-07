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

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "root";
const DB_PASS = process.env.DB_PASS || "123456";
const DB_NAME = process.env.DB_NAME || "relief_db";
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;
const PORT = process.env.PORT || 5000;

// OTP storage
const otps = {};

// Nodemailer Config
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false }
});

// Sequelize Setup with SSL for Aiven
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

// User Model
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

// Record Model
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

// Initialize DB lazily (works in serverless)
let dbInitialized = false;
const ensureDB = async () => {
    if (dbInitialized) return;
    try {
        const connection = await mysql.createConnection({
            host: DB_HOST, user: DB_USER, password: DB_PASS, port: DB_PORT,
            ssl: useSSL ? { rejectUnauthorized: false } : undefined
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
        await connection.end();
        await sequelize.sync({ alter: false });
        dbInitialized = true;
        console.log("✅ DB ready");
    } catch (err) {
        console.error("❌ DB init error:", err.message);
        throw err;
    }
};

// Middleware to ensure DB is ready before any API call
app.use(async (req, res, next) => {
    try {
        await ensureDB();
        next();
    } catch (err) {
        res.status(500).json({ error: "Database connection failed: " + err.message });
    }
});

// --- API ROUTES ---

app.get("/api/database", async (req, res) => {
    try {
        const { userEmail } = req.query;
        if (!userEmail) return res.status(400).json({ error: "Missing userEmail" });

        const { Op } = Sequelize;
        let whereClause = {
            [Op.or]: [
                { userEmail: userEmail },
                { type: "Request" },
                { type: "Donation" }
            ]
        };

        if (userEmail === "admin@gmail.com" || userEmail === "admin") {
            whereClause = {};
        }

        const records = await Record.findAll({ where: whereClause });
        const db = {};
        records.forEach(r => {
            db[r.serialId] = {
                type: r.type, name: r.name, item: r.item,
                quantity: r.quantity, status: r.status,
                userEmail: r.userEmail, itemImage: r.itemImage,
                ...(r.otherInfo || {})
            };
        });
        res.json(db);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/database", async (req, res) => {
    try {
        const { serialId, data } = req.body;
        const userEmail = data.userEmail;
        if (!userEmail) return res.status(400).json({ error: "Missing userEmail" });

        await Record.upsert({
            serialId, type: data.type, name: data.name,
            item: data.item, quantity: data.quantity, status: data.status,
            userEmail, itemImage: data.itemImage, otherInfo: data
        });
        res.json({ message: "Record saved" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/signup", async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ error: "User already exists" });

        const newUser = await User.create({ name, email, password, phone });
        res.status(201).json({ message: "User created", user: newUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email, password } });
        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        res.json({ message: "Login successful", user: { name: user.name, email: user.email, age: user.age, job: user.job, phone: user.phone, location: user.location, purpose: user.purpose, rating: user.rating, about: user.about, profileImage: user.profileImage } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/auth/me", async (req, res) => {
    try {
        const { email, name, age, job, phone, location, purpose, rating, about, profileImage } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ error: "User not found" });

        await user.update({ name, age, job, phone, location, purpose, rating, about, profileImage });
        res.json({ message: "Profile updated successfully", user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ error: "Email not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otps[email] = otp;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset OTP - Relief Connection",
            text: `Your OTP for password reset is: ${otp}. It will expire soon.`,
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "OTP sent to your email", devOtp: otp });
    } catch (err) {
        res.status(500).json({ error: "Failed to send email." });
    }
});

app.post("/api/verify-otp", async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (otps[email] !== otp) return res.status(400).json({ error: "Invalid or expired OTP" });

        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ error: "User not found" });

        await user.update({ password: newPassword });
        delete otps[email];
        res.json({ message: "Password reset successful! You can now login." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/notify-order", async (req, res) => {
    try {
        const { recipientEmail, donorName, itemName, quantity } = req.body;
        if (!recipientEmail) return res.status(400).json({ error: "Missing recipient email" });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: "🙌 Good News! Someone is supporting your request!",
            text: `Hello,\n\n${donorName} has clicked "Order Item" for your request of ${quantity} ${itemName}.\n\nThank you,\nThe Relief Connection Team`,
        });
        res.json({ message: "Notification sent successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to send notification email." });
    }
});

app.post("/api/notify-receipt", async (req, res) => {
    try {
        const { recipientEmail, donorEmail, item, quantity, serialId } = req.body;
        let toEmails = [];
        if (recipientEmail && recipientEmail !== "N/A") toEmails.push(recipientEmail);
        if (donorEmail && donorEmail !== "N/A") toEmails.push(donorEmail);
        if (toEmails.length === 0) return res.status(400).json({ error: "No emails provided" });

        const dateStr = new Date().toLocaleDateString();
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: toEmails.join(", "),
            subject: "📜 Official Donation Receipt - Relief Connection",
            text: `Receipt for ${item} (Qty: ${quantity}). Serial No: ${serialId}. Successfully transferred on ${dateStr}. Thank you!`,
        });
        res.json({ message: "Receipt sent successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to send receipt email." });
    }
});

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Relief Connection API is running!" });
});

// Start server locally (not on Vercel)
if (!process.env.VERCEL) {
    const localPort = PORT || 5001;
    app.listen(localPort, () => console.log(`🚀 Server running on port ${localPort}`));
}

export default app;
