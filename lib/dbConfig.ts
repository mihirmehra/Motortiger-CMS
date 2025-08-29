import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://master:cnvhh5PgigDyVcug@cluster1.8q5zuri.mongodb.net/cms-auto-parts';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  var mongoose: MongooseCache;
}

// Check if a cached connection exists on the global object
let cached = global.mongoose;

// If no cached connection exists, initialize it
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB(): Promise<Mongoose> {
  // If a connection is already established, return it
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection promise is not yet running, start a new one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    // Await the connection promise and cache the result
    cached.conn = await cached.promise;
    console.log('MongoDB connected successfully');
    return cached.conn;
  } catch (e) {
    // If connection fails, reset the promise and throw the error
    cached.promise = null;
    console.error('MongoDB connection error:', e);
    throw e;
  }
}

export default connectDB;