const fs = require("fs");
const path = require("path");

function loadAnswerKey(exam) {
  if (exam !== "nimcet") {
    const err = new Error(`Unsupported exam: ${exam}`);
    err.statusCode = 400;
    err.code = "UnsupportedExam";
    throw err;
  }

  const keyPath = path.resolve(process.cwd(), "..", "shared", "nimcet_answer_key.json");
  const raw = fs.readFileSync(keyPath, "utf-8");
  const json = JSON.parse(raw);
  return json;
}

module.exports = { loadAnswerKey };

