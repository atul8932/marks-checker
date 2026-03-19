const express = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { getJobStatus } = require("../controllers/jobController");

const router = express.Router();

router.get("/job/:jobId", asyncHandler(getJobStatus));

module.exports = router;
