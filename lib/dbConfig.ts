import mongoose from 'mongoose';

// Corrected variable name to MONGODB_URI for consistency with environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://master:cnvhh5PgigDyVcug@cluster1.8q5zuri.mongodb.net/cms-auto-parts';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

// Initializing the global cache if it doesn't exist.
// Using 'globalThis' for broader compatibility (Node.js/browser environments, Next.js).
(globalThis as any).mongoose = (globalThis as any).mongoose || undefined;

let cached: MongooseCache = (globalThis as any).mongoose;

if (!cached) {
  // Initialize the cache object
  cached = { conn: null, promise: null };
  (globalThis as any).mongoose = cached;
}

async function connectDB() {
  // If connection is already established, return it immediately.
  // Note: The original file had additional readyState checks (1, 2) which are
  // often beneficial in serverless environments, but we are simplifying
  // to match the structure of the requested example.
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      // Adjusted options to match the requested simpler example
      bufferCommands: true,
      maxPoolSize: 10,
      // You can add back the other options from the original file if needed, e.g.:
      // serverSelectionTimeoutMS: 5000,
      // socketTimeoutMS: 45000,
      // family: 4,
    };
    
    // Assign the connection promise to the cached promise.
    // The promise resolves to a mongoose instance.
    cached.promise = mongoose.connect(MONGODB_URI, opts);

    // Optional: Re-add error listeners to handle disconnections/errors outside of the initial connect call
    // by using .then() on the promise to get the connection object, but this makes the logic more complex
    // and is not shown in the example you provided. We'll stick to the simpler structure for now.
  }

  try {
    // Await the promise to get the connection and cache it.
    // If the connection fails, it will be caught below.
    cached.conn = await cached.promise;
    console.log('MongoDB connected successfully'); // Added console log for success
    return cached.conn;
  } catch (e) {
    // If connection fails, reset the promise so a new attempt can be made.
    cached.promise = null;
    console.error('MongoDB connection error:', e); // Added console log for error
    throw e;
  }
}

export default connectDB;