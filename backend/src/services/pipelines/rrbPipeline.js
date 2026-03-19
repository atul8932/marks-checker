const { parsePdf } = require("../parserClient");
const { validateParsedResponses } = require("../validation/nimcetResponseValidation");
const { logger } = require("../../utils/logger");

async function runRrbPipeline({ parserUrl, file }) {
  const exam = "rrb";

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
    exam: "rrb",
  });

  const cleanedResponses = validation.cleanedResponses;
  const { marks: totalMarks, correct: totalCorrect, incorrect: totalIncorrect, unattempted: totalUnattempted } =
    calculateRrbScore(cleanedResponses, answerKeyRaw);

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
 * Pure scoring function for RRB. Can be called independently for recalculation.
 * Marking: +1 correct, -1/3 incorrect.
 * @param {Object} responses - { Q1: "A", Q2: "B", ... }
 * @param {Object} answerKey  - { Q1: "C", Q2: "B", ... }
 */
function calculateRrbScore(responses, answerKey) {
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
      totalMarks += 1;
    } else {
      totalIncorrect += 1;
      totalMarks -= 1 / 3;
    }
  }

  return { marks: totalMarks, correct: totalCorrect, incorrect: totalIncorrect, unattempted: totalUnattempted };
}

module.exports = { runRrbPipeline, calculateRrbScore };

