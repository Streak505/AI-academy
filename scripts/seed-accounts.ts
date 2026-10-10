import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectToDatabase, getMongoUri } from "../src/lib/db";
import { hashPassword } from "../src/lib/admin-auth";
import { User } from "../src/models/User";
import { Instructor } from "../src/models/Instructor";
import { configureDnsFromEnvironment } from "./configure-dns";
import { seedAdminAccount } from "./seed-admin";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });
configureDnsFromEnvironment();

const instructorPassword = process.env.INSTRUCTOR_PASSWORD?.trim();
const studentPassword = process.env.STUDENT_PASSWORD?.trim();
if (!instructorPassword || !studentPassword) throw new Error("Missing INSTRUCTOR_PASSWORD or STUDENT_PASSWORD. Set them before seeding.");

const accounts = [
  { name: "Ayesha Khan", email: "ayesha.khan@shahzaibroyalacademy.pk", password: instructorPassword, role: "INSTRUCTOR" as const },
  { name: "Usman Tariq", email: "usman.tariq@shahzaibroyalacademy.pk", password: instructorPassword, role: "INSTRUCTOR" as const },
  { name: "Hina Shahid", email: "hina.shahid@shahzaibroyalacademy.pk", password: instructorPassword, role: "INSTRUCTOR" as const },
  { name: "Ali Raza", email: "ali.raza@student.pk", password: studentPassword, role: "STUDENT" as const },
  { name: "Sara Ahmed", email: "sara.ahmed@student.pk", password: studentPassword, role: "STUDENT" as const },
  { name: "Hamza Malik", email: "hamza.malik@student.pk", password: studentPassword, role: "STUDENT" as const },
];

async function seedAccounts() {
  const mongoUri = new URL(getMongoUri());
  if (process.env.NODE_ENV === "production" || !["localhost", "127.0.0.1", "::1"].includes(mongoUri.hostname.toLowerCase())) {
    throw new Error("The demo account seed is for local development only and refuses production or remote databases.");
  }

  await connectToDatabase();
  await seedAdminAccount();

  for (const account of accounts) {
    const result = await User.findOneAndUpdate(
      { email: account.email },
      {
        $set: {
          name: account.name,
          passwordHash: await hashPassword(account.password),
          role: account.role,
          isActive: true,
        },
        $setOnInsert: { email: account.email },
      },
      { upsert: true }
    );
    if (account.role === "INSTRUCTOR") {
      const instructor = await Instructor.findOne({ email: account.email }).select("_id").lean();
      if (instructor) {
        await User.updateOne({ _id: result?._id }, { $set: { instructorProfile: instructor._id } });
        await Instructor.updateOne({ _id: instructor._id }, { $set: { user: result?._id } });
      }
    }
  }

  console.log(`Seeded ${accounts.length} local demo accounts.`);
}

seedAccounts()
  .catch((error) => {
    console.error("Account seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });