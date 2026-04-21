import express from "express";
import {
  createWorkerProfile,
  getWorkerProfile,
  updateWorkerProfile,
  updateProfilePhoto,
} from "../controllers/worker.controller.js";
import { toggleAvailability } from "../controllers/worker.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

//create
router.post(
  "/create",
  verifyJWT,
  allowRoles("WORKER"),
  upload.single("photo"),
  createWorkerProfile,
);

//get
router.get("/profile", verifyJWT, allowRoles("WORKER"), getWorkerProfile);

//update
router.patch(
  "/profile",
  verifyJWT,
  allowRoles("WORKER"),
  upload.single("photo"),
  updateWorkerProfile,
);

router.patch(
  "/profile/photo",
  verifyJWT,
  allowRoles("WORKER"),
  upload.single("photo"),
  updateProfilePhoto,
);

//toggle availability
router.patch(
  "/availability",
  verifyJWT,
  allowRoles("WORKER"),
  toggleAvailability,
);

export default router;
