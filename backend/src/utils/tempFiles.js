/**
 * Temporary file manager for job queue.
 *
 * Instead of serializing PDF buffers as base64 into Redis (expensive),
 * writes files to disk with unique names and passes the file path
 * through the queue. Worker reads from disk, then cleans up.
 *
 * On Koyeb: /tmp is ephemeral per-instance — perfect for temp files.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const TEMP_DIR = path.join(process.env.TEMP_DIR || "/tmp", "exam-uploads");

// Ensure directory exists on module load
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Save a multer buffer to a temp file.
 * @param {Buffer} buffer — file content
 * @param {string} originalName — original filename (for extension)
 * @returns {string} absolute path to the temp file
 */
function saveTempFile(buffer, originalName = "file.pdf") {
  const ext = path.extname(originalName) || ".pdf";
  const id = crypto.randomBytes(12).toString("hex");
  const filePath = path.join(TEMP_DIR, `${id}${ext}`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

/**
 * Read a temp file back into a multer-compatible object.
 * @param {string} filePath — absolute path
 * @param {string} originalName — original filename
 * @returns {{ buffer: Buffer, originalname: string, mimetype: string }}
 */
function readTempFile(filePath, originalName = "file.pdf") {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Temp file not found: ${filePath}`);
  }
  const buffer = fs.readFileSync(filePath);
  return {
    buffer,
    originalname: originalName,
    mimetype: "application/pdf",
  };
}

/**
 * Delete a temp file (fire-and-forget).
 * @param {string} filePath
 */
function cleanupTempFile(filePath) {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // Ignore — file may already be gone
  }
}

/**
 * Periodic cleanup of orphaned temp files older than maxAgeMs.
 * Call on startup / interval.
 */
function cleanupOldTempFiles(maxAgeMs = 30 * 60 * 1000) {
  try {
    if (!fs.existsSync(TEMP_DIR)) return;
    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    let cleaned = 0;

    for (const file of files) {
      const fp = path.join(TEMP_DIR, file);
      try {
        const stat = fs.statSync(fp);
        if (now - stat.mtimeMs > maxAgeMs) {
          fs.unlinkSync(fp);
          cleaned++;
        }
      } catch {
        // Ignore
      }
    }

    if (cleaned > 0) {
      console.log(`[TempFiles] Cleaned ${cleaned} orphaned files`);
    }
  } catch {
    // Ignore
  }
}

module.exports = { saveTempFile, readTempFile, cleanupTempFile, cleanupOldTempFiles, TEMP_DIR };
