import { EmployerProfile } from "../models/Employeer.model.js";
import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createEmployerProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 🔹 1. Role check
  if (req.user.role !== "EMPLOYER") {
    throw new ApiError(403, "Only employers can create profile");
  }

  // 🔹 2. Check existing profile
  const existing = await EmployerProfile.findOne({ user: userId });
  if (existing) {
    throw new ApiError(400, "Employer profile already exists");
  }

  const { name, companyName, location, hiringFor } = req.body;

  // 🔹 3. Validation
  if (!name || name.trim().length < 2) {
    throw new ApiError(400, "Valid name is required");
  }




  // 🔹 4. Create profile
  const profile = await EmployerProfile.create({
    user: userId,
    name: name.trim(),
    companyName: companyName || null,
    phone: req.user.phone, // reuse from User
    location: location || {},
    hiringFor: hiringFor || [],
  });

  // 🔹 5. Update user status
  await User.findByIdAndUpdate(userId, {
    isProfileComplete: true,
  });

  // 🔹 6. Response
  return res
    .status(201)
    .json(
      new ApiResponse(201, profile, "Employer profile created successfully"),
    );
});

//get 
export const getEmployerProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 🔹 Role check
  if (req.user.role !== "EMPLOYER") {
    throw new ApiError(403, "Only employers can access profile");
  }

  // 🔹 Find profile
  const profile = await EmployerProfile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Employer profile not found");
  }

  return res.status(200).json(
    new ApiResponse(200, profile, "Employer profile fetched successfully")
  );
});

//update 
export const updateEmployerProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (req.user.role !== "EMPLOYER") {
    throw new ApiError(403, "Only employers can update profile");
  }

  const profile = await EmployerProfile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  const { name, companyName, location, hiringFor } = req.body;

  // 🔹 Update fields (only if provided)
  if (name) profile.name = name.trim();
  if (companyName !== undefined) profile.companyName = companyName;
  if (location) profile.location = location;
  if (hiringFor) profile.hiringFor = hiringFor;

  await profile.save();

  return res.status(200).json(
    new ApiResponse(200, profile, "Employer profile updated successfully")
  );
});