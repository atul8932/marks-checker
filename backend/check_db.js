require('dotenv').config();
const mongoose = require('mongoose');

async function checkDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI is not defined in your .env file.");
    process.exit(1);
  }

  console.log(`⏳ Connecting to MongoDB at: ${uri.replace(/:.+@/, ':***@')} ...`);
  
  try {
    await mongoose.connect(uri);
    console.log("✅ Successfully connected to MongoDB Database!");
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("\n📂 Available Collections:", collections.map(c => c.name).join(", ") || "None found");
    
    // Query the 'results' collection (which corresponds to your Result model)
    const resultsCollection = mongoose.connection.db.collection('results');
    const count = await resultsCollection.countDocuments();
    console.log(`\n📈 Total documents in the 'results' collection: ${count}`);
    
    if (count > 0) {
      // Fetch the 5 most recent documents
      const recentDocs = await resultsCollection.find({}).sort({ _id: -1 }).limit(5).toArray();
      console.log("\n🔍 Showing the 5 most recent uploads:\n");
      
      recentDocs.forEach((doc, index) => {
        console.log(`--- Record #${index + 1} ---`);
        console.log(`  Exam        : ${doc.exam?.toUpperCase()}`);
        console.log(`  Total Marks : ${doc.marks}`);
        console.log(`  Breakdown   : ${doc.correct} Correct | ${doc.incorrect} Incorrect | ${doc.unattempted} Unattempted`);
        console.log(`  Time Logged : ${doc._id.getTimestamp().toLocaleString()}`);
        console.log("------------------------");
      });
    } else {
      console.log("\n⚠️ No results found. It seems nothing has been uploaded to the database yet.");
    }

  } catch (error) {
    console.error("\n❌ MongoDB Connection Error:", error.message);
    console.log("\nTroubleshooting Tips:");
    console.log("1. Ensure your MONGO_URI in the .env file has the correct username and password without angle brackets (< >).");
    console.log("2. Ensure your current IP address is whitelisted in MongoDB Atlas Network Access.");
  } finally {
    // Cleanly exit
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkDB();
