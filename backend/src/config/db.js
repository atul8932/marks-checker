const mongoose = require("mongoose");
const { getResultModel } = require("../models/Result");

async function connectMongo(mongoUri) {
  if (!mongoUri) {
    throw new Error("MONGO_URI is not set.");
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10_000,
  });

  // Create compound indexes for fast result lookups
  const exams = ["nimcet", "cuet", "rrb"];
  for (const exam of exams) {
    const Model = getResultModel(exam);
    await Model.collection.createIndex(
      { applicationNo: 1, rollNo: 1 },
      { background: true }
    );
  }

  return mongoose.connection;
}

module.exports = { connectMongo };

