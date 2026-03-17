function normalizeOption(value) {
  if (value == null) return null;
  const v = String(value).trim().toUpperCase();
  if (!v) return null;
  // allow A/B/C/D only for now
  if (!["A", "B", "C", "D"].includes(v)) return null;
  return v;
}

function scoreResponses({ responses, answerKey, markingScheme }) {
  const { correct: correctMarks, incorrect: incorrectMarks } = markingScheme;

  let correct = 0;
  let incorrect = 0;
  let unattempted = 0;

  const allQuestions = Object.keys(answerKey);

  for (const q of allQuestions) {
    const key = normalizeOption(answerKey[q]);
    const ans = normalizeOption(responses?.[q]);

    if (!ans) {
      unattempted += 1;
      continue;
    }

    if (ans === key) correct += 1;
    else incorrect += 1;
  }

  const marks = correct * correctMarks + incorrect * incorrectMarks;

  return {
    marks,
    correct,
    incorrect,
    unattempted,
    totalQuestions: allQuestions.length,
  };
}

module.exports = { scoreResponses };

