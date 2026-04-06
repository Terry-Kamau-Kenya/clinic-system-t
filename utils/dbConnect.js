const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable');
}

const globalForMongoose = globalThis;
let cached = globalForMongoose.mongoose;

if (!cached) {
  cached = globalForMongoose.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Recover when a warm serverless instance keeps a stale/disconnected connection.
  if (mongoose.connection.readyState === 0) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 5,
      minPoolSize: 0,
    }).then((connection) => connection);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    console.error('MongoDB connection error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

module.exports = dbConnect;
