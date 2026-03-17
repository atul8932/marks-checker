const mongoose = require("mongoose");

async function connectMongo(mongoUri) {
  if (!mongoUri) {
    throw new Error("MONGO_URI is not set.");
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10_000,
  });
  return mongoose.connection;
}

module.exports = { connectMongo };

