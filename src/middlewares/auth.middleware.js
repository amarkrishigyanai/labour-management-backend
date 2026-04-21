import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import ApiErrors from "../utils/ApiErrors.js";
import asyncHandler from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  // 🔹 1. Get token from header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiErrors(401, "Unauthorized - No token");
  }

  // 🔹 2. Extract token
  const token = authHeader.split(" ")[1];

  // 🔹 3. Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 🔹 4. Find user
  const user = await User.findById(decoded.id);

  if (!user) {
    throw new ApiErrors(401, "User not found");
  }

  // 🔹 5. Attach user
  req.user = user;

  next();
});
