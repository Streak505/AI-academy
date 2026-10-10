import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB, describeMongoError, getMongoUri, getSafeDbInfo } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { User } from "../src/models/User";
import { Program } from "../src/models/Program";
import { Student } from "../src/models/Student";
import { CsrInitiative } from "../src/models/CsrInitiative";
import { configureDnsFromEnvironment } from "./configure-dns";
import { seedAdminAccount } from "./seed-admin";

type SeedOptions = { production?: boolean };

const programGroups = [
  {
    group: "academic",
    titles: ["Play Group", "Nursery & Prep", "Class 1–8", "Class 9–10", "1st Year & 2nd Year"],
  },
  {
    group: "career",
    titles: ["Career Assessment", "Degree Selection Guidance", "University Selection Guidance", "Parent Counseling Sessions", "Scholarship Guidance", "Study Abroad Guidance"],
  },
  {
    group: "entrepreneurship",
    titles: ["Business Idea Development", "Digital Marketing", "Freelancing", "Leadership Skills", "Financial Literacy", "Business Planning"],
  },
  {
    group: "international",
    titles: ["IELTS, PTE & Duolingo Test Preparation"],
  },
  {
    group: "professional",
    titles: ["Spoken English", "Public Speaking", "Digital Marketing", "Graphic Design", "Computer Skills", "MS Office", "AI Fundamentals", "Content Writing", "Personality Development"],
  },
] as const;

const internationalFeatures = [
  "Certified IELTS Trainer",
  "Online & Physical Classes",
  "International Instructor Sessions",
  "Listening, Reading, Writing & Speaking Preparation",
  "Mock Tests & Performance Evaluation",
  "Band Score Improvement Strategies",
  "PTE Preparation Classes",
  "Duolingo English Test Preparation",
  "Study Abroad Counseling",
];

const csrInitiatives = [
  "Special discounts for orphan students",
  "Special discounts for children of widows",
  "Merit-based scholarships",
  "Free career counseling sessions",
  "Community educational programs",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function seedLocalDemoAccounts() {
  const accounts = [
    { email: "teacher@shahzaibroyalacademy.local", name: "Demo Teacher", role: "INSTRUCTOR", password: process.env.INSTRUCTOR_PASSWORD?.trim() },
    { email: "parent@shahzaibroyalacademy.local", name: "Demo Parent", role: "PARENT", password: process.env.PARENT_PASSWORD?.trim() || process.env.STUDENT_PASSWORD?.trim() },
    { email: "student@shahzaibroyalacademy.local", name: "Demo Student", role: "STUDENT", password: process.env.STUDENT_PASSWORD?.trim() },
  ] as const;

  for (const account of accounts) {
    if (!account.password) throw new Error(`Set the password environment variable for the ${account.role.toLowerCase()} demo account.`);
    await User.findOneAndUpdate(
      { email: account.email },
      {
        $set: {
          name: account.name,
          passwordHash: await hashPassword(account.password),
          role: account.role,
          status: "ACTIVE",
          emailVerified: true,
          isActive: true,
          authProvider: "local",
        },
        $setOnInsert: { email: account.email },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  }

  const [parent, studentUser, academicProgram] = await Promise.all([
    User.findOne({ email: accounts[1].email }).select("_id").lean(),
    User.findOne({ email: accounts[2].email }).select("_id").lean(),
    Program.findOne({ group: "academic" }).sort({ order: 1 }).select("_id title").lean(),
  ]);
  if (!parent || !studentUser || !academicProgram) throw new Error("Unable to link the local demo parent and student.");
  await Student.findOneAndUpdate(
    { regNo: "SRA-2026-0001" },
    {
      $set: {
        user: studentUser._id,
        guardian: parent._id,
        fullName: "Demo Student",
        fatherName: "Demo Guardian",
        program: academicProgram._id,
        classLevel: academicProgram.title,
        phone: "03000000000",
        status: "active",
      },
      $setOnInsert: { regNo: "SRA-2026-0001", admissionDate: new Date() },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
}

export async function seedAcademyData({ production = false }: SeedOptions = {}) {
  if (!production) Reflect.set(process.env, "NODE_ENV", "development");
  const args = process.argv.slice(2);
  const { host, dbName } = getSafeDbInfo();
  console.log(`Seed target: ${host}/${dbName}`);

  const uri = getMongoUri();
  const target = new URL(uri);
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(target.hostname.toLowerCase());
  if (production && (!args.includes("--confirm") || isLocal)) {
    throw new Error("Production seed requires --confirm and a remote MongoDB URI.");
  }
  if (!production && !isLocal && !args.includes("--force-remote")) {
    throw new Error("Refusing to seed a remote database. Pass --force-remote to proceed.");
  }

  await connectDB();
  try {
    await seedAdminAccount();
    let order = 0;
    for (const group of programGroups) {
      for (const title of group.titles) {
        const features = title === "IELTS, PTE & Duolingo Test Preparation" ? internationalFeatures : [];
        const description = group.group === "academic"
          ? `Evening academic coaching for ${title} students, with regular guidance and progress support.`
          : `Practical ${title.toLowerCase()} guidance and coaching from Shahzaib Royal Academy.`;
        // TODO_REPLACE: These integer PKR figures are seed placeholders; confirm the academy fee schedule before publishing.
        const monthlyFee = group.group === "academic" ? 5000 : 8000;
        const admissionFee = group.group === "academic" ? 2000 : 3000;
        const program = {
          title,
          slug: `${group.group}-${slugify(title)}`,
          group: group.group,
          level: group.group === "academic" ? title : "",
          description,
          features,
          duration: group.group === "academic" ? "Academic year" : "To be confirmed",
          monthlyFee,
          admissionFee,
          mode: title === "IELTS, PTE & Duolingo Test Preparation" ? "Hybrid" : "Physical",
          isPublished: true,
          order: order++,
        };
        await Program.findOneAndUpdate(
          { slug: program.slug },
          { $set: program },
          { upsert: true, returnDocument: "after", setDefaultsOnInsert: true, runValidators: true }
        );
      }
    }

    for (const [index, title] of csrInitiatives.entries()) {
      await CsrInitiative.findOneAndUpdate(
        { title },
        {
          $set: {
            title,
            description: `${title}. Contact the academy to learn about eligibility and availability.`,
            icon: "school",
            order: index,
            isPublished: true,
          },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true, runValidators: true }
      );
    }

    if (!production) await seedLocalDemoAccounts();
    console.log(`${production ? "Production" : "Development"} academy seed completed successfully.`);
  } finally {
    await mongoose.disconnect();
  }
}

if (process.argv[1] && /(?:^|[\\/])seed\.ts$/.test(process.argv[1])) {
  dotenv.config({ path: ".env" });
  dotenv.config({ path: ".env.local", override: true });
  configureDnsFromEnvironment();
  seedAcademyData().catch((error) => {
    if (error instanceof Error && /refusing to seed|requires --confirm|password environment variable/i.test(error.message)) {
      console.error(error.message);
    } else {
      const { code, message } = describeMongoError(error);
      console.error(`Seed failed [${code}]: ${message}`);
    }
    void mongoose.disconnect();
    process.exit(1);
  });
}
