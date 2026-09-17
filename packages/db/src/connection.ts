import mongoose from "mongoose";

const globalWithMongoose = global as typeof global & {
  mongoose?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

let cached = globalWithMongoose.mongoose;

if (!cached) {
  cached = globalWithMongoose.mongoose = {
    conn: null,
    promise: null,
  };
}

export async function connectDB() {
  const MONGO_URI = process.env.DATABASE_URL;
  if (!MONGO_URI) {
    throw new Error("DATABASE_URL is not set");
  }

  if (cached!.conn) return cached!.conn;

  if (!cached?.promise) {
    cached!.promise = mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000, maxPoolSize: 10 });
  }

  try {
    cached!.conn = await cached!.promise;
    console.log("MongoDB Connected successfully");
    return cached!.conn;
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    cached!.promise = null; // Reset promise so it can be retried
    throw error;
  }
}
export const isDatabaseReady = () => mongoose.connection.readyState === 1;
export async function disconnectDB() {
  await mongoose.disconnect();
  cached!.conn = null;
  cached!.promise = null;
}
