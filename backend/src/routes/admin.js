const express = require("express");
const { getResultModel } = require("../models/Result");

const router = express.Router();

router.get("/results/:exam", async (req, res, next) => {
  try {
    const exam = String(req.params.exam).toLowerCase();
    
    // We only support these standard exams for now
    if (!["nimcet", "cuet", "rrb"].includes(exam)) {
      const err = new Error("Unsupported exam for admin panel.");
      err.statusCode = 400;
      throw err;
    }

    const ResultModel = getResultModel(exam);

    // Fetch all documents but exclude the massive 'responses' object to save bandwidth
    const results = await ResultModel.find({})
      .select("-responses")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ results });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
