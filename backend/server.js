const express = require("express")
require("dotenv").config()
const cors = require("cors")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const path = require("path")
const fs = require("fs")
const multer = require("multer")
const { OAuth2Client } = require("google-auth-library")
const User = require("./models/User")
const Course = require("./models/Course")
const Review = require("./models/Review")

const app = express()

app.use(cors())
app.use(express.json())
const uploadsDir = path.join(__dirname, "uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
  console.log("✓ Uploads directory created at:", uploadsDir)
} else {
  console.log("✓ Uploads directory exists at:", uploadsDir)
}

app.use("/uploads", express.static(uploadsDir))

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir)
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now()
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")
      const filename = `${timestamp}-${safeName}`
      console.log("✓ Saving file:", filename)
      cb(null, filename)
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for educational materials
})

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dlcms"
const ADMIN_EMAIL = "admin@dlcms"
const ADMIN_PASSWORD = "admin"
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ""
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null

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

app.post("/api/auth/google", async (req, res) => {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required." })
    }

    if (!googleClient) {
      return res.status(500).json({
        message: "Google sign-in is not configured on server. Add GOOGLE_CLIENT_ID in backend environment.",
      })
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()

    if (!payload || !payload.email_verified || !payload.email) {
      return res.status(401).json({ message: "Invalid Google account." })
    }

    const email = payload.email.toLowerCase()
    const name = payload.name || email.split("@")[0]

    if (email === ADMIN_EMAIL) {
      return res.status(403).json({ message: "Google login is not allowed for admin account." })
    }

    let user = await User.findOne({ email })

    if (!user) {
      const tempPassword = crypto.randomBytes(24).toString("hex")
      const hashed = await bcrypt.hash(tempPassword, 10)
      user = await User.create({
        name,
        email,
        password: hashed,
        role: "Learner",
      })
    }

    if (user.role === "Admin") {
      return res.status(403).json({ message: "Unauthorized admin login." })
    }

    return res.json({
      message: "Login successful",
      userId: user._id,
      role: user.role,
      name: user.name,
    })
  } catch (error) {
    return res.status(401).json({ message: "Google login failed.", error: error.message })
  }
})

app.post("/api/uploads", (req, res, next) => {
  console.log("📁 Upload request received")
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error("❌ Multer error:", err.code, err.message)
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large. Maximum size is 100MB' })
      }
      return res.status(400).json({ message: err.message })
    } else if (err) {
      console.error("❌ Upload middleware error:", err.message)
      return res.status(500).json({ message: "Upload failed", error: err.message })
    }

    if (!req.file) {
      console.warn("⚠️  No file provided in upload request")
      return res.status(400).json({ message: "No file uploaded" })
    }

    const fileUrl = `/uploads/${req.file.filename}`
    console.log("✓ File uploaded successfully:", fileUrl)
    res.status(201).json({
      message: "File uploaded",
      url: fileUrl,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    })
  })
})

// ===== COURSES ENDPOINTS =====
app.get("/api/courses", async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true }).sort({ createdAt: -1 })
    res.json(courses)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch courses", error: error.message })
  }
})

app.get("/api/admin/courses", async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 })
    res.json(courses)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch courses", error: error.message })
  }
})

app.get("/api/admin/courses/:id", async (req, res) => {
  try {
    const { id } = req.params
    
    const course = await Course.findById(id)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }
    
    res.json(course)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch course", error: error.message })
  }
})

app.post("/api/courses", async (req, res) => {
  try {
    const { title, description, instructor, category, level, duration, lessons, price, originalPrice } = req.body
    const userId = req.body.userId || req.headers['x-user-id']
    
    if (!title || !description || !instructor || !category) {
      return res.status(400).json({ message: "Please provide title, description, instructor, and category" })
    }

    const normalizedLessons = Array.isArray(lessons) ? lessons : []

    const course = await Course.create({
      title,
      description,
      instructor,
      category,
      level: level || "Beginner",
      duration: duration || "N/A",
      lessons: normalizedLessons,
      price: price || 0,
      originalPrice,
      isPublished: true,
      createdBy: userId,
    })

    console.log(`✅ Course created: ${course.title}`)
    res.status(201).json({ message: "Course created successfully", course })
  } catch (error) {
    console.error('❌ Course creation error:', error.message)
    res.status(500).json({ message: "Failed to create course", error: error.message })
  }
})

app.patch("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    
    const course = await Course.findByIdAndUpdate(id, updates, { new: true })
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }
    
    console.log(`✅ Course updated: ${course.title}`)
    res.json({ message: "Course updated successfully", course })
  } catch (error) {
    res.status(500).json({ message: "Failed to update course", error: error.message })
  }
})

app.delete("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params
    
    const course = await Course.findByIdAndDelete(id)
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }
    
    console.log(`✅ Course deleted: ${course.title}`)
    res.json({ message: "Course deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to delete course", error: error.message })
  }
})

// Lesson Management Endpoints
app.post("/api/courses/:courseId/lessons", async (req, res) => {
  try {
    const { courseId } = req.params
    const { title, videoUrl, videoUrls, description, order } = req.body

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Ensure lessons array exists
    if (!course.lessons) {
      course.lessons = []
    }

    // Add new lesson
    const normalizedVideoUrls = Array.isArray(videoUrls)
      ? videoUrls
      : videoUrl
        ? [videoUrl]
        : []

    const newLesson = {
      title,
      videoUrl: normalizedVideoUrls[0] || videoUrl,
      videoUrls: normalizedVideoUrls,
      description,
      order: order || course.lessons.length,
      materials: []
    }

    course.lessons.push(newLesson)
    await course.save()

    console.log(`✅ Lesson added to course ${course.title}: ${title}`)
    res.json({ message: "Lesson added successfully", lesson: course.lessons[course.lessons.length - 1] })
  } catch (error) {
    res.status(500).json({ message: "Failed to add lesson", error: error.message })
  }
})

app.patch("/api/courses/:courseId/lessons/:lessonId", async (req, res) => {
  try {
    const { courseId, lessonId } = req.params
    const { title, videoUrl, videoUrls, description, order } = req.body

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    const lesson = course.lessons.id(lessonId)
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" })
    }

    // Update lesson fields
    const normalizedVideoUrls = Array.isArray(videoUrls)
      ? videoUrls
      : videoUrl
        ? [videoUrl]
        : null

    if (title) lesson.title = title
    if (normalizedVideoUrls) {
      lesson.videoUrls = normalizedVideoUrls
      lesson.videoUrl = normalizedVideoUrls[0] || lesson.videoUrl
    } else if (videoUrl) {
      lesson.videoUrl = videoUrl
    }
    if (description) lesson.description = description
    if (order !== undefined) lesson.order = order

    await course.save()

    console.log(`✅ Lesson updated: ${lesson.title}`)
    res.json({ message: "Lesson updated successfully", lesson })
  } catch (error) {
    res.status(500).json({ message: "Failed to update lesson", error: error.message })
  }
})

app.delete("/api/courses/:courseId/lessons/:lessonId", async (req, res) => {
  try {
    const { courseId, lessonId } = req.params

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    const lesson = course.lessons.id(lessonId)
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" })
    }

    lesson.deleteOne()
    await course.save()

    console.log(`✅ Lesson deleted from course: ${course.title}`)
    res.json({ message: "Lesson deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to delete lesson", error: error.message })
  }
})

// Material Management Endpoints
app.post("/api/courses/:courseId/lessons/:lessonId/materials", async (req, res) => {
  try {
    const { courseId, lessonId } = req.params
    const { name, url, type } = req.body

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    const lesson = course.lessons.id(lessonId)
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" })
    }

    // Ensure materials array exists
    if (!lesson.materials) {
      lesson.materials = []
    }

    const newMaterial = {
      name,
      url,
      type: type || "other"
    }

    lesson.materials.push(newMaterial)
    await course.save()

    const addedMaterial = lesson.materials[lesson.materials.length - 1]
    console.log(`✅ Material added to lesson: ${lesson.title} - ${name}`)
    console.log(`  - Material ID: ${addedMaterial._id}`)
    res.json({ message: "Material added successfully", material: addedMaterial })
  } catch (error) {
    res.status(500).json({ message: "Failed to add material", error: error.message })
  }
})

app.patch("/api/courses/:courseId/lessons/:lessonId/materials/:materialId", async (req, res) => {
  try {
    const { courseId, lessonId, materialId } = req.params
    const { name, url, type } = req.body

    console.log(`🔍 PATCH Material Update:`)
    console.log(`  - courseId: ${courseId}`)
    console.log(`  - lessonId: ${lessonId}`)
    console.log(`  - materialId: ${materialId}`)

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    const lesson = course.lessons.id(lessonId)
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" })
    }

    console.log(`  - lesson found: ${lesson.title}`)
    console.log(`  - lesson.materials length: ${lesson.materials.length}`)
    console.log(`  - lesson.materials IDs: ${lesson.materials.map(m => m._id).join(', ')}`)

    let material = lesson.materials.id(materialId)
    
    // Fallback: if .id() doesn't work, search manually
    if (!material) {
      console.log(`  - .id() method didn't find material, trying manual search...`)
      material = lesson.materials.find(m => m._id.toString() === materialId.toString())
    }

    if (!material) {
      console.log(`  - ❌ Material not found with id: ${materialId}`)
      return res.status(404).json({ message: "Material not found" })
    }
    console.log(`  - ✅ Material found`)

    if (name) material.name = name
    if (url) material.url = url
    if (type) material.type = type

    await course.save()

    console.log(`✅ Material updated in lesson: ${lesson.title}`)
    res.json({ message: "Material updated successfully", material })
  } catch (error) {
    res.status(500).json({ message: "Failed to update material", error: error.message })
  }
})

app.delete("/api/courses/:courseId/lessons/:lessonId/materials/:materialId", async (req, res) => {
  try {
    const { courseId, lessonId, materialId } = req.params

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    const lesson = course.lessons.id(lessonId)
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" })
    }

    let material = lesson.materials.id(materialId)
    
    // Fallback: if .id() doesn't work, search manually
    if (!material) {
      material = lesson.materials.find(m => m._id.toString() === materialId.toString())
    }

    if (!material) {
      return res.status(404).json({ message: "Material not found" })
    }

    material.deleteOne()
    await course.save()

    console.log(`✅ Material deleted from lesson: ${lesson.title}`)
    res.json({ message: "Material deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to delete material", error: error.message })
  }
})

app.post("/api/reviews", async (req, res) => {
  try {
    const { courseId, userId, userName, rating, comment } = req.body

    if (!courseId || !userId || !rating || !comment) {
      return res.status(400).json({ message: "All fields are required" })
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" })
    }

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const existingReview = await Review.findOne({ courseId, userId })
    if (existingReview) {
      existingReview.rating = rating
      existingReview.comment = comment
      await existingReview.save()
      console.log(`✅ Review updated for course: ${course.title}`)
      return res.json({ message: "Review updated successfully", review: existingReview })
    }

    const review = await Review.create({
      courseId,
      userId,
      userName: userName || user.name,
      rating,
      comment,
    })

    console.log(`✅ Review created for course: ${course.title}`)
    res.status(201).json({ message: "Review submitted successfully", review })
  } catch (error) {
    console.error("❌ Review submission failed:", error)
    res.status(500).json({ message: "Failed to submit review", error: error.message })
  }
})

app.get("/api/reviews/course/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params
    const reviews = await Review.find({ courseId }).sort({ createdAt: -1 })
    res.json(reviews)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reviews", error: error.message })
  }
})

app.get("/api/reviews/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params
    const reviews = await Review.find({ userId }).populate('courseId', 'title thumbnail').sort({ createdAt: -1 })
    res.json(reviews)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user reviews", error: error.message })
  }
})

app.get("/api/admin/reviews", async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('courseId', 'title thumbnail')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
    res.json(reviews)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reviews", error: error.message })
  }
})

app.delete("/api/reviews/:reviewId", async (req, res) => {
  try {
    const { reviewId } = req.params
    const review = await Review.findByIdAndDelete(reviewId)
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" })
    }

    console.log(`✅ Review deleted`)
    res.json({ message: "Review deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to delete review", error: error.message })
  }
})

app.use((error, req, res, next) => {
  console.error("❌ Unhandled error:", error)
  res.status(error.status || 500).json({
    message: error.message || "Internal server error",
    error: error.message,
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`)
})
