const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const User = require("./models/User")

const app = express()

app.use(cors())
app.use(express.json())

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dlcms"
const ADMIN_EMAIL = "admin@dlcms"
const ADMIN_PASSWORD = "admin"

const ensureAdminAccount = async () => {
  try {
    const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
    const existing = await User.findOne({ email: ADMIN_EMAIL })

    if (!existing) {
      await User.create({
        name: "Admin",
        email: ADMIN_EMAIL,
        password: adminHash,
        role: "Admin",
      })
      console.log("Admin account created")
      return
    }

    const passwordMatches = await bcrypt.compare(ADMIN_PASSWORD, existing.password)
    if (existing.role !== "Admin" || !passwordMatches) {
      existing.role = "Admin"
      existing.password = adminHash
      await existing.save()
      console.log("Admin account updated")
    }
  } catch (error) {
    console.error("Admin account check failed:", error.message)
  }
}

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected")
    await ensureAdminAccount()
  })
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
      if (email.toLowerCase() === "admin@dlcms" && user.role !== "Admin") {
        return res.status(403).json({ message: "Unauthorized admin login." })
      }
      if (user.role === "Admin" && user.email !== "admin@dlcms") {
        return res.status(403).json({ message: "Unauthorized admin login." })
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

    if (name.trim().toLowerCase() === "admin") {
      return res.status(403).json({ message: "Username 'admin' is reserved." })
    }

    if (email.trim().toLowerCase() === "admin@dlcms") {
      return res.status(403).json({ message: "Admin account is reserved." })
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
