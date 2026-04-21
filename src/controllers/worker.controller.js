import { WorkerProfile } from "../models/workerProfile.model.js";
import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { deleteFromS3 } from "../utils/deleteFromS3.js";
import { extractS3Key } from "../utils/extractS3Key.js";

export const updateProfilePhoto = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!req.file) {
    throw new ApiError(400, "Photo is required");
  }

  const profile = await WorkerProfile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  // 🔥 STEP 1: delete old image if exists
  if (profile.photo) {
    const oldKey = extractS3Key(profile.photo);
    await deleteFromS3(oldKey);
  }

  // 🔥 STEP 2: upload new image
  const newPhotoUrl = await uploadToS3(req.file);

  // 🔥 STEP 3: update DB
  profile.photo = newPhotoUrl;
  await profile.save();

  return res
    .status(200)
    .json(new ApiResponse(200, profile, "Photo updated successfully"));
});

//----------------------------create profile--------------------

export const createWorkerProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 🔹 1. Ensure role is WORKER
  if (req.user.role !== "WORKER") {
    throw new ApiError(403, "Only workers can create profile");
  }

  // 🔹 2. Check if profile already exists
  const existingProfile = await WorkerProfile.findOne({ user: userId });
  if (existingProfile) {
    throw new ApiError(400, "Worker profile already exists");
  }

  const {
    name,
    dob,
    gender,
    education,
    workerType,
    skills,
    experienceYears,
    expectedDailyWage,
    city,
    state,
  } = req.body;

  // 🔹 3. Validation

  if (!name || name.trim().length < 2) {
    throw new ApiError(400, "Valid name is required");
  }

  if (!dob || isNaN(new Date(dob).getTime())) {
    throw new ApiError(400, "Valid date of birth is required");
  }

  if (!["MALE", "FEMALE", "OTHER"].includes(gender)) {
    throw new ApiError(400, "Invalid gender");
  }

  if (!workerType || !Array.isArray(workerType) || workerType.length === 0) {
    throw new ApiError(400, "Worker type is required");
  }

  if (
    experienceYears !== undefined &&
    (isNaN(experienceYears) || experienceYears < 0)
  ) {
    throw new ApiError(400, "Invalid experience");
  }
  if (!city || !state) {
    throw new ApiError(400, "City and state are required");
  }

  if (
    expectedDailyWage === undefined ||
    isNaN(expectedDailyWage) ||
    expectedDailyWage < 0
  ) {
    throw new ApiError(400, "Invalid expected daily wage");
  }

  if (skills && !Array.isArray(skills)) {
    throw new ApiError(400, "Skills must be an array");
  }

  let photoUrl = null;

  if (req.file) {
    photoUrl = await uploadToS3(req.file);
  }

  // 🔹 4. Create profile
  const profile = await WorkerProfile.create({
    user: userId,
    name: name.trim(),
    dob,
    gender,
    education,
    workerType,
    skills: skills || [],
    experienceYears: experienceYears || 0,
    expectedDailyWage,
    photo: photoUrl || null,
  });

  // 🔹 5. Sync User basic data (FIX)
  await User.findByIdAndUpdate(userId, {
    name: name.trim(),
    "location.city": city || null,
    "location.state": state || null,
    isProfileComplete: true,
  });
  // 🔹 6. Response
  return res
    .status(201)
    .json(new ApiResponse(201, profile, "Worker profile created successfully"));
});

//------------------------------------------------------------
//get worker profile
export const getWorkerProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 🔹 1. Ensure role is WORKER
  if (req.user.role !== "WORKER") {
    throw new ApiError(403, "Only workers can access this profile");
  }

  // 🔹 2. Find profile
  const profile = await WorkerProfile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Worker profile not found");
  }
  console.log("FILE:", req.file);
  // 🔹 3. Response
  return res
    .status(200)
    .json(new ApiResponse(200, profile, "Worker profile fetched successfully"));
});

//------------------------------------------------------------

//update worker profile
export const updateWorkerProfile = asyncHandler(async (req, res) => {
  console.log("REQ FILE:", req.file);
  console.log("REQ BODY:", req.body);
  const userId = req.user._id;

  // 🔹 1. Role check
  if (req.user.role !== "WORKER") {
    throw new ApiError(403, "Only workers can update profile");
  }

  // 🔹 2. Find profile
  const profile = await WorkerProfile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Worker profile not found");
  }

  const {
    name,
    dob,
    gender,
    education,
    workerType,
    skills,
    experienceYears,
    expectedDailyWage,
    isAvailable,
  } = req.body;

  // 🔹 3. Conditional Updates + Validation

  if (name !== undefined) {
    if (name.trim().length < 2) {
      throw new ApiError(400, "Invalid name");
    }
    profile.name = name.trim();
  }

  if (dob !== undefined) {
    if (isNaN(new Date(dob).getTime())) {
      throw new ApiError(400, "Invalid DOB");
    }
    profile.dob = dob;
  }

  if (gender !== undefined) {
    if (!["MALE", "FEMALE", "OTHER"].includes(gender)) {
      throw new ApiError(400, "Invalid gender");
    }
    profile.gender = gender;
  }

  if (education !== undefined) {
    profile.education = education;
  }

  if (workerType !== undefined) {
    if (!Array.isArray(workerType) || workerType.length === 0) {
      throw new ApiError(400, "Invalid worker type");
    }
    profile.workerType = workerType;
  }

  if (skills !== undefined) {
    if (!Array.isArray(skills)) {
      throw new ApiError(400, "Skills must be array");
    }
    profile.skills = skills;
  }

  if (experienceYears !== undefined) {
    if (isNaN(experienceYears) || experienceYears < 0) {
      throw new ApiError(400, "Invalid experience");
    }
    profile.experienceYears = experienceYears;
  }

  if (expectedDailyWage !== undefined) {
    if (isNaN(expectedDailyWage) || expectedDailyWage < 0) {
      throw new ApiError(400, "Invalid wage");
    }
    profile.expectedDailyWage = expectedDailyWage;
  }

  if (isAvailable !== undefined) {
    profile.isAvailable = isAvailable;
  }

  if (req.file) {
    profile.photo = await uploadToS3(req.file);
  }

  // 🔹 4. Save updated profile
  await profile.save();

  // 🔹 5. Response
  return res
    .status(200)
    .json(new ApiResponse(200, profile, "Worker profile updated successfully"));
});

//---------------------------------------------------------
//Availability toggle (simple endpoint to update availability status)
export const toggleAvailability = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  // 🔹 1. Role check
  if (req.user.role !== "WORKER") {
    throw new ApiError(403, "Only workers can update availability");
  }

  const { isAvailable } = req.body;

  // 🔹 2. Validate input
  if (typeof isAvailable !== "boolean") {
    throw new ApiError(400, "isAvailable must be true or false");
  }

  // 🔹 3. Find profile
  const profile = await WorkerProfile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Worker profile not found");
  }

  // 🔹 4. Update availability
  profile.isAvailable = isAvailable;
  await profile.save();

  // 🔹 5. Response (keep it lightweight)
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isAvailable: profile.isAvailable },
        "Availability updated successfully",
      ),
    );
});
