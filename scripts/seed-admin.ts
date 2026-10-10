import { academy } from "../src/config/academy";
import { hashPassword } from "../src/lib/auth";
import { User } from "../src/models/User";

export async function seedAdminAccount() {
  const email = (process.env.ADMIN_EMAIL?.trim() || academy.email).toLowerCase();
  if (email.startsWith("TODO_REPLACE") || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Set ADMIN_EMAIL or replace the academy email in src/config/academy.ts with a valid email address.");
  }

  const resetPassword = process.argv.includes("--reset-admin-password");
  const password = process.env.ADMIN_PASSWORD?.trim();
  const existingAdmin = await User.findOne({ email }).select("_id").lean();

  if ((!existingAdmin || resetPassword) && !password) {
    throw new Error("Set ADMIN_PASSWORD to create the admin or run with --reset-admin-password.");
  }

  const fields = {
    name: "Academy Admin",
    role: "ADMIN" as const,
    status: "ACTIVE" as const,
    emailVerified: true,
    isActive: true,
  };

  if (existingAdmin) {
    const update: Record<string, unknown> = { ...fields };
    if (resetPassword && password) update.passwordHash = await hashPassword(password);
    await User.updateOne({ _id: existingAdmin._id }, { $set: update });
    console.log(`Admin account updated: ${email}`);
    return;
  }

  if (!password) {
    throw new Error("Set ADMIN_PASSWORD to create the admin.");
  }
  await User.create({
    ...fields,
    authProvider: "local",
    email,
    passwordHash: await hashPassword(password),
  });
  console.log(`Admin account created: ${email}`);
}
