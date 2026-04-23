import express from "express";
import {
  createReview,
  getUserReviews,
} from "../controllers/review.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyJWT, createReview);
router.get("/user/:userId", getUserReviews);

export default router;
