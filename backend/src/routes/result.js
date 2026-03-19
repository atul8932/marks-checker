const express = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { getResult, downloadReport } = require("../controllers/resultController");
const { cacheResult } = require("../middleware/cache");

const router = express.Router();

router.get("/result/:id", cacheResult(600), asyncHandler(getResult));
router.get("/report/:id", asyncHandler(downloadReport));

module.exports = router;
