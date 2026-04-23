import express from "express";
import {
  createJob,
  updateJob,
  deleteJob,
  toggleJobStatus,
  getMyJobs,
  getJobs,
  applyJob,
  getAppliedJobs,
  getApplicants,
  hireWorker,
  completeJob,
} from "../controllers/job.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

/// 🔹 Specific routes FIRST
router.get("/applied", verifyJWT, allowRoles("WORKER"), getAppliedJobs);
router.post("/:id/apply", verifyJWT, allowRoles("WORKER"), applyJob);
router.get(
  "/:id/applicants",
  (req, res, next) => {
    console.log("🔥 HIT applicants route");
    next();
  },
  verifyJWT,
  allowRoles("EMPLOYER"),
  getApplicants,
);

// 🔹 Employer specific static route BEFORE "/"
router.get("/my-jobs", verifyJWT, allowRoles("EMPLOYER"), getMyJobs);

// 🔹 Generic route LAST
router.get("/", verifyJWT, allowRoles("WORKER"), getJobs);

// 🔹 Employer actions
router.post("/", verifyJWT, allowRoles("EMPLOYER"), createJob);
router.patch("/:id/status", verifyJWT, allowRoles("EMPLOYER"), toggleJobStatus);
router.patch("/:id", verifyJWT, allowRoles("EMPLOYER"), updateJob);
router.patch(
  "/:jobId/hire/:applicationId",
  verifyJWT,
  allowRoles("EMPLOYER"),
  hireWorker,
);
//complete job
router.patch(
  "/:jobId/complete",
  verifyJWT,
  allowRoles("EMPLOYER"),
  completeJob,
);
router.delete("/:id", verifyJWT, allowRoles("EMPLOYER"), deleteJob);

export default router;
