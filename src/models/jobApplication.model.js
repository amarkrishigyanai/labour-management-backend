import mongoose from "mongoose";

const jobApplicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["APPLIED", "SHORTLISTED", "REJECTED", "HIRED"],
      default: "APPLIED",
      index: true,
    },
  },
  { timestamps: true },
);

// ❗ Prevent duplicate apply
jobApplicationSchema.index({ job: 1, worker: 1 }, { unique: true });

export const JobApplication = mongoose.model(
  "JobApplication",
  jobApplicationSchema,
);
