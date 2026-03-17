const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const env = {
  port: Number(process.env.BACKEND_PORT || process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "",
  parserUrl: process.env.PARSER_URL || "http://localhost:5001",
  uploadMaxMb: Number(process.env.UPLOAD_MAX_MB || 10),
};

module.exports = { env, requireEnv };

