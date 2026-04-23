import express from "express";

import { sendOTP, verifyOTP, setRole } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.patch("/set-role", verifyJWT, setRole);

export default router;
