import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
      set: (v) => v.replace(/\D/g, "").slice(-10),
    },

    otp: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// ─── Index: auto delete expired OTP ─────────────────────────────
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ─── Ensure one OTP per phone ───────────────────────────────────
otpSchema.index({ phone: 1 }, { unique: true });

export const OTP = mongoose.model("OTP", otpSchema);
