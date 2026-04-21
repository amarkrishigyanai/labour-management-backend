import mongoose from "mongoose";

const employerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // 🔹 Basic Info
    name: {
      type: String,
      required: true,
      trim: true,
    },

    companyName: {
      type: String,
      trim: true,
      default: null, // optional (individual contractor)
    },

    phone: {
      type: String,
      required: true,
    },

    // 🔹 Location
    location: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
    },

    // 🔹 Hiring Info
    hiringFor: {
      type: [String], // e.g. ["PLUMBER", "MASON"]
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

export const EmployerProfile = mongoose.model(
  "EmployerProfile",
  employerProfileSchema,
);
