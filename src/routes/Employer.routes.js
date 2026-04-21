import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import {
  createEmployerProfile,
  getEmployerProfile,
  updateEmployerProfile,
} from "../controllers/Employer.controller.js";

const router = express.Router();
//create profile
router.post(
  "/profile",
  verifyJWT,
  allowRoles("EMPLOYER"),
  createEmployerProfile,
);

//get profile
router.get("/profile", verifyJWT, allowRoles("EMPLOYER"), getEmployerProfile);

//update profile
router.patch(
  "/profile",
  verifyJWT,
  allowRoles("EMPLOYER"),
  updateEmployerProfile,
);

export default router;
