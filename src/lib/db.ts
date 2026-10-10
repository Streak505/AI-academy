import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cached = globalWithMongoose.mongooseCache ?? {
  conn: null,
  promise: null,
};

globalWithMongoose.mongooseCache = cached;

export function getMongoUri() {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("MONGODB_URI must be configured in production.");
    }

    return "mongodb://127.0.0.1:27017/aiacademy";
  }

  if (!/^mongodb(?:\+srv)?:\/\//i.test(uri)) {
    throw new Error("MONGODB_URI must use the mongodb:// or mongodb+srv:// scheme.");
  }

  return uri;
}

export async function connectDB() {
  const uri = getMongoUri();

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      dbName: "aiacademy",
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    }).catch((error) => {
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}

export const connectToDatabase = connectDB;
