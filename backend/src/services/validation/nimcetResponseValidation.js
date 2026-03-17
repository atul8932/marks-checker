function normalizeOption(value, exam = "nimcet") {
  if (value == null) return null;
  const v = String(value).trim();
  if (!v) return null;
  
  // NIMCET uses 'A', 'B', 'C', 'D'
  if (exam === "nimcet") {
    const vUpper = v.toUpperCase();
    if (!["A", "B", "C", "D"].includes(vUpper)) return null;
    return vUpper;
  }
  
  // CUET uses long numeric IDs (8-13 digits). Return them as-is.
  if (exam === "cuet") {
    if (!/^\d{8,13}$/.test(v)) return null;
    return v;
  }
  
  return v;
}

function validateParsedResponses({ responses, answerKey, exam = "nimcet" }) {
  const examName = exam.toUpperCase();
  
  if (!responses || typeof responses !== "object") {
    const err = new Error("Could not read answers from the PDF. Please upload a valid response sheet PDF.");
    err.statusCode = 400;
    err.code = "InvalidResponses";
    throw err;
  }

  const expectedQuestions = Object.keys(answerKey || {}).length;
  const entries = Object.entries(responses);

  const cleaned = {};
  let invalidCount = 0;
  let unknownQuestionCount = 0;

  for (const [k, v] of entries) {
    const key = String(k || "").trim().toUpperCase();
    if (!/^Q\d{1,3}$/.test(key)) {
      invalidCount += 1;
      continue;
    }
    if (!Object.prototype.hasOwnProperty.call(answerKey, key)) {
      unknownQuestionCount += 1;
      continue;
    }
    const opt = normalizeOption(v, exam);
    if (!opt) {
      invalidCount += 1;
      continue;
    }
    cleaned[key] = opt;
  }

  const extractedQuestions = Object.keys(cleaned).length;

  if (expectedQuestions <= 0) {
    const err = new Error("Answer key is missing or invalid on the server.");
    err.statusCode = 500;
    err.code = "InvalidAnswerKey";
    throw err;
  }

  if (extractedQuestions === 0) {
    const err = new Error(
      `No answers could be extracted from this PDF. Please upload the correct ${examName} response sheet PDF.`
    );
    err.statusCode = 400;
    err.code = "EmptyResponses";
    throw err;
  }

  if (extractedQuestions > expectedQuestions) {
    const err = new Error("Extracted answers exceed expected questions. Please upload a valid response sheet PDF.");
    err.statusCode = 400;
    err.code = "TooManyResponses";
    throw err;
  }

  if (unknownQuestionCount > Math.max(3, Math.floor(expectedQuestions * 0.05))) {
    const err = new Error(`This PDF does not look like a valid ${examName} response sheet.`);
    err.statusCode = 400;
    err.code = "MismatchedResponses";
    throw err;
  }

  return {
    cleanedResponses: cleaned,
    expectedQuestions,
    extractedQuestions,
    invalidCount,
    unknownQuestionCount,
  };
}

module.exports = { validateParsedResponses };

