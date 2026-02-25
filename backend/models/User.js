const mongoose = require("mongoose")

console.log("🔧 Loading User model...")

// Check if model already exists and delete it
if (mongoose.models.User) {
  console.log("⚠️  User model already exists in cache, deleting...")
  delete mongoose.models.User
  delete mongoose.modelSchemas.User
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Please provide a name'], trim: true },
    email: { type: String, required: [true, 'Please provide an email'], unique: true, lowercase: true, trim: true },
    password: { type: String, required: [true, 'Please provide a password'] },
    role: { type: String, enum: ["Admin", "Learner"], default: "Learner" },
  },
  { timestamps: true, collection: 'users' }
)

console.log("✓ User schema fields:", Object.keys(userSchema.obj))

module.exports = mongoose.model("User", userSchema, 'users')
