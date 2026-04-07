import express from "express";
import mysql from "mysql2/promise";
import { Sequelize, DataTypes } from "sequelize";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("------------------------------------------------------------------");
    console.log("❌ ERROR: Email credentials missing in .env file!");
    console.log("Please add these to Full-Review-04/.env:");
    console.log("EMAIL_USER=your-email@gmail.com");
    console.log("EMAIL_PASS=your-google-app-password");
    console.log("------------------------------------------------------------------");
}

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "root";
const DB_PASS = process.env.DB_PASS || "123456";
const DB_NAME = process.env.DB_NAME || "relief_db";
const PORT = process.env.PORT || 5000;

// Temporary OTP storage (In production, use Redis or a DB table with expiry)
const otps = {};

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

// 🔥 Create Database if it doesn't exist
const initializeDB = async () => {
    try {
        const connection = await mysql.createConnection({ host: DB_HOST, user: DB_USER, password: DB_PASS });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
        console.log(`✅ Database ${DB_NAME} checked/created.`);
        await connection.end();
    } catch (err) {
        console.error("❌ Error initializing database:", err);
    }
};

await initializeDB();

// 🔥 Sequelize Setup
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    dialect: "mysql",
    logging: false,
});

// 🔥 User Model
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

// 🔥 Record Model for flexible storage
const Record = sequelize.define("Record", {
    serialId: { type: DataTypes.STRING, primaryKey: true },
    type: { type: DataTypes.STRING },
    name: { type: DataTypes.STRING },
    item: { type: DataTypes.STRING },
    quantity: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING },
    userEmail: { type: DataTypes.STRING, allowNull: false }, // Added to link records to users
    itemImage: { type: DataTypes.TEXT('long') }, // Added to support images
    otherInfo: { type: DataTypes.JSON },
});

// 🔥 Sync Models
const syncDatabase = async () => {
    try {
        // Fix for "Too many keys specified; max 64 keys allowed"
        // This is caused by Sequelize sync({ alter: true }) re-adding unique constraints on every restart.
        // We will manually drop redundant constraints if they exist.
        const connection = await mysql.createConnection({ 
            host: DB_HOST, 
            user: DB_USER, 
            password: DB_PASS, 
            database: DB_NAME 
        });

        const [indexes] = await connection.query(`SHOW INDEX FROM Users WHERE Non_unique = 0 AND Key_name != 'PRIMARY'`);
        
        // If we have close to or more than 50 keys, start pruning the duplicates
        if (indexes.length > 50) {
            console.log("⚠️ Pruning redundant unique constraints from Users table...");
            // Keep the first one, drop the rest of the generated unique keys for 'email'
            // Usually they are named 'email_2', 'email_3', etc. or just 'email'
            const emailIndexes = indexes.filter(idx => idx.Column_name === 'email');
            if (emailIndexes.length > 1) {
                for (let i = 1; i < emailIndexes.length; i++) {
                    await connection.query(`ALTER TABLE Users DROP INDEX \`${emailIndexes[i].Key_name}\``);
                }
            }
        }
        await connection.end();

        // Use a safe sync strategy
        await sequelize.sync({ alter: true }); 
        console.log("✅ Models synced with MySQL.");
    } catch (err) {
        console.error("❌ Sync Error handled:", err.message);
        try {
            await sequelize.sync(); // Fallback to basic sync
            console.log("✅ Fallback sync successful.");
        } catch (err2) {
            console.error("❌ Critical Sync Failure:", err2.message);
        }
    }
};

await syncDatabase();


// --- API ROUTES ---

// Database access
app.get("/api/database", async (req, res) => {
    try {
        const { userEmail } = req.query;
        if (!userEmail) return res.status(400).json({ error: "Missing userEmail" });

        // Get user's records + all requests + ALL donations (Public Wall of Kindness)
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
                type: r.type,
                name: r.name,
                item: r.item,
                quantity: r.quantity,
                status: r.status,
                userEmail: r.userEmail,
                itemImage: r.itemImage,
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
            serialId,
            type: data.type,
            name: data.name,
            item: data.item,
            quantity: data.quantity,
            status: data.status,
            userEmail: userEmail,
            itemImage: data.itemImage,
            otherInfo: data
        });
        res.json({ message: "Record saved" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Signup
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

// Login
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

// Update Profile
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

// Send OTP
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

        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email sent to SMTP server for:", email, "| MessageID:", info.messageId);
        console.log(`🔑 [DEMO FALLBACK] The OTP for ${email} is: ${otp}`);
        
        res.json({ message: "OTP sent to your email (Check spam folder too)", devOtp: otp });
    } catch (err) {
        console.error("❌ Email error:", err);
        res.status(500).json({ error: "Failed to send email. Please check your internet connection or .env settings." });
    }
});

// Verify OTP and Reset Password
app.post("/api/verify-otp", async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (otps[email] !== otp) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ error: "User not found" });

        await user.update({ password: newPassword });
        delete otps[email];

        res.json({ message: "Password reset successful! You can now login." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Notify Recipient about an order
app.post("/api/notify-order", async (req, res) => {
    try {
        const { recipientEmail, donorName, itemName, quantity } = req.body;
        if (!recipientEmail) return res.status(400).json({ error: "Missing recipient email" });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: "🙌 Good News! Someone is supporting your request!",
            text: `Hello,\n\nWe are happy to inform you that ${donorName} has just clicked "Order Item" for your request of ${quantity} ${itemName}.\n\nThe donor is currently processing the donation. You will see updates on your dashboard once the items are in transit.\n\nThank you,\nThe Relief Connection Team`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
                    <h2 style="color: #646cff;">🙌 Your Request is being Supported!</h2>
                    <p>Hello,</p>
                    <p>Great news! <strong>${donorName}</strong> has expressed interest in supporting your request for <strong>${quantity} x ${itemName}</strong>.</p>
                    <p>The donor is currently filling out the donation details. You can monitor the progress on your "Support En Route" section in the Recipient tab shortly.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 0.85rem; color: #666;">This is an automated notification from Relief Connection. Thank you for your patience and for being part of our community.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`📡 Notification sent to ${recipientEmail} for item ${itemName}`);
        res.json({ message: "Notification sent successfully" });
    } catch (err) {
        console.error("❌ Notification error:", err);
        res.status(500).json({ error: "Failed to send notification email." });
    }
});

// Notify Recipient and Donor with a digital receipt when an item is received
app.post("/api/notify-receipt", async (req, res) => {
    try {
        const { recipientEmail, donorEmail, item, quantity, serialId } = req.body;
        
        let toEmails = [];
        if (recipientEmail && recipientEmail !== "N/A") toEmails.push(recipientEmail);
        if (donorEmail && donorEmail !== "N/A") toEmails.push(donorEmail);

        if (toEmails.length === 0) return res.status(400).json({ error: "No emails provided" });

        const dateStr = new Date().toLocaleDateString();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmails.join(", "),
            subject: "📜 Official Donation Receipt - Relief Connection",
            text: `Receipt for ${item} (Qty: ${quantity}). Serial No: ${serialId}. Successfully transferred on ${dateStr}. Thank you!`,
            html: `
                <div style="font-family: 'Courier New', Courier, monospace; padding: 30px; background: #f8f9fa; max-width: 600px; margin: 0 auto; border: 2px dashed #ccc; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <span style="font-size: 40px;">🤝</span>
                        <h2 style="color: #1e3c72; margin: 10px 0 0 0;">RELIEF CONNECTION</h2>
                        <p style="color: #666; margin: 0;">Official Donation Receipt</p>
                    </div>
                    <hr style="border: none; border-top: 1px dashed #ccc;" />
                    <div style="margin: 20px 0;">
                        <p><strong>Tracking ID:</strong> ${serialId}</p>
                        <p><strong>Date:</strong> ${dateStr}</p>
                        <p><strong>Status:</strong> <span style="color: #2ed573; font-weight: bold;">DELIVERED & COMPLETED</span></p>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                        <tr style="border-bottom: 1px solid #ddd; background: #eee;">
                            <th style="padding: 10px; text-align: left;">Item Description</th>
                            <th style="padding: 10px; text-align: right;">Quantity</th>
                        </tr>
                        <tr style="border-bottom: 1px solid #ddd;">
                            <td style="padding: 10px;">${item}</td>
                            <td style="padding: 10px; text-align: right;">${quantity}</td>
                        </tr>
                    </table>
                    <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; font-size: 0.9rem;">
                        <p style="margin: 0 0 5px 0;"><strong>Donor:</strong> ${donorEmail || 'Anonymous Community Member'}</p>
                        <p style="margin: 0;"><strong>Recipient:</strong> ${recipientEmail || 'General Community Use'}</p>
                    </div>
                    <div style="text-align: center; color: #888; font-size: 0.8rem; margin-top: 30px;">
                        <p>This is an automated receipt for your records.</p>
                        <p>Thank you for changing a life today. ❤️</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Receipt sent for ${serialId} to ${toEmails.join(", ")}`);
        res.json({ message: "Receipt sent successfully" });
    } catch (err) {
        console.error("❌ Receipt error:", err);
        res.status(500).json({ error: "Failed to send receipt email." });
    }
});

if (!process.env.VERCEL) {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

export default app;
