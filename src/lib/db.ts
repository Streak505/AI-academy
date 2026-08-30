import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI?.trim();

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cached = globalWithMongoose.mongooseCache || {
  conn: null,
  promise: null,
};

globalWithMongoose.mongooseCache = cached;

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI. Set it in .env.local with your MongoDB Atlas connection string.");
  }

  if (cached.conn) {
    return cached.conn.connection;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).catch((error) => {
      cached.promise = null;
      throw error;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn.connection;
}
