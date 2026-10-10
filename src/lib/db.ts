import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

export type MongoErrorCode =
  | "MISSING_URI"
  | "BAD_SCHEME"
  | "AUTH_FAILED"
  | "NETWORK_BLOCKED"
  | "DNS_FAILED"
  | "UNKNOWN";

const globalWithMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cached = globalWithMongoose.mongooseCache ?? {
  conn: null,
  promise: null,
};

globalWithMongoose.mongooseCache = cached;

const defaultDbName = "shahzaibroyalacademy";

function getDbName() {
  return process.env.MONGODB_DB?.trim() || defaultDbName;
}

export function getMongoUri() {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("MONGODB_URI is required in production.");
    }

    return "mongodb://127.0.0.1:27017/shahzaibroyalacademy";
  }

  if (!/^mongodb(?:\+srv)?:\/\//i.test(uri)) {
    throw new Error("MONGODB_URI must use mongodb:// or mongodb+srv://.");
  }

  if (process.env.NODE_ENV === "production") {
    let hostname: string;
    try {
      hostname = new URL(uri).hostname.toLowerCase();
    } catch {
      throw new Error("MONGODB_URI is not a valid MongoDB connection URI.");
    }

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      throw new Error("Production MONGODB_URI must not point to localhost or 127.0.0.1.");
    }
  }

  return uri;
}

export function describeMongoError(error: unknown): { code: MongoErrorCode; message: string } {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const errorCode = error && typeof error === "object" && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "";

  if (/MONGODB_URI is required/i.test(message)) {
    return { code: "MISSING_URI", message: "Set MONGODB_URI in the deployment environment." };
  }
  if (/must use mongodb:\/\//i.test(message)) {
    return { code: "BAD_SCHEME", message: "Use a mongodb:// or mongodb+srv:// connection URI." };
  }
  if (/authentication failed|auth failed|bad auth|not authorized/i.test(message) || errorCode === "18") {
    return { code: "AUTH_FAILED", message: "Check the MongoDB database username and password." };
  }
  if (/server selection timed out|server selection.*timeout|timed out.*server selection/i.test(message)) {
    return { code: "NETWORK_BLOCKED", message: "Check Atlas Network Access and allow the deployment IP." };
  }
  if (/ENOTFOUND|querySrv|DNS|EAI_AGAIN/i.test(message)) {
    return { code: "DNS_FAILED", message: "Check the MongoDB hostname and DNS/SRV configuration." };
  }

  return { code: "UNKNOWN", message: "Check the MongoDB connection configuration and server logs." };
}

export function getSafeMongoErrorDetails(error: unknown) {
  const value = error && typeof error === "object" ? error : undefined;
  const rawMessage = error instanceof Error
    ? error.message
    : value && "message" in value
      ? String(value.message)
      : String(error ?? "");
  const rawCode = value && "code" in value ? value.code : undefined;
  const safeMessage = rawMessage
    .replace(/\/\/[^@\s]+@/g, "//***:***@")
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"'`<>]+/gi, "[MongoDB URI redacted]");

  return {
    name: value && "name" in value ? String(value.name) : error instanceof Error ? error.name : "Unknown",
    code: typeof rawCode === "string" || typeof rawCode === "number" ? String(rawCode) : "N/A",
    message: safeMessage,
  };
}

export function logMongoError(context: string, error: unknown) {
  const classification = describeMongoError(error);
  const details = getSafeMongoErrorDetails(error);
  console.error(`[${context} ${classification.code}] ${classification.message}`, details);
}

export function getSafeDbInfo() {
  const uri = process.env.MONGODB_URI?.trim() || "mongodb://127.0.0.1:27017/shahzaibroyalacademy";
  let host = "unknown";

  try {
    host = new URL(uri).hostname || "unknown";
  } catch {
    host = "unknown";
  }

  return { host, dbName: getDbName() };
}

export async function connectDB() {
  try {
    const uri = getMongoUri();

    if (cached.conn) {
      return cached.conn;
    }

    if (!cached.promise) {
      cached.promise = mongoose.connect(uri, {
        dbName: getDbName(),
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
      }).catch((error) => {
        cached.promise = null;
        throw error;
      });
    }

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    logMongoError("MongoDB", error);
    throw error;
  }
}

export const connectToDatabase = connectDB;
