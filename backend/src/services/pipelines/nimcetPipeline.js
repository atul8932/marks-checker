const { loadAnswerKey } = require("../answerKey");
const { parsePdf } = require("../parserClient");
const { scoreResponses } = require("../scoring");
const { validateParsedResponses } = require("../validation/nimcetResponseValidation");
const { logger } = require("../../utils/logger");

async function runNimcetPipeline({ parserUrl, file }) {
  const exam = "nimcet";
  const expectedQuestions = 120;
  
  const parsed = await parsePdf({ parserUrl, file, expectedQuestions });
  
  const answerKey = parsed?.answerKey || {};

  logger.info("parser_response", {
    exam,
    confidence: parsed?.confidence,
    extracted: Object.keys(parsed?.responses || {}).length,
  });

  const responsesRaw = parsed?.responses || {};
  const answerKeyRaw = parsed?.answerKey || {};
  
  // Create a full 120-question answer key if parser couldn't extract some,
  // to avoid validation mismatch errors.
  const validationAnswerKey = {};
  for (let i = 1; i <= 120; i++) {
    const qLabel = `Q${i}`;
    validationAnswerKey[qLabel] = answerKeyRaw[qLabel] || "A"; // dummy default for unextracted keys so validation passes
  }

  const confidence =
    typeof parsed?.confidence === "number"
      ? Math.max(0, Math.min(1, parsed.confidence))
      : null;

  const validation = validateParsedResponses({
    responses: responsesRaw,
    answerKey: validationAnswerKey,
  });

  const cleanedResponses = validation.cleanedResponses;
  const { marks: totalMarks, correct: totalCorrect, incorrect: totalIncorrect, unattempted: totalUnattempted, sections } =
    calculateNimcetScore(cleanedResponses, answerKeyRaw);

  const derivedConfidence =
    expectedQuestions > 0 ? Object.keys(validationAnswerKey).length / expectedQuestions : 0;

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
    sections,
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
 * Pure scoring function for NIMCET. Can be called independently for recalculation.
 * @param {Object} responses - { Q1: "A", Q2: "B", ... }
 * @param {Object} answerKey  - { Q1: "C", Q2: "B", ... }
 */
function calculateNimcetScore(responses, answerKey) {
  let totalMarks = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalUnattempted = 0;

  const sections = {
    mathematics: { correct: 0, incorrect: 0, unattempted: 0, marks: 0 },
    logicalReasoning: { correct: 0, incorrect: 0, unattempted: 0, marks: 0 },
    computerAwareness: { correct: 0, incorrect: 0, unattempted: 0, marks: 0 },
    generalEnglish: { correct: 0, incorrect: 0, unattempted: 0, marks: 0 },
  };

  for (let i = 1; i <= 120; i++) {
    const qLabel = `Q${i}`;
    const ans = responses[qLabel];
    const key = answerKey[qLabel];

    let secKey = "";
    let posMarks = 0, negMarks = 0;

    if (i <= 50) {
      secKey = "mathematics"; posMarks = 12; negMarks = 3;
    } else if (i <= 90) {
      secKey = "logicalReasoning"; posMarks = 6; negMarks = 1.5;
    } else if (i <= 110) {
      secKey = "computerAwareness"; posMarks = 6; negMarks = 1.5;
    } else {
      secKey = "generalEnglish"; posMarks = 4; negMarks = 1;
    }

    if (!ans) {
      totalUnattempted += 1;
      sections[secKey].unattempted += 1;
      continue;
    }

    if (key && ans === key) {
      totalCorrect += 1;
      totalMarks += posMarks;
      sections[secKey].correct += 1;
      sections[secKey].marks += posMarks;
    } else {
      totalIncorrect += 1;
      totalMarks -= negMarks;
      sections[secKey].incorrect += 1;
      sections[secKey].marks -= negMarks;
    }
  }

  return { marks: totalMarks, correct: totalCorrect, incorrect: totalIncorrect, unattempted: totalUnattempted, sections };
}

module.exports = { runNimcetPipeline, calculateNimcetScore };

