const { MongoClient } = require("mongodb");

// paste your connection string here
const uri = "YOUR_CONNECTION_STRING";

const client = new MongoClient(uri);

async function run() {
  try {
    // connect to MongoDB
    await client.connect();

    // ping the database
    await client.db("admin").command({ ping: 1 });

    console.log("✅ Connected successfully to MongoDB!");
  } catch (error) {
    console.error("❌ Connection failed:", error);
  } finally {
    await client.close();
  }
}

run();