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
      enum: [
        'Faculty of Law',
        'Faculty of Medicine & Health Sciences',
        'Faculty of Engineering & Technology',
        'Faculty of Business & Management',
        'Faculty of Information Technology',
        'Faculty of Education',
        'Faculty of Arts & Social Sciences',
        'Faculty of Science',
        // web variants
        'Faculty of Science & Technology',
        'Faculty of Engineering',
        // short aliases kept for backwards compat / admin panel
        'Law', 'Medicine', 'Engineering', 'Business', 'IT', 'Education', 'Arts', 'Science',
      ],
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
    passwordResetToken: {
      type: String,
    },
    passwordResetExpiresAt: {
      type: Date,
    },
    notificationPrefs: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },
    readingPrefs: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },
    // ── Streaks & gamification ──────────────────────────────────────────────
    currentStreak:  { type: Number, default: 0 },
    longestStreak:  { type: Number, default: 0 },
    lastReadDate:   { type: Date },
    totalXp:        { type: Number, default: 0 },
    badges:         { type: [String], default: [] },
    totalReadingMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ kohaPatronId: 1 }, { sparse: true });

// ── Pre-save: hash password ───────────────────────────────────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  if (this.passwordHash && !this.passwordHash.startsWith('$2')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  }
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
