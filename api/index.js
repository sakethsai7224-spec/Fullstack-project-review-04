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
const PORT = process.env.PORT || 5001;

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

// OTP Storage
const otps = {};

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
        console.log("🔄 Initializing DB...");
        const connection = await mysql.createConnection({ 
            host: DB_HOST, user: DB_USER, password: DB_PASS, port: DB_PORT,
            ssl: useSSL ? { rejectUnauthorized: false } : undefined
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
        
        // Index pruning logic to prevent duplicate unique keys
        try {
            const [indexes] = await connection.query(`SHOW INDEX FROM Users WHERE Non_unique = 0 AND Key_name != 'PRIMARY'`);
            if (indexes.length > 50) {
                console.log("⚠️ Pruning redundant unique constraints from Users table...");
                const emailIndexes = indexes.filter(idx => idx.Column_name === 'email');
                if (emailIndexes.length > 1) {
                    for (let i = 1; i < emailIndexes.length; i++) {
                        await connection.query(`ALTER TABLE Users DROP INDEX \`${emailIndexes[i].Key_name}\``);
                    }
                }
            }
        } catch (idxErr) {
            console.log("ℹ️ Index check skipped or table doesn't exist yet.");
        }

        await connection.end();
        console.log("✅ Database verified.");

        await sequelize.sync({ alter: false });
        dbInitialized = true;
        console.log("✅ Sequelize models synced.");
    } catch (err) {
        console.error("❌ DB Init Error:", err.message);
        throw err;
    }
};

// Middleware to ensure DB is ready - Mount at /api
const router = express.Router();

router.use(async (req, res, next) => {
    try {
        await ensureDB();
        next();
    } catch (err) {
        res.status(500).json({ error: "Database connection failed. Please ensure DB_HOST, DB_USER, DB_PASS are set correctly in Vercel environment variables. Error: " + err.message });
    }
});

// --- API ROUTES ---

router.get("/database", async (req, res) => {
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

router.post("/database", async (req, res) => {
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

router.post("/signup", async (req, res) => {
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

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email, password } });
        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        res.json({ message: "Login successful", user: { name: user.name, email: user.email, age: user.age, job: user.job, phone: user.phone, location: user.location, purpose: user.purpose, rating: user.rating, about: user.about, profileImage: user.profileImage } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/auth/me", async (req, res) => {
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

router.post("/forgot-password", async (req, res) => {
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
        console.error("Email Error:", err);
        res.status(500).json({ error: "Failed to send email. Check EMAIL_USER and EMAIL_PASS." });
    }
});

router.post("/verify-otp", async (req, res) => {
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

router.post("/notify-order", async (req, res) => {
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

router.post("/notify-receipt", async (req, res) => {
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

router.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Relief Connection API is running!", db_host: DB_HOST });
});

// Mount the router on /api
app.use("/api", router);

// Handle local running
if (!process.env.VERCEL) {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

export default app;
