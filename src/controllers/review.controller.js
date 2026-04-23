import { Review } from "../models/review.model.js";
import { Job } from "../models/job.model.js";
import { JobApplication } from "../models/jobApplication.model.js";
import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";

// =========================================
// CREATE REVIEW
// =========================================
export const createReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { jobId, rating, comment, targetUserId } = req.body;

  // 🔹 1. Validation
  if (!jobId || !rating) {
    throw new ApiError(400, "jobId and rating are required");
  }

  if (rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  // 🔹 2. Get job
  const job = await Job.findById(jobId);
  if (!job) throw new ApiError(404, "Job not found");

  if (job.status !== "COMPLETED") {
    throw new ApiError(400, "You can only review after job completion");
  }

  // 🔹 3. Review time window (7 days)
  const REVIEW_WINDOW_DAYS = 7;
  const diffDays =
    (Date.now() - new Date(job.updatedAt)) / (1000 * 60 * 60 * 24);

  if (diffDays > REVIEW_WINDOW_DAYS) {
    throw new ApiError(400, "Review window expired");
  }

  const isEmployer = job.employer.toString() === userId.toString();

  let revieweeId;

  // =========================================
  // 🔹 4. Employer flow → review worker
  // =========================================
  if (isEmployer) {
    if (!targetUserId) {
      throw new ApiError(400, "targetUserId is required for employer");
    }

    const application = await JobApplication.findOne({
      job: jobId,
      worker: targetUserId,
      status: { $in: ["HIRED", "COMPLETED"] },
    });

    if (!application) {
      throw new ApiError(403, "Invalid worker for this job");
    }

    revieweeId = targetUserId;
  }

  // =========================================
  // 🔹 5. Worker flow → review employer
  // =========================================
  else {
    const application = await JobApplication.findOne({
      job: jobId,
      worker: userId,
      status: { $in: ["HIRED", "COMPLETED"] },
    });

    if (!application) {
      throw new ApiError(403, "You are not part of this job");
    }

    revieweeId = job.employer;
  }

  // 🔹 6. Prevent self-review
  if (revieweeId.toString() === userId.toString()) {
    throw new ApiError(400, "You cannot review yourself");
  }

  // 🔹 7. Prevent duplicate review
  const existing = await Review.findOne({
    job: jobId,
    reviewer: userId,
    reviewee: revieweeId,
  });

  if (existing) {
    throw new ApiError(400, "You already reviewed this user");
  }

  // 🔹 8. Create review
  const review = await Review.create({
    job: jobId,
    reviewer: userId,
    reviewee: revieweeId,
    rating,
    comment,
  });

  // =========================================
  // 🔹 9. Update rating (safe pattern)
  // =========================================
  const user = await User.findById(revieweeId);

  const total = user.rating.totalReviews || 0;
  const avg = user.rating.average || 0;

  const newTotal = total + 1;
  const newAvg = (avg * total + rating) / newTotal;

  user.rating.totalReviews = newTotal;
  user.rating.average = Number(newAvg.toFixed(2));

  await user.save();

  // 🔹 10. Response
  return res.status(201).json(
    new ApiResponse(
      201,
      {
        review,
        updatedRating: user.rating,
      },
      "Review submitted successfully",
    ),
  );
});

// =========================================
// GET USER REVIEWS
// =========================================
export const getUserReviews = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // 🔹 1. Validate user
  const user = await User.findById(userId).select("name rating");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // 🔹 2. Fetch reviews
  const reviews = await Review.find({ reviewee: userId })
    .populate("reviewer", "name role")
    .populate("job", "title")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // 🔹 3. Count total
  const totalReviews = await Review.countDocuments({ reviewee: userId });

  // 🔹 4. Format response
  const formattedReviews = reviews.map((r) => ({
    _id: r._id,
    rating: r.rating,
    comment: r.comment,
    reviewer: r.reviewer
      ? {
          _id: r.reviewer._id,
          name: r.reviewer.name,
          role: r.reviewer.role,
        }
      : null,
    job: r.job
      ? {
          _id: r.job._id,
          title: r.job.title,
        }
      : null,
    createdAt: r.createdAt,
  }));

  // 🔹 5. Response
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          _id: user._id,
          name: user.name,
          rating: user.rating,
        },
        reviews: formattedReviews,
        pagination: {
          total: totalReviews,
          page,
          pages: Math.ceil(totalReviews / limit),
        },
      },
      "Reviews fetched successfully",
    ),
  );
});
