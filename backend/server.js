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
      const newAdmin = await User.create({
        name: "Admin",
        email: ADMIN_EMAIL,
        password: adminHash,
        role: "Admin",
      })
      console.log("✓ Admin account created with ID:", newAdmin._id.toString())
      return
    }

    console.log("✓ Admin account exists, email:", existing.email, "role:", existing.role)
    
    const passwordMatches = await bcrypt.compare(ADMIN_PASSWORD, existing.password)
    if (existing.role !== "Admin" || !passwordMatches) {
      existing.role = "Admin"
      existing.password = adminHash
      await existing.save()
      console.log("✓ Admin account updated")
    } else {
      console.log("✓ Admin account verified and up to date")
    }
  } catch (error) {
    console.error("✗ Admin account check failed:", error.message)
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
  console.log(`\n📧 Login attempt: ${email}`)
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required." })
  }
  console.log(`🔍 Looking up user: ${email.toLowerCase()}`)
  User.findOne({ email: email.toLowerCase() })
    .then(async (user) => {
      if (!user) {
        console.log(`❌ Login failed: User not found for email ${email.toLowerCase()}`)
        return res.status(401).json({ message: "Invalid credentials." })
      }
      console.log(`✓ User found: ${user.name} (role: ${user.role})`)
      if (email.toLowerCase() === "admin@dlcms" && user.role !== "Admin") {
        console.log(`❌ Login failed: Admin email used but user role is ${user.role}`)
        return res.status(403).json({ message: "Unauthorized admin login." })
      }
      if (user.role === "Admin" && user.email !== "admin@dlcms") {
        console.log(`❌ Login failed: User has Admin role but email is ${user.email}`)
        return res.status(403).json({ message: "Unauthorized admin login." })
      }
      const match = await bcrypt.compare(password, user.password)
      console.log(`🔐 Password comparison result: ${match}`)
      if (!match) {
        console.log(`❌ Login failed: Password mismatch for ${email.toLowerCase()}`)
        return res.status(401).json({ message: "Invalid credentials." })
      }
      console.log(`✅ Login successful for ${email.toLowerCase()}`)
      return res.json({ message: "Login successful", userId: user._id, role: user.role, name: user.name })
    })
    .catch((error) => {
      console.error("❌ Login error:", error.message)
      res.status(500).json({ message: "Login failed.", error: error.message })
    })
})

app.post("/api/auth/register", async (req, res) => {
  console.log("\n🎯 ==== REGISTRATION REQUEST RECEIVED ====")
  console.log("Body:", req.body)
  try {
    const { name, email, password, role, adminSecret } = req.body
    console.log('\n📝 Registration attempt:')
    console.log('  Name:', name)
    console.log('  Email:', email)
    console.log('  Role:', role)
    
    if (!name || !email || !password) {
      console.log('❌ Validation failed: Missing fields')
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
      console.log('❌ Registration failed: Account already exists')
      return res.status(409).json({ message: "Account already exists." })
    }
    
    const hashed = await bcrypt.hash(password, 10)
    console.log('✓ Password hashed')
    
    const userDoc = {
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: role === "Admin" ? "Admin" : "Learner",
    }
    console.log('📝 Creating user with data:', { ...userDoc, password: '***' })
    
    const user = await User.create(userDoc)
    
    console.log('✅ User created successfully:', user._id)
    return res.status(201).json({ message: "Account created", userId: user._id, role: user.role, name: user.name })
  } catch (error) {
    console.error('❌ Registration error:', error.message)
    console.error('❌ Error name:', error.name)
    console.error('❌ Full error:', error)
    if (error.errors) {
      console.error('❌ Validation errors:', error.errors)
    }
    return res.status(500).json({ message: "Registration failed.", error: error.message })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`)
})
