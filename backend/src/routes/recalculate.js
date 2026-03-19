const express = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { recalculate } = require("../controllers/recalculateController");

const router = express.Router();

router.post("/recalculate/:id", asyncHandler(recalculate));

module.exports = router;
