import { OTP } from "../models/otp.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { generateToken } from "../utils/generateToken.js";

//for testing OTP
import { TEST_USERS } from "../config/testUsers.js";

// 🔹 Utility: generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  // 🔹 1. Validate phone
  if (!phone) {
    throw new ApiError(400, "Phone number is required");
  }

  // 🔹 2. Normalize phone
  const normalizedPhone = phone.replace(/\D/g, "").slice(-10);

  if (normalizedPhone.length !== 10) {
    throw new ApiError(400, "Invalid phone number");
  }

  // 🔹 3. Delete old OTP
  await OTP.deleteOne({ phone: normalizedPhone });

  // 🔹 4. Generate OTP
  // const otp = generateOTP();
  const testUser = TEST_USERS[normalizedPhone] || null;
  const otp = testUser ? testUser.otp : generateOTP();

  // 🔹 5. Expiry (5 min)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // 🔹 6. Save OTP
  await OTP.create({
    phone: normalizedPhone,
    otp,
    expiresAt,
  });

  if (process.env.NODE_ENV === "development" || testUser) {
    console.log(`OTP for ${normalizedPhone}: ${otp}`);
  }

  // 🔹 8. Response
  return res
    .status(200)
    .json(new ApiResponse(200, null, "OTP sent successfully"));
});

// --------------------------------------------

//verify OTP and login/register user
export const verfiyOTP = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    throw new ApiError(400, "Phone and OTP are required");
  }

  const normalizedPhone = phone.replace(/\D/g, "").slice(-10);

  // 🔹 2. Find OTP
  const otpRecord = await OTP.findOne({ phone: normalizedPhone });

  if (!otpRecord) {
    throw new ApiError(400, "OTP expired or not found");
  }

  // 🔹 3. Check expiry
  if (otpRecord.expiresAt < new Date()) {
    await OTP.deleteOne({ phone: normalizedPhone });
    throw new ApiError(400, "OTP expired");
  }

  // 🔹 4. Match OTP
  // if (otpRecord.otp !== otp) {
  //   throw new ApiError(400, "Invalid OTP");
  // }
  const testUser = TEST_USERS[String(normalizedPhone)] || null;
  console.log("Normalized Phone:", normalizedPhone);
  console.log("Test User:", testUser);
  console.log("Assigned Role:", testUser?.role);

  if (testUser) {
    if (otp !== testUser.otp) {
      throw new ApiError(400, "Invalid Test OTP");
    }
  } else {
    if (otpRecord.otp !== otp) {
      throw new ApiError(400, "Invalid OTP");
    }
  }

  // 🔹 5. Delete OTP after success
  await OTP.deleteOne({ phone: normalizedPhone });

  // 🔹 6. Find or create user
  let user = await User.findOne({ phone: normalizedPhone });

  if (!user) {
    user = await User.create({
      phone: normalizedPhone,
      isVerified: true,
      role: null, // ✅ always null
    });
  } else {
    user.isVerified = true;
    await user.save();
  }
  // 🔹 7. Generate token
  const token = generateToken(user._id);

  // 🔹 8. Flow decision
  let status = "GO_HOME";

  if (!user.role) {
    status = "SELECT_ROLE";
  } else if (!user.isProfileComplete) {
    status = "CREATE_PROFILE";
  }

  // 🔹 9. Response
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        token,
        user,
        status,
      },
      "OTP verified successfully",
    ),
  );
});

//select role

export const setRole = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { role } = req.body;

  // 🔹 1. Validate role
  const allowedRoles = ["WORKER", "EMPLOYER"];

  if (!role || !allowedRoles.includes(role)) {
    throw new ApiError(400, "Invalid role selected");
  }

  // 🔹 2. Find user
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // 🔹 3. Ensure OTP verification completed
  if (!user.isVerified) {
    throw new ApiError(401, "Verify OTP first");
  }

  // 🔥 4. Prevent role overwrite (CRITICAL)
  if (user.role) {
    throw new ApiError(400, "Role already set and cannot be changed");
  }

  // 🔹 5. Set role
  user.role = role;
  await user.save();

  // 🔹 6. Decide next step
  let status = "CREATE_PROFILE";

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: user._id,
        role: user.role,
        status,
      },
      "Role set successfully",
    ),
  );
});
