const { parsePdf } = require("../parserClient");
const { validateParsedResponses } = require("../validation/nimcetResponseValidation");
const { logger } = require("../../utils/logger");

async function runSscPipeline({ parserUrl, file, exam }) {
  const parsed = await parsePdf({ parserUrl, file, exam });

  const answerKeyRaw = parsed?.answerKey || {};
  const responsesRaw = parsed?.responses || {};
  const expectedQuestions = Object.keys(answerKeyRaw).length;

  logger.info("parser_response", {
    exam,
    confidence: parsed?.confidence,
    extracted: Object.keys(responsesRaw).length,
  });

  const validation = validateParsedResponses({
    responses: responsesRaw,
    answerKey: answerKeyRaw,
    exam,
  });

  const cleanedResponses = validation.cleanedResponses;
  const { marks: totalMarks, correct: totalCorrect, incorrect: totalIncorrect, unattempted: totalUnattempted } =
    calculateSscScore(cleanedResponses, answerKeyRaw);

  const confidence =
    typeof parsed?.confidence === "number"
      ? Math.max(0, Math.min(1, parsed.confidence))
      : null;

  const derivedConfidence =
    expectedQuestions > 0 ? Object.keys(cleanedResponses).length / expectedQuestions : 0;

  const finalConfidence =
    confidence == null ? derivedConfidence : Math.min(confidence, derivedConfidence);

  const warning =
    finalConfidence < 0.7 ? "Low confidence in parsing" : undefined;

  return {
    exam,
    marks: totalMarks,
    correct: totalCorrect,
    incorrect: totalIncorrect,
    unattempted: totalUnattempted,
    confidence: Number(finalConfidence.toFixed(2)),
    candidateDetails: parsed?.candidateDetails,
    warning,
    answerKey: answerKeyRaw,
    _debug: {
      expectedQuestions,
      extractedQuestions: validation.extractedQuestions,
      invalidCount: validation.invalidCount,
      unknownQuestionCount: validation.unknownQuestionCount,
    },
    responses: cleanedResponses,
  };
}

/**
 * Pure scoring function for SSC (MTS). Can be called independently for recalculation.
 * @param {Object} responses - { Q1: "OptionID", Q2: "OptionID", ... }
 * @param {Object} answerKey  - { Q1: "OptionID", Q2: "OptionID", ... }
 */
function calculateSscScore(responses, answerKey) {
  let totalMarks = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalUnattempted = 0;

  for (const qLabel of Object.keys(answerKey)) {
    const ans = responses[qLabel];
    const key = answerKey[qLabel];

    if (!ans || ans === "Unattempted" || ans === "Not Answered") {
      totalUnattempted += 1;
      continue;
    }

    if (key && ans === key) {
      totalCorrect += 1;
      totalMarks += 3; // +3 for correct in SSC MTS
    } else {
      totalIncorrect += 1;
      totalMarks -= 1; // -1 for incorrect in SSC MTS
    }
  }

  return { marks: totalMarks, correct: totalCorrect, incorrect: totalIncorrect, unattempted: totalUnattempted };
}

module.exports = { runSscPipeline, calculateSscScore };
