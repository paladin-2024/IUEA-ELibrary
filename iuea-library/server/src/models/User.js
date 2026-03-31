const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: true,
      trim:     true,
    },
    email: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    passwordHash: {
      type: String,
    },
    studentId: {
      type:   String,
      sparse: true,
      unique: true,
    },
    faculty: {
      type: String,
      enum: ['Law', 'Medicine', 'Engineering', 'Business', 'IT', 'Education', 'Arts', 'Science'],
    },
    role: {
      type:    String,
      enum:    ['student', 'staff', 'admin'],
      default: 'student',
    },
    preferredLanguages: {
      type:    [String],
      default: ['English'],
    },
    avatar: {
      type: String, // R2 URL
    },
    readingGoal: {
      type:    Number,
      default: 20,
    },
    // Shared legacy FCM token (kept for backwards compat)
    fcmToken: {
      type: String,
    },
    // Flutter mobile FCM token
    fcmTokenMobile: {
      type: String,
    },
    // Web browser FCM token
    fcmTokenWeb: {
      type: String,
    },
    kohaPatronId: {
      type: String,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ studentId: 1 }, { sparse: true });
userSchema.index({ kohaPatronId: 1 }, { sparse: true });

// ── Pre-save: hash password ───────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  if (this.passwordHash && !this.passwordHash.startsWith('$2')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  }
  next();
});

// ── Instance method: compare password ────────────────────────────────────────
userSchema.methods.comparePassword = function (plain) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(plain, this.passwordHash);
};

// ── toJSON: strip sensitive fields ───────────────────────────────────────────
userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
