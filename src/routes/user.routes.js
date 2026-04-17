import express from "express";

import { sendOTP, verfiyOTP } from "../controllers/user.controller.js";

const router = express.Router();

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verfiyOTP);

export default router;
