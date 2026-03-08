import express from "express";
import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import { parseAutomationScript } from "./src/services/aiService.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "nexus.db"));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
});

// Initialize Database
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      age INTEGER,
      email TEXT UNIQUE,
      password TEXT,
      country TEXT,
      bio TEXT,
      profilePic TEXT,
      role TEXT DEFAULT 'user',
      parentId INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      senderId INTEGER,
      receiverId INTEGER,
      groupId INTEGER,
      content TEXT,
      type TEXT DEFAULT 'text',
      fileName TEXT,
      filePath TEXT,
      isRead BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      type TEXT DEFAULT 'chat', -- 'chat' or 'gaming'
      ownerId INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS group_members (
      groupId INTEGER,
      userId INTEGER,
      role TEXT DEFAULT 'member',
      PRIMARY KEY (groupId, userId)
    );

    CREATE TABLE IF NOT EXISTS automation_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      command TEXT,
      targetUserId INTEGER,
      message TEXT,
      scheduledTime DATETIME,
      status TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      callerId INTEGER,
      receiverId INTEGER,
      type TEXT,
      status TEXT,
      duration INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Database initialized successfully");
  // Ensure country column exists
  try {
    db.exec("ALTER TABLE users ADD COLUMN country TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN bio TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN profilePic TEXT");
  } catch (e) {}
} catch (err) {
  console.error("Database initialization failed:", err);
}

const JWT_SECRET = process.env.JWT_SECRET || "nexus-super-secret";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use("/uploads", express.static(uploadsDir));

  // --- Health Check ---
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- Auth Routes ---
  const VALID_COUNTRIES = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
    "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
    "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia",
    "Denmark", "Djibouti", "Dominica", "Dominican Republic",
    "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
    "Fiji", "Finland", "France",
    "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
    "Haiti", "Holy See", "Honduras", "Hungary",
    "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
    "Jamaica", "Japan", "Jordan",
    "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
    "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
    "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
    "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
    "Oman",
    "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
    "Qatar",
    "Romania", "Russia", "Rwanda",
    "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
    "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
    "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan",
    "Vanuatu", "Venezuela", "Vietnam",
    "Yemen",
    "Zambia", "Zimbabwe"
  ];

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, age, email, password, country } = req.body;
      if (!username || !email || !password || !country) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const normalizedCountry = country.trim();
      if (!VALID_COUNTRIES.some(c => c.toLowerCase() === normalizedCountry.toLowerCase())) {
        return res.status(400).json({ error: "Invalid country name. Please enter a valid country (e.g. Pakistan, India, USA)." });
      }

      // Check for existing email
      const existingEmail = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
      if (existingEmail) {
        return res.status(400).json({ error: "This email is already registered. Please use a different email or sign in." });
      }

      // Check for existing username
      const existingUsername = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
      if (existingUsername) {
        return res.status(400).json({ error: "This username is already taken. Please choose another one." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare("INSERT INTO users (username, age, email, password, country) VALUES (?, ?, ?, ?, ?)");
      const info = stmt.run(username, age ? Number(age) : null, email, hashedPassword, normalizedCountry);
      res.json({ success: true, userId: info.lastInsertRowid });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(400).json({ error: error.message || "Signup failed" });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
        res.json({ 
          token, 
          user: { 
            id: user.id, 
            username: user.username, 
            email: user.email, 
            age: user.age, 
            country: user.country,
            bio: user.bio,
            profilePic: user.profilePic,
            role: user.role 
          } 
        });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error: any) {
      console.error("Signin error:", error);
      res.status(500).json({ error: error.message || "Signin failed" });
    }
  });

  // --- User Routes ---
  app.get("/api/users", (req, res) => {
    const { currentUserId } = req.query;
    if (currentUserId) {
      const users = db.prepare(`
        SELECT DISTINCT u.id, u.username, u.email, u.country, u.bio, u.profilePic 
        FROM users u
        JOIN messages m ON (u.id = m.senderId OR u.id = m.receiverId)
        WHERE (m.senderId = ? OR m.receiverId = ?) AND u.id != ?
      `).all(currentUserId, currentUserId, currentUserId);
      res.json(users);
    } else {
      // If no currentUserId, return empty list to hide all users by default
      res.json([]);
    }
  });

  app.get("/api/users/search", (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email is required" });
    try {
      const user = db.prepare("SELECT id, username, email, country, bio, profilePic FROM users WHERE email = ?").get(email);
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/users/:id/profile", async (req, res) => {
    const { id } = req.params;
    const { bio, profilePic, country, email } = req.body;
    try {
      // Check if email is already taken by another user
      if (email) {
        const existingUser = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email, id);
        if (existingUser) {
          return res.status(400).json({ error: "Email is already in use by another account." });
        }
      }

      db.prepare("UPDATE users SET bio = ?, profilePic = ?, country = ?, email = ? WHERE id = ?")
        .run(bio, profilePic, country, email, id);
      
      const user = db.prepare("SELECT id, username, email, age, country, bio, profilePic, role FROM users WHERE id = ?").get(id);
      
      // Broadcast profile update to all users
      io.emit("user_profile_updated", {
        userId: user.id,
        profilePic: user.profilePic,
        username: user.username,
        bio: user.bio,
        country: user.country
      });

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Messaging Routes ---
  app.get("/api/messages/:userId/:otherId", (req, res) => {
    const { userId, otherId } = req.params;
    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE (senderId = ? AND receiverId = ?) 
      OR (senderId = ? AND receiverId = ?)
      ORDER BY createdAt ASC
    `).all(userId, otherId, otherId, userId);
    res.json(messages);
  });

  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      url: fileUrl, 
      fileName: req.file.originalname,
      type: req.file.mimetype.startsWith('image/') ? 'image' : 
            req.file.mimetype.startsWith('video/') ? 'video' : 'document'
    });
  });

  // --- Automation Routes ---
  app.post("/api/automation/parse", async (req, res) => {
    const { script } = req.body;
    try {
      const parsed = await parseAutomationScript(script);
      res.json(parsed);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/automation/schedule", (req, res) => {
    const { userId, command, targetUserId, message, scheduledTime } = req.body;
    const stmt = db.prepare("INSERT INTO automation_tasks (userId, command, targetUserId, message, scheduledTime) VALUES (?, ?, ?, ?, ?)");
    stmt.run(userId, command, targetUserId, message, scheduledTime);
    res.json({ success: true });
  });

  app.get("/api/calls/:userId", (req, res) => {
    const { userId } = req.params;
    const calls = db.prepare(`
      SELECT c.*, u.username as otherUsername, u.profilePic as otherProfilePic 
      FROM calls c
      JOIN users u ON (c.callerId = u.id OR c.receiverId = u.id)
      WHERE (c.callerId = ? OR c.receiverId = ?) AND u.id != ?
      ORDER BY c.createdAt DESC
    `).all(userId, userId, userId);
    res.json(calls);
  });

  // --- Socket.io Logic ---
  const onlineUsers = new Map<number, string>(); // userId -> socketId

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (userId) => {
      if (!userId) return;
      onlineUsers.set(Number(userId), socket.id);
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);
      io.emit("user_status", { userId, status: "online" });
      
      // Send the list of currently online users to the joining user
      const onlineUserIds = Array.from(onlineUsers.keys());
      socket.emit("initial_online_users", onlineUserIds);
    });

    socket.on("send_message", (data) => {
      try {
        const { senderId, receiverId, content, type, fileName } = data;
        if (!senderId || !receiverId || !content) return;
        
        const stmt = db.prepare("INSERT INTO messages (senderId, receiverId, content, type, fileName) VALUES (?, ?, ?, ?, ?)");
        const info = stmt.run(senderId, receiverId, content, type || 'text', fileName || null);
        
        const message = { id: info.lastInsertRowid, ...data, createdAt: new Date() };
        io.to(`user_${receiverId}`).emit("receive_message", message);
        io.to(`user_${senderId}`).emit("receive_message", message);
      } catch (error) {
        console.error("Socket send_message error:", error);
      }
    });

    // --- WebRTC Signaling ---
    socket.on("call_user", (data) => {
      const { to, from, signal, type, fromUser } = data;
      const isOnline = onlineUsers.has(Number(to));
      io.to(`user_${to}`).emit("incoming_call", { signal, from, type, fromUser, isRinging: isOnline });
      // If offline, we still emit but the client won't receive it until they connect.
      // However, the caller should know if it's "Calling" or "Ringing".
      socket.emit("call_status_update", { to, status: isOnline ? "ringing" : "calling" });
    });

    socket.on("answer_call", (data) => {
      const { to, signal } = data;
      io.to(`user_${to}`).emit("call_accepted", { signal });
    });

    socket.on("end_call", (data) => {
      const { to, callerId, receiverId, type, status, duration } = data;
      
      // Log the call
      if (callerId && receiverId) {
        const stmt = db.prepare("INSERT INTO calls (callerId, receiverId, type, status, duration) VALUES (?, ?, ?, ?, ?)");
        stmt.run(callerId, receiverId, type, status, duration || 0);

        // If missed, send a message to chat
        if (status === 'missed') {
          const msgStmt = db.prepare("INSERT INTO messages (senderId, receiverId, content, type) VALUES (?, ?, ?, ?)");
          msgStmt.run(callerId, receiverId, `Missed ${type} call`, 'text');
          
          const missedMsg = {
            senderId: callerId,
            receiverId: receiverId,
            content: `Missed ${type} call`,
            type: 'text',
            createdAt: new Date()
          };
          io.to(`user_${receiverId}`).emit("receive_message", missedMsg);
        }
      }

      io.to(`user_${to}`).emit("call_ended");
    });

    socket.on("ice_candidate", (data) => {
      const { to, candidate } = data;
      io.to(`user_${to}`).emit("ice_candidate", { candidate });
    });

    socket.on("reject_call", (data) => {
      const { to, callerId, receiverId, type } = data;
      
      // Log rejected call
      if (callerId && receiverId) {
        const stmt = db.prepare("INSERT INTO calls (callerId, receiverId, type, status, duration) VALUES (?, ?, ?, ?, ?)");
        stmt.run(callerId, receiverId, type, 'rejected', 0);
      }

      io.to(`user_${to}`).emit("call_rejected");
    });

    socket.on("disconnect", () => {
      let disconnectedUserId: number | null = null;
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          break;
        }
      }
      if (disconnectedUserId) {
        onlineUsers.delete(disconnectedUserId);
        io.emit("user_status", { userId: disconnectedUserId, status: "offline" });
      }
      console.log("User disconnected");
    });
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Global error handler:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  });

  // --- Automation Worker (Simple) ---
  setInterval(() => {
    const now = new Date().toISOString();
    const tasks: any[] = db.prepare("SELECT * FROM automation_tasks WHERE status = 'pending' AND scheduledTime <= ?").all(now);
    
    tasks.forEach(task => {
      console.log(`Executing automation task ${task.id}`);
      // Send message via socket
      io.to(`user_${task.targetUserId}`).emit("receive_message", {
        senderId: task.userId,
        receiverId: task.targetUserId,
        content: task.message,
        type: 'text',
        createdAt: new Date()
      });
      // Save to messages table
      db.prepare("INSERT INTO messages (senderId, receiverId, content) VALUES (?, ?, ?)").run(task.userId, task.targetUserId, task.message);
      // Update task status
      db.prepare("UPDATE automation_tasks SET status = 'completed' WHERE id = ?").run(task.id);
    });
  }, 10000);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("CRITICAL: Failed to start server:", err);
});
