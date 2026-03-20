const express = require("express");
const { adminAuth } = require("../middleware/adminAuth");
const {
  getStats,
  getResults,
  getJobs,
  retryJob,
  getHealth,
} = require("../controllers/adminController");

const router = express.Router();

// All routes protected by adminAuth (rate limit + token verification)
router.get("/stats",         adminAuth, getStats);
router.get("/results",       adminAuth, getResults);
router.get("/jobs",          adminAuth, getJobs);
router.post("/job/:id/retry", adminAuth, retryJob);
router.get("/health",        adminAuth, getHealth);

module.exports = router;
