const { getResultModel } = require("../models/Result");
const { runNimcetPipeline } = require("../services/pipelines/nimcetPipeline");
const { logger } = require("../utils/logger");

const { runCuetPipeline } = require("../services/pipelines/cuetPipeline");
const { runRrbPipeline } = require("../services/pipelines/rrbPipeline");

async function uploadAndScore(req, res) {
  const exam = String(req.body.exam || "nimcet").toLowerCase();

  const files = req.files || {};
  const file = files.file ? files.file[0] : null;
  const answerKeyFile = files.answerKeyFile ? files.answerKeyFile[0] : null;

  if (!file) {
    const err = new Error("PDF file is required.");
    err.statusCode = 400;
    err.code = "MissingFile";
    throw err;
  }

  const parserUrl = req.app.locals.parserUrl;
  let pipelineResult;

  if (exam === "nimcet") {
    pipelineResult = await runNimcetPipeline({ parserUrl, file });
  } else if (exam === "cuet") {
    if (!answerKeyFile) {
      const err = new Error("Answer Key PDF is required for CUET.");
      err.statusCode = 400;
      err.code = "MissingAnswerKey";
      throw err;
    }
    pipelineResult = await runCuetPipeline({ parserUrl, file, answerKeyFile });
  } else if (exam === "rrb") {
    pipelineResult = await runRrbPipeline({ parserUrl, file });
  } else {
    const err = new Error(`Unsupported exam: ${exam}`);
    err.statusCode = 400;
    err.code = "UnsupportedExam";
    throw err;
  }

  const { name, app_no, roll_no } = pipelineResult.candidateDetails || {};
  const isIdentified = app_no && app_no !== "Unknown" && roll_no && roll_no !== "Unknown";
  
  const ResultModel = getResultModel(exam);
  
  const query = isIdentified
    ? { applicationNo: app_no, rollNo: roll_no }
    : { _id: new (require("mongoose").Types.ObjectId)() };

  const updatePayload = {
    exam,
    name: name || "Unknown",
    applicationNo: app_no || "Unknown",
    rollNo: roll_no || "Unknown",
    marks: pipelineResult.marks,
    correct: pipelineResult.correct,
    incorrect: pipelineResult.incorrect,
    unattempted: pipelineResult.unattempted,
    responses: pipelineResult.responses,
  };

  const doc = await ResultModel.findOneAndUpdate(query, updatePayload, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  });

  logger.info(isIdentified ? "result_upserted" : "result_saved", { id: String(doc._id), exam, name, app_no });

  const payload = {
    marks: pipelineResult.marks,
    correct: pipelineResult.correct,
    incorrect: pipelineResult.incorrect,
    unattempted: pipelineResult.unattempted,
    confidence: pipelineResult.confidence,
    sections: pipelineResult.sections,
    candidateDetails: pipelineResult.candidateDetails,
    ...(pipelineResult.warning ? { warning: pipelineResult.warning } : null),
  };

  res.json(payload);
}

module.exports = { uploadAndScore };

