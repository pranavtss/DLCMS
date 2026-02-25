const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const User = require("./models/User")

const app = express()

app.use(cors())
app.use(express.json())

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dlcms"

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("MongoDB connection error:", error.message))

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" })
})

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required." })
  }
  User.findOne({ email: email.toLowerCase() })
    .then(async (user) => {
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials." })
      }
      const match = await bcrypt.compare(password, user.password)
      if (!match) {
        return res.status(401).json({ message: "Invalid credentials." })
      }
      return res.json({ message: "Login successful", role: user.role, name: user.name })
    })
    .catch((error) => res.status(500).json({ message: "Login failed.", error: error.message }))
})

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role, adminSecret } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password required." })
    }
    
    // Block Admin creation unless secret is provided
    if (role === "Admin") {
      const ADMIN_SECRET = process.env.ADMIN_SECRET || "dlcms-admin-2026"
      if (adminSecret !== ADMIN_SECRET) {
        return res.status(403).json({ message: "Unauthorized admin creation." })
      }
    }
    
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(409).json({ message: "Account already exists." })
    }
    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: role === "Admin" ? "Admin" : "Learner",
    })
    return res.status(201).json({ message: "Account created", role: user.role, name: user.name })
  } catch (error) {
    return res.status(500).json({ message: "Registration failed.", error: error.message })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`)
})
