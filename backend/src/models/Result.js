const mongoose = require("mongoose");

const ResultSchema = new mongoose.Schema(
  {
    exam: { type: String, required: true, index: true },
    name: { type: String, default: "Unknown" },
    applicationNo: { type: String, default: "Unknown" },
    rollNo: { type: String, default: "Unknown" },
    marks: { type: Number, required: true },
    correct: { type: Number, required: true },
    incorrect: { type: Number, required: true },
    unattempted: { type: Number, required: true },
    responses: { type: Object, required: true },
    answerKey: { type: Object },
  },
  { timestamps: true }
);

function getResultModel(examName) {
  const collectionName = `${examName.toLowerCase()}_results`;
  
  if (mongoose.models[collectionName]) {
    return mongoose.models[collectionName];
  }
  
  return mongoose.model(collectionName, ResultSchema, collectionName);
}

module.exports = { getResultModel };

