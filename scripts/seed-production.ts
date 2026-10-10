import dotenv from "dotenv";
import mongoose from "mongoose";
import { logMongoError } from "../src/lib/db";
import { seedAcademyData } from "./seed";
import { configureDnsFromEnvironment } from "./configure-dns";

dotenv.config({ path: ".env.production.local", override: true });
configureDnsFromEnvironment();

seedAcademyData({ production: true }).catch(async (error) => {
  logMongoError("Production seed", error);
  await mongoose.disconnect();
  process.exit(1);
});
