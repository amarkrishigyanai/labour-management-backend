import { Job } from "../models/job.model.js";
import { JobApplication } from "../models/jobApplication.model.js";
import { WorkerProfile } from "../models/workerProfile.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createJob = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 🔹 Only employer can post job
  if (req.user.role !== "EMPLOYER") {
    throw new ApiError(403, "Only employers can post jobs");
  }

  const {
    title,
    description,
    workerType,
    location,
    salary,
    facilities,
    numberOfWorkers,
    startDate,
  } = req.body;

  // 🔹 Validation
  if (
    !title ||
    !description ||
    !workerType ||
    !salary?.amount ||
    !salary?.type ||
    !numberOfWorkers ||
    !startDate
  ) {
    throw new ApiError(400, "All required fields must be provided");
  }

  const job = await Job.create({
    employer: userId,
    title: title.trim(),
    description,
    workerType,
    location,
    salary,
    facilities,
    numberOfWorkers,
    startDate,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, job, "Job created successfully"));
});

//get myjob
export const getMyJobs = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 🔹 Only employer
  if (req.user.role !== "EMPLOYER") {
    throw new ApiError(403, "Only employers can access their jobs");
  }

  const jobs = await Job.find({ employer: userId }).sort({ createdAt: -1 }); // latest first

  return res
    .status(200)
    .json(new ApiResponse(200, jobs, "Employer jobs fetched successfully"));
});

//update job-------------------------------------------------
export const updateJob = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const jobId = req.params.id;

  const job = await Job.findById(jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  // 🔥 Ownership check
  if (job.employer.toString() !== userId.toString()) {
    throw new ApiError(403, "Not authorized to update this job");
  }

  const {
    title,
    description,
    workerType,
    location,
    salary,
    facilities,
    numberOfWorkers,
    startDate,
    status,
  } = req.body;

  // 🔹 Update only provided fields
  if (title) job.title = title;
  if (description) job.description = description;
  if (workerType) job.workerType = workerType;
  if (location) job.location = location;
  if (salary) job.salary = salary;
  if (facilities) job.facilities = facilities;
  if (numberOfWorkers) job.numberOfWorkers = numberOfWorkers;
  if (startDate) job.startDate = startDate;
  if (status) job.status = status;

  await job.save();

  return res
    .status(200)
    .json(new ApiResponse(200, job, "Job updated successfully"));
});

//delete job-------------------------------------------------
export const deleteJob = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const jobId = req.params.id;

  const job = await Job.findById(jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  // 🔥 Ownership check
  if (job.employer.toString() !== userId.toString()) {
    throw new ApiError(403, "Not authorized to delete this job");
  }

  await job.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Job deleted successfully"));
});

//toggle job status-------------------------------------------------
export const toggleJobStatus = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const jobId = req.params.id;

  const job = await Job.findById(jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.employer.toString() !== userId.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  job.status = job.status === "OPEN" ? "CLOSED" : "OPEN";

  await job.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { status: job.status }, "Job status updated"));
});

// ----------------------------------------Get Jobs API (Worker Side)
export const getJobs = asyncHandler(async (req, res) => {
  if (req.user.role !== "WORKER") {
    throw new ApiError(403, "Only workers can view jobs");
  }

  const {
    workerType,
    state,
    city,
    minWage,
    maxWage,
    page = 1,
    limit = 10,
  } = req.query;

  const pageNum = Number(page) || 1;
  const limitNum = Math.min(Number(limit) || 10, 50);
  const skip = (pageNum - 1) * limitNum;

  const query = { status: "OPEN" };

  // 🔹 Worker Type (multi support)
  if (workerType) {
    const types = workerType.split(",");
    query.workerType = { $in: types };
  }

  // 🔹 Location
  if (state) query["location.state"] = state;
  if (city) query["location.city"] = city;

  // 🔹 Salary filter
  if (minWage || maxWage) {
    query["salary.amount"] = {
      ...(minWage && { $gte: Number(minWage) }),
      ...(maxWage && { $lte: Number(maxWage) }),
    };
  }

  const jobs = await Job.find(query)
    .select("title salary facilities location workerType createdAt employer")
    .populate("employer", "name phone")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Job.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        jobs,
      },
      "Jobs fetched successfully",
    ),
  );
});

//Apply Job
export const applyJob = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const jobId = req.params.id;

  // 🔹 1. Role check
  if (req.user.role !== "WORKER") {
    throw new ApiError(403, "Only workers can apply for jobs");
  }

  // 🔹 2. Validate jobId
  if (!jobId) {
    throw new ApiError(400, "Job ID is required");
  }

  // 🔹 3. Check job exists
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  // 🔹 4. Check job status
  if (job.status !== "OPEN") {
    throw new ApiError(400, "Job is not open for applications");
  }

  // 🔹 5. Prevent duplicate apply
  const alreadyApplied = await JobApplication.findOne({
    job: jobId,
    worker: userId,
  });

  if (alreadyApplied) {
    throw new ApiError(400, "You already applied for this job");
  }

  // 🔹 6. Create application
  const application = await JobApplication.create({
    job: jobId,
    worker: userId,
  });

  // 🔹 7. Response
  return res
    .status(201)
    .json(new ApiResponse(201, application, "Job applied successfully"));
});

/*******************get applied jobs************** */
export const getAppliedJobs = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  //1.role check
  if (req.user.role !== "WORKER") {
    throw new ApiError(403, "Only workers can view their applied jobs");
  }

  //2.fetch applications
  const applications = await JobApplication.find({ worker: userId })
    .populate({
      path: "job",
      select: "title salary facilities location status employer createdAt",
      populate: {
        path: "employer",
        select: "name phone",
      },
    })
    .sort({ createdAt: -1 });
  // 🔹 3. Response
  return res
    .status(200)
    .json(
      new ApiResponse(200, applications, "Applied jobs fetched successfully"),
    );
});

//-----------------------------getApplicants ----------------

export const getApplicants = asyncHandler(async (req, res) => {
  const jobId = req.params.id;
  const userId = req.user._id;

  if (req.user.role !== "EMPLOYER") {
    throw new ApiError(403, "Only employers can view applicants");
  }

  const job = await Job.findById(jobId);
  if (!job) throw new ApiError(404, "Job not found");

  if (job.employer.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized");
  }

  const applications = await JobApplication.find({ job: jobId })
    .populate("worker", "phone name location rating")
    .sort({ createdAt: -1 });

  // 🔥 Attach worker profile manually
  const result = await Promise.all(
    applications.map(async (app) => {
      const profile = await WorkerProfile.findOne({
        user: app.worker._id,
      }).select("workerType skills experienceYears expectedDailyWage");

      return {
        _id: app._id,
        status: app.status,
        createdAt: app.createdAt,
        worker: {
          ...app.worker.toObject(),
          profile: profile || null,
        },
      };
    }),
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Applicants fetched successfully"));
});

//------------------hire worker ------------
export const hireWorker = asyncHandler(async (req, res) => {
  const { jobId, applicationId } = req.params;
  const userId = req.user._id;

  // 🔹 1. Role check
  if (req.user.role !== "EMPLOYER") {
    throw new ApiError(403, "Only employers can hire workers");
  }

  // 🔹 2. Get job
  const job = await Job.findById(jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  // 🔹 3. Ownership check
  if (job.employer.toString() !== userId.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  // 🔹 4. Check job open
  if (job.status === "CLOSED") {
    throw new ApiError(400, "Job already closed");
  }

  // 🔹 5. Get application
  const application = await JobApplication.findById(applicationId);

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  if (application.job.toString() !== jobId) {
    throw new ApiError(400, "Invalid application");
  }

  // 🔹 6. Prevent double hiring
  if (application.status === "HIRED") {
    throw new ApiError(400, "Worker already hired");
  }

  // 🔹 7. Check capacity
  if (job.hiredWorkersCount >= job.numberOfWorkers) {
    throw new ApiError(400, "All positions already filled");
  }

  // 🔹 8. Hire worker
  application.status = "HIRED";
  await application.save();

  // 🔹 9. Increment count
  job.hiredWorkersCount += 1;

  // 🔹 10. If filled → close job & reject others
  if (job.hiredWorkersCount === job.numberOfWorkers) {
    job.status = "CLOSED";

    await JobApplication.updateMany(
      {
        job: jobId,
        status: { $ne: "HIRED" },
      },
      {
        $set: { status: "REJECTED" },
      },
    );
  }

  await job.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        hiredCount: job.hiredWorkersCount,
        required: job.numberOfWorkers,
        jobStatus: job.status,
      },
      "Worker hired successfully",
    ),
  );
});

//------complete job----------------
export const completeJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user._id;

  // 🔹 1. Find job
  const job = await Job.findById(jobId);
  if (!job) throw new ApiError(404, "Job not found");

  // 🔹 2. Authorization
  if (job.employer.toString() !== userId.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  // 🔹 3. Prevent duplicate completion
  if (job.status === "COMPLETED") {
    throw new ApiError(400, "Job already completed");
  }

  // 🔹 4. Get hired workers (SOURCE OF TRUTH)
  const hiredApplications = await JobApplication.find({
    job: jobId,
    status: "HIRED",
  });

  const hiredCount = hiredApplications.length;

  // ✅ Allow partial fulfillment
  if (hiredCount === 0) {
    throw new ApiError(400, "At least one hired worker is required");
  }

  // 🔹 5. Mark job completed
  job.status = "COMPLETED";
  await job.save();

  // 🔹 6. Update hired workers → COMPLETED
  await JobApplication.updateMany(
    { job: jobId, status: "HIRED" },
    { $set: { status: "COMPLETED" } },
  );

  // 🔹 7. Response
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        jobId: job._id,
        requiredWorkers: job.numberOfWorkers,
        hiredWorkers: hiredCount,
        status: job.status,
      },
      "Job completed successfully",
    ),
  );
});
