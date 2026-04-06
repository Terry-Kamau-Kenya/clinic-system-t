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
    console.log('Using cached connection, readyState:', mongoose.connection.readyState);
    return cached.conn;
  }

  // Recover when a warm serverless instance keeps a stale/disconnected connection.
  if (mongoose.connection.readyState === 0) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    console.log('Creating new connection promise');
    cached.promise = mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      maxPoolSize: 5,
      minPoolSize: 0,
    }).then((connection) => {
      console.log('MongoDB connected successfully');
      return connection;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log('Connection established');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

module.exports = dbConnect;
