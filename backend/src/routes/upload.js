const express = require("express");
const multer = require("multer");
const { asyncHandler } = require("../utils/asyncHandler");
const { uploadAndScore } = require("../controllers/uploadController");

const router = express.Router();

const maxMb = Number(process.env.UPLOAD_MAX_MB || 10);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Math.max(1, maxMb) * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      const err = new Error("Only PDF files are allowed.");
      err.statusCode = 400;
      err.code = "InvalidFileType";
      return cb(err);
    }
    cb(null, true);
  },
});

router.post("/upload", upload.fields([
  { name: "file", maxCount: 1 },
  { name: "answerKeyFile", maxCount: 1 }
]), asyncHandler(uploadAndScore));

module.exports = router;

