import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

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
      index: true,
    },
    location: {
      city: { type: String, trim: true },
      state: { type: String, trim: true, index: true },
    },

    salary: {
      amount: { type: Number, required: true, min: 0 },
      type: {
        type: String,
        enum: ["DAILY", "WEEKLY", "MONTHLY", "PER_PROJECT"],
        required: true,
      },
    },

    facilities: {
      accommodation: { type: Boolean, default: false },
      food: { type: Boolean, default: false },
      tools: { type: Boolean, default: false },
      equipment: { type: Boolean, default: false },
      travelAllowance: { type: Boolean, default: false },
    },

    numberOfWorkers: {
      type: Number,
      required: true,
      min: 1,
    },
    hiredWorkersCount: {
      type: Number,
      default: 0,
    },

    startDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["OPEN", "CLOSED", "COMPLETED"],
      default: "OPEN",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Job = mongoose.model("Job", jobSchema);
