import mongoose from "mongoose";

const workerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    photo: {
      type: String,
      default: null,
    },

    // 🔹 Basic Info
    name: {
      type: String,
      required: true,
      trim: true,
    },

    dob: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      required: true,
    },

    education: {
      type: String,
      enum: ["NONE", "PRIMARY", "SECONDARY", "HIGHER"],
      default: "NONE",
    },

    // 🔹 Location (VERY IMPORTANT for hiring)
    location: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
    },

    // 🔹 Work Info
    workerType: {
      type: [String],
      enum: [
        "PLUMBER",
        "ELECTRICIAN",
        "MASON",
        "CARPENTER",
        "PAINTER",
        "HELPER",
        "GENERAL",
      ],
      required: true,
    },

    skills: {
      type: [String],
      default: [],
    },

    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },

    expectedDailyWage: {
      type: Number,
      required: true,
      min: 0,
    },

    // 🔹 Availability
    isAvailable: {
      type: Boolean,
      default: true,
      index: true, // fast filtering
    },

    // 🔹 Activity tracking (VERY USEFUL)
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// 🔹 Indexes (critical for search performance)
workerProfileSchema.index({ workerType: 1 });
workerProfileSchema.index({ skills: 1 });
workerProfileSchema.index({ "location.state": 1 });
workerProfileSchema.index({ isAvailable: 1, workerType: 1 });

export const WorkerProfile = mongoose.model(
  "WorkerProfile",
  workerProfileSchema,
);
