import mongoose from "mongoose";

// ─── Sub-schema: Location ─────────────────────────────────────────
const locationSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      trim: true,
      default: null,
    },
    state: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { _id: false }
);

// ─── Sub-schema: Rating ───────────────────────────────────────────
const ratingSchema = new mongoose.Schema(
  {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

// ─── Main User Schema ─────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    // 🔹 Identity
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Enter valid 10-digit Indian phone number"],
      set: (v) => v.replace(/\D/g, "").slice(-10), // normalize phone
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // 🔹 Role
    role: {
      type: String,
      enum: ["WORKER", "EMPLOYER"],
      default: null,
      index: true,
    },

    // 🔹 Profile (common)
    name: {
      type: String,
      trim: true,
      default: null,
    },

    photo: {
      type: String,
      default: null,
    },

    location: {
      type: locationSchema,
      default: () => ({ city: null, state: null }),
    },

    rating: {
      type: ratingSchema,
      default: () => ({ average: 0, totalReviews: 0 }),
    },

    // 🔹 Status
    isProfileComplete: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,

    // Clean API response
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ "location.state": 1 });
userSchema.index({ role: 1, "location.state": 1 }); // compound index

// ─── Virtual: Profile Status ─────────────────────────────────────
userSchema.virtual("profileStatus").get(function () {
  if (!this.isVerified) return "UNVERIFIED";
  if (!this.role) return "NO_ROLE";
  if (!this.isProfileComplete) return "INCOMPLETE";
  return "COMPLETE";
});

export const User = mongoose.model("User", userSchema);